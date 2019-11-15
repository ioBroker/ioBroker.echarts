import React from 'react';
import PropTypes from 'prop-types';
import {withStyles} from '@material-ui/core/styles';
import Theme from "./Theme";
import DialogError from "./Dialogs/Error";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import Collapse from '@material-ui/core/Collapse';

import {DragDropContext, Draggable, Droppable} from "react-beautiful-dnd";

import {MdClose as IconClear} from 'react-icons/md';
import {MdFormatClear as IconClose} from 'react-icons/md';
import {MdMoreVert as IconMore} from 'react-icons/md';
import {MdSearch as IconFind} from 'react-icons/md';
import {MdPalette as IconDark} from 'react-icons/md';
import {MdExpandMore as IconCollapse} from 'react-icons/md';
import {MdKeyboardArrowRight as IconExpand} from 'react-icons/md';
import {DiDatabase as IconDatabase} from "react-icons/di";
import {TiChartLine as IconChart} from "react-icons/ti";

import List from "@material-ui/core/List";
import Drawer from "@material-ui/core/Drawer";
import Divider from "@material-ui/core/Divider";
import RootRef from "@material-ui/core/RootRef";
import Input from "@material-ui/core/Input";
import I18n from "@iobroker/adapter-react/i18n";
import IconButton from "@material-ui/core/IconButton";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";

const MENU_ITEM_HEIGHT = 48;

const styles = theme => ({
    drawerPaper: {
        position: 'relative',
        width: '100%', //Theme.menu.width,
        height: '100%',
        overflow: 'hidden'
    },
    toolbar: {
        height: Theme.toolbar.height
    },
    toolbarButtons: {
        color: theme.palette.type === 'dark' ? 'white !important' : 'black !important'
    },
    toolbarSearch: {
        width: 'calc(100% - 105px)',
        lineHeight: '34px',
        marginLeft: 5
    },
    iconButtons: {
        width: 32,
        height: 32,
        padding: 2
    },
    iconDropdownMenu: {
        paddingRight: 5
    },
    iconOnTheRight: {
        position: 'absolute',
        right: 10,
        top: 'calc(50% - 8px)'
    },
    menu: {
        width: '100%',
        height: '100%'
    },
    innerMenu: {
        width: '100%',
        height: 'calc(100% - 76px)',
        overflowX: 'hidden',
        overflowY: 'auto'
    },
    filterIcon: {
        width: 18,
        height: 18,
        borderRadius: 2,
        marginRight: 5
    },
    scriptIcon: {
        width: 18,
        height: 18,
        borderRadius: 2
    },
    gripHandle: {
        paddingRight: 13
    },
    noGripHandle: {
        width: 29
    },
    folder: {
        background: theme.palette.type === 'dark' ? '#6a6a6a' : '#e2e2e2',
        cursor: 'pointer',
        padding: 0,
        userSelect: 'none'
    },
    element: {
        cursor: 'pointer',
        padding: 0,
        userSelect: 'none'
    },
    reorder: {
        padding: '9px 16px 9px 9px',
    },
    expandButton: {
        width: 37,
        height: 37
    },
    selected: Theme.colors.selected,
    instances: {
        color: 'gray',
        fontSize: 'smaller'
    },
    childrenCount: {
        float: 'right',
        marginRight: 5,
        fontSize: 10,
        opacity: 0.4,
    },
    footer: {
        height: 24,
    },
    footerButtons: {
        '&:hover': {
            backgroundColor: '#dbdbdb'
        },
        color: theme.palette.type === 'dark' ? '#ffffff' : '#111111',
        cursor: 'pointer',
        marginTop: 1,
        marginRight: 2,
        height: 22,
        width: 22,
    },
    footerButtonsRight: {
        float: 'right'
    },
    subItem: {
        paddingLeft: theme.spacing(4),
    }
});

const getItemStyle = (isDragging, draggableStyle) => ({
    userSelect: 'none',
    background: isDragging ? 'lightgreen' : 'inherit',
    ...draggableStyle,
});

const prepareList = instances => {
    const result = [];
    // check if all parents exists
    instances.forEach(item => {
        result.push({
            id: item._id,
            title: item._id.replace(/^system\.adapter\./, ''),
            depth: 0,
            type: 'folder',
            parent: null,
            enabledDP: item.enabledDP
        });
    });
    return result;
};

class SideDrawer extends React.Component {
    constructor(props) {
        super(props);

        let expanded = window.localStorage ? window.localStorage.getItem('SideMenu.expanded') : '[]';
        try {
            expanded = JSON.parse(expanded) || [];
        } catch (e) {
            expanded = [];
        }

        this.inputRef = new React.createRef();

        this.state = {
            listItems: prepareList(props.instances || {}),
            expanded: expanded,
            problems: [],
            instances: props.instances || [],
            menuOpened: false,
            searchMode: false,
            searchText: ''
        };

        const newExp = this.ensureSelectedIsVisible();
        if (newExp) {
            this.state.expanded = newExp;
        }

        // debounce search process
        this.filterTimer = null;
    }

    static ensureSelectedIsVisibleStatic(selected, expanded, listItems) {
        expanded = JSON.parse(JSON.stringify(expanded));
        let changed = false;

        // ensure that the item is visible
        let el = typeof selected === 'object' ? selected : listItems.find(it => it.id === selected);
        do {
            // eslint-disable-next-line
            el = el && el.parent && listItems.find(it => it.id === el.parent);
            if (el) {
                if (expanded.indexOf(el.id) === -1) {
                    expanded.push(el.id);
                    changed = true;
                }
            }
        } while (el);
        return changed && expanded;
    }

    static getDerivedStateFromProps(props, state) {
        const newState = {};
        let changed = false;
        if (state.expertMode !== props.expertMode) {
            changed = true;
            newState.expertMode = props.expertMode;
        }

        const listItems = prepareList(props.instances || {});
        if (JSON.stringify(listItems) !== JSON.stringify(state.listItems)) {
            changed = true;
            newState.listItems = listItems;
        }

        if (state.width !== props.width) {
            changed = true;
            newState.width = props.width;
        }
        if (state.theme !== props.theme) {
            changed = true;
            newState.theme = props.theme;
        }

        if (props.selectId && state.selected !== props.selectId) {
            const item = state.listItems.find(item => item.id === props.selectId);

            if (!state.reorder && item) {
                const expanded = SideDrawer.ensureSelectedIsVisibleStatic(item, state.expanded, state.listItems);
                newState.selected = item.id;
                if (expanded) {
                    newState.expanded = expanded;
                }
                changed = true;
                window.localStorage && window.localStorage.setItem('SideMenu.selected', item.id);
            }
        }

        if (changed) {
            return newState;
        } else {
            return null;
        }
    }


    ensureSelectedIsVisible(selected, expanded) {
        SideDrawer.ensureSelectedIsVisibleStatic(selected || this.state.selected, expanded || this.state.expanded, this.state.listItems);
    }

    static filterListStatic(searchEnabled, listItems, noUpdate, searchMode, searchText, objects) {
        let newState = {listItems};

        if (searchEnabled !== false && searchMode && searchText) {
            const newList = listItems.map(dbItem => {
                let ret = {};

                Object.keys(dbItem.enabledDP).map(id => {
                    if ((dbItem.enabledDP[id].obj.common.name).toLowerCase().includes(searchText.toLowerCase())) {
                        ret[id] = JSON.parse(JSON.stringify(dbItem.enabledDP[id]));
                    }
                    return null;
                });
                const newItem = JSON.parse(JSON.stringify(dbItem));
                newItem.enabledDP = ret;
                return newItem;
            });

            newState = {};
            newState.filteredItems = newList;
        }


        if (searchEnabled === false) {
            newState.searchText = '';
            newState.searchMode = false;
        }

        //  if (!noUpdate && changed) {
        return newState;
        //} else {
        //    return null;
        //}

    }

    filterList(searchEnabled, listItems, cb) {
        const noUpdate = !!listItems;
        const newState = SideDrawer.filterListStatic(
            searchEnabled,
            listItems || this.state.listItems,
            noUpdate,
            this.state.searchMode,
            this.state.searchText,
            this.props.objects
        );

        //this.renderTree(newState);
        if (!noUpdate && newState) {
            this.setState(newState, () => cb && cb());
        } else {
            cb && cb();
        }
    }

    renderExpandCollapse(isOpen) {
        return isOpen ? (<IconCollapse/>) : (<IconExpand/>);
    }

    renderTree(itemsObj) {
        const {classes} = this.props;
        let items;
        if (this.state.searchMode && this.state.filteredItems && this.state.searchText) {
            //this.state.filteredItems ? items = this.state.filteredItems : items = itemsObj;
            items = this.state.filteredItems;
        } else {
            items = itemsObj;
        }

        return items.map(item => {
            const next = item.enabledDP || {};
            return (
                <List component="div" key={item.id}>
                    <ListItem component="div" button key="item{item.id}"
                              onClick={() => this.state.expanded.includes(item.id) ? this.onCollapse(item.id) : this.onExpand(item.id)}>
                        {this.renderExpandCollapse(this.state.expanded.includes(item.id))}
                        <ListItemIcon><IconDatabase/></ListItemIcon>
                        <ListItemText primary={item.title}/>
                    </ListItem>
                    <Collapse in={this.state.expanded.includes(item.id)} unmountOnExit>
                        <List component="div" disablePadding key={item.id}>
                            {Object.keys(next).map(id =>
                                (<ListItem component="div" button key={id} className={classes.subItem}>
                                        <ListItemIcon><IconChart/></ListItemIcon>
                                        <ListItemText primary={next[id].obj && next[id].obj.hasOwnProperty('common') ? next[id].obj.common.name : id}/>
                                </ListItem>))
                            }
                        </List>
                    </Collapse>
                </List>
            );
        });
    }

    getTextStyle(item) {
        if (!this.state.reorder && item.type !== 'folder') {
            return {
                //width: 130,
                width: `calc(100% - ${this.state.width > 350 ? 245 : 197}px)`,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                flex: 'none',
                padding: '0 16px 0 0'
            };
        } else {
            return {
                whiteSpace: 'nowrap',
                padding: '0 16px 0 0'
            };
        }
    }

    getToolbarButtons() {
        const result = [];
        const classes = this.props.classes;
        if (this.state.searchMode) {
            result.push((<RootRef key="searchInputRoof" rootRef={this.inputRef}><Input
                key="searchInput"
                value={this.state.searchText}
                className={classes.toolbarSearch}
                ref={this.inputRef}
                autoFocus={true}
                placeholder={I18n.t('Search...')}
                onChange={e => {
                    this.setState({searchText: e.target.value});
                    this.filterTimer && clearTimeout(this.filterTimer);
                    this.filterTimer = setTimeout(() => {
                        this.filterTimer = null;
                        this.filterList(true);
                        this.props.onSearch && this.props.onSearch(this.state.searchText);
                    }, 400);
                }}
            /></RootRef>));
            result.push((<IconButton
                key="disableSearch"
                className={classes.toolbarButtons}
                style={{float: 'right'}}
                title={I18n.t('End search mode')}
                onClick={e => {
                    e.stopPropagation();
                    this.filterList(false, null, () => this.props.onSearch && this.props.onSearch(this.state.searchText));
                }}
            ><IconClose/></IconButton>));
            this.state.searchText && result.push((<IconButton
                key="cleanSearch"
                mini="true"
                title={I18n.t('Clear search input')}
                className={classes.toolbarButtons}
                style={{marginTop: 7, float: 'right'}}
                onClick={e => {
                    e.stopPropagation();
                    this.setState({searchText: ''}, () => {
                        this.filterList(true, '');
                        this.props.onSearch && this.props.onSearch(this.state.searchText);
                    });
                }}
            ><IconClear fontSize="small"/></IconButton>));
        } else {
            if (!this.state.reorder) {
                // Open Menu
                result.push((
                    <IconButton
                        key="menuButton"
                        aria-label="More"
                        aria-owns={this.state.menuOpened ? 'long-menu' : undefined}
                        title={I18n.t('Menu')}
                        aria-haspopup="true"
                        onClick={event => {
                            event.stopPropagation();
                            event.preventDefault();
                            this.setState({menuOpened: true, menuAnchorEl: event.currentTarget});
                        }}
                    >
                        {/*<Badge className={classes.margin} badgeContent={this.getFilterBadge()}>*/}
                        <IconMore/>
                        {/*</Badge>*/}
                    </IconButton>));

                const selectedItem = this.state.listItems.find(it => it.id === this.state.selected);
                let children;
                if (selectedItem && this.state.width <= 350 && selectedItem.type === 'folder') {
                    children = this.state.listItems.filter(i => i.parent === this.state.selected);
                }

                // Menu
                result.push(this.getMainMenu(children, selectedItem));

                if (this.state.filterMenuOpened) {
                    result.push(this.getFilterMenu());
                }
            }

            // Search
            result.push((<IconButton
                key="search"
                disabled={this.state.reorder}
                className={classes.toolbarButtons}
                title={I18n.t('Search in scripts')}
                style={{float: 'right'}}
                onClick={e => {
                    e.stopPropagation();
                    this.setState({searchMode: true});
                }}
            ><IconFind/></IconButton>));
        }
        return result;
    }

    getMainMenu(children, selectedItem) {
        return (<Menu
            key="menu"
            id="long-menu"
            anchorEl={this.state.menuAnchorEl}
            open={this.state.menuOpened}
            onClose={() => this.setState({menuOpened: false, menuAnchorEl: null})}
            PaperProps={{
                style: {
                    maxHeight: MENU_ITEM_HEIGHT * 7.5,
                    //width: 200,
                },
            }}
        >
            {this.props.onThemeChange && (<MenuItem key="dark"
                                                    onClick={event => {
                                                        //event.stopPropagation();
                                                        //event.preventDefault();
                                                        this.onCloseMenu(() =>
                                                            this.props.onThemeChange(this.state.theme === 'dark' ? 'light' : 'dark'));
                                                    }}><IconDark
                className={this.props.classes.iconDropdownMenu}/>{this.state.theme === 'dark' ? I18n.t('Light style') : I18n.t('Dark style')}
            </MenuItem>)}
        </Menu>);
    }

    onCloseMenu(cb) {
        this.setState({menuOpened: false, menuAnchorEl: null, filterMenuOpened: false, menuAnchorFilterEl: null}, cb);
    }

    onClick(item, e) {
        e && e.stopPropagation();
        if (!this.state.reorder && item) {
            const expanded = this.ensureSelectedIsVisible(item);
            const newState = {selected: item.id};
            if (expanded) {
                newState.expanded = expanded;
            }
            this.setState(newState);
            window.localStorage && window.localStorage.setItem('SideMenu.selected', item.id);
        }
    }

    onDblClick(item, e) {
        e && e.stopPropagation();
        if (this.state.reorder) return;
        if (item.type === 'folder') {
            const isExpanded = this.state.expanded.includes(item.id);
            if (isExpanded) {
                this.onCollapse(item.id);
            } else {
                this.onExpand(item.id);
            }
        } else {
            this.onEdit(item);
        }
    }

    saveExpanded(expanded) {
        window.localStorage.setItem('SideMenu.expanded', JSON.stringify(expanded || this.state.expanded));
    }

    onExpand(id, e) {
        e && e.stopPropagation();
        if (this.state.expanded.indexOf(id) === -1) {
            const expanded = this.state.expanded.concat([id]);
            this.setState({expanded});
            this.saveExpanded(expanded);
        }
    }

    onCollapse(id, e) {
        e && e.stopPropagation();
        const pos = this.state.expanded.indexOf(id);
        if (pos !== -1) {
            const expanded = this.state.expanded.concat([]);
            expanded.splice(pos, 1);
            if (this.state.selected && this.state.selected.startsWith(id + '.')) {
                this.setState({expanded, selected: id});
                window.localStorage && window.localStorage.setItem('SideMenu.selected', id);
            } else {
                this.setState({expanded});
            }
            this.saveExpanded(expanded);
        }
    }

    render() {
        const {classes} = this.props;
        return [(
            <Drawer
                key="drawer"
                variant="permanent"
                className={classes.menu}
                classes={{paper: classes.drawerPaper}}
                anchor='left'
                onClick={() => this.onClick({id: ''})}
            >
                <div className={classes.toolbar} key="toolbar">
                    {this.getToolbarButtons()}
                </div>
                <Divider/>
                <DragDropContext
                    onDragStart={e => this.onDragStart(e)}
                    onDragEnd={e => this.onDragEnd(e)}
                    onDragUpdate={e => this.onDragUpdate(e)}
                >
                    <Droppable droppableId="droppable">
                        {(provided, snapshot) => (
                            <div ref={provided.innerRef}
                                //style={getListStyle(snapshot.isDraggingOver)}
                                 className={classes.innerMenu}>
                                {this.renderTree(this.state.listItems)}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
                <Divider/>
                <div className={classes.footer}>{
                    //this.getBottomButtons()
                }</div>
            </Drawer>),
            this.state.errorText ? (
                <DialogError onClose={() => this.setState({errorText: ''})} text={this.state.errorText}/>) : null
        ];
    }
}

SideDrawer.propTypes = {
    instances: PropTypes.array.isRequired,
    expertMode: PropTypes.bool,
    onThemeChange: PropTypes.func,
    width: PropTypes.number
};

export default withStyles(styles)(SideDrawer);