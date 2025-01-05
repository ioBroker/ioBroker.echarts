import React from 'react';

import { Droppable, Draggable } from 'react-beautiful-dnd';
import { ChromePicker, type ColorResult } from 'react-color';

import {
    IconButton,
    Tab,
    AppBar,
    Grid,
    Dialog,
    DialogTitle,
    DialogActions,
    Button,
    Fab,
    TextField,
    Checkbox,
    Snackbar,
    Box,
    Tabs,
    Paper,
} from '@mui/material';

import {
    MdAdd as IconAdd,
    MdClose as IconCancel,
    MdSave as IconSave,
    MdExpandLess as IconCollapse,
    MdExpandMore as IconExpand,
    MdFullscreen as IconNewWindow,
} from 'react-icons/md';
import { Close as IconClose, Delete as IconDelete } from '@mui/icons-material';

import { I18n, Utils, IconCopy, ColorPicker, type IobTheme, type AdminConnection } from '@iobroker/adapter-react-v5';

import { IOTextField, IOCheckbox, IOSelect, IODateTimeField, IONumberField } from './Fields';

import Line from './Line';
import Mark from './Mark';
import { getDefaultLine, getDefaultPreset } from './DefaultPreset';
import type {
    ChartConfigMore,
    ChartLineConfigMore,
    ChartMarkConfig,
    ChartRelativeEnd,
    ThemeChartType,
} from '../../../src/types';

const styles: Record<string, any> = {
    tabsBody: {
        overflowY: 'auto',
        flex: 1,
        height: 'calc(100% - 48px)',
    },
    tabsContainer: {
        flexDirection: 'row',
    },
    tabContent: {
        padding: 8,
        position: 'relative',
        minHeight: 'calc(100% - 32px)',
    },
    buttonAdd: {
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 3,
    },
    buttonExpandAll: {
        position: 'absolute',
        top: 8 + 42,
        right: 8,
        opacity: 0.5,
        zIndex: 3,
    },
    buttonCollapseAll: {
        position: 'absolute',
        top: 8 + 42 * 2,
        right: 8,
        opacity: 0.5,
        zIndex: 3,
    },
    button: {
        height: 40,
        width: 40,
        marginTop: 5,
        marginLeft: 5,
    },
    buttonSave: {
        color: '#CC0000',
    },
    noContent: {
        padding: 8,
        height: 64,
        verticalAlign: 'middle',
        lineHeight: '64px',
        width: '100%',
    },
    dragHint: {
        paddingLeft: 8,
        fontSize: 10,
        fontStyle: 'italic',
        opacity: 0.8,
    },
    marginTop: {
        marginTop: 16,
    },
    noPaddingOnSide: {
        // paddingRight: 0,
        // paddingLeft: 0,
    },
    group: (theme: IobTheme): any => ({
        display: 'block',
        '& > div': {
            display: 'inline-flex',
            pr: '20px',
            width: 200,
        },
        position: 'relative',
        pb: '16px',
        borderBottom: `1px dotted ${theme.palette.grey[400]}`,
    }),
    title: {
        width: 'inherit',
        position: 'absolute',
        whiteSpace: 'nowrap',
        right: 0,
        fontSize: 48,
        opacity: 0.1,
        lineHeight: '48px',
        padding: 0,
        marginTop: 20,
        marginLeft: 0,
        marginRight: 0,
        marginBottom: 0,
        paddingRight: 10,
    },
    buttonCopyLink: {
        minHeight: 30,
        marginTop: 20,
        marginBottom: 10,
        marginLeft: 16,
    },
    selected: (theme: IobTheme): React.CSSProperties => ({
        color: theme.palette.mode === 'dark' ? undefined : '#FFF !important',
    }),
    indicator: (theme: IobTheme): React.CSSProperties => ({
        backgroundColor: theme.palette.mode === 'dark' ? theme.palette.secondary.main : theme.palette.secondary.main,
    }),
};

const PREDEFINED_COLORS_MARKS = [
    '#144578',
    '#1868A8',
    '#665191',
    '#a05195',
    '#d45087',
    '#f95d6a',
    '#ff7c43',
    '#ffa600',
];

const getItemStyle = (isDragging: boolean, draggableStyle: React.CSSProperties): React.CSSProperties => ({
    // some basic styles to make the items look a bit nicer
    userSelect: 'none',
    width: '100%',
    // change background colour if dragging
    background: isDragging ? 'lightgreen' : 'grey',
    // styles we need to apply on "draggable"s
    ...draggableStyle,
});

interface PresetTabsProps {
    onChange: (data: ChartConfigMore) => void;
    presetData: ChartConfigMore;
    selectedId: string;
    socket: AdminConnection;
    instances: ioBroker.InstanceObject[];
    savePreset: () => void;
    selectedPresetChanged: boolean;
    width: number;
    theme: IobTheme;
    systemConfig: ioBroker.SystemConfigObject;
    onAutoSave: (autoSave: boolean) => void;
    autoSave: boolean;
    windowWidth: number;
}

interface PresetTabsState {
    copiedObject: { type: 'line'; line: ChartLineConfigMore } | { type: 'marking'; mark: ChartMarkConfig } | null;
    presetData: ChartConfigMore;
    selectedTab: 'data' | 'markings' | 'time' | 'options' | 'title' | 'appearance';
    linesOpened: boolean[];
    marksOpened: boolean[];
    deleteLineDialog: null | number;
    deleteMarkDialog: null | number;
    showColorDialog: boolean;
    colorDialogValue: string;
    webInstances: { index: string; link: string }[];
    toast: string;
    clientWidth: number;

    legColor: string;
    legBg: string;
    exportColor: string;
    exportDataColor: string;
    titleColor: string;
    window_bg: string;
    bg_custom: string;
    x_labels_color: string;
    y_labels_color: string;
    y_ticks_color: string;
    border_color: string;
    barFontColor: string;
    x_ticks_color: string;
    grid_color: string;
}

class PresetTabs extends React.Component<PresetTabsProps, PresetTabsState> {
    private colorPickerCb: null | ((color: string) => void);

    private readonly paperLineRef: React.RefObject<HTMLDivElement>;
    private readonly paperMarkRef: React.RefObject<HTMLDivElement>;

    private windowWidth: number;

    constructor(props: PresetTabsProps) {
        super(props);

        this.windowWidth = this.props.windowWidth;

        const copiedObjectStr = window.sessionStorage.getItem('echarts.copiedObject');
        let copiedObject:
            | { type: 'line'; line: ChartLineConfigMore }
            | { type: 'marking'; mark: ChartMarkConfig }
            | null = null;
        if (copiedObjectStr) {
            try {
                copiedObject = JSON.parse(copiedObjectStr);
                // @ts-expect-error back compatibility
                if (copiedObject.data) {
                    if (copiedObject.type === 'line') {
                        // @ts-expect-error back compatibility
                        copiedObject.line = copiedObject.data;
                    } else {
                        // @ts-expect-error back compatibility
                        copiedObject.mark = copiedObject.data;
                    }
                    // @ts-expect-error back compatibility
                    delete copiedObject.data;
                }
            } catch {
                copiedObject = null;
            }
        }

        this.state = {
            presetData: getDefaultPreset(this.props.systemConfig),
            selectedTab:
                window.localStorage.getItem('App.echarts.presetTabs.selectedTab') !== null
                    ? (window.localStorage.getItem('App.echarts.presetTabs.selectedTab') as
                          | 'data'
                          | 'markings'
                          | 'time'
                          | 'options'
                          | 'title'
                          | 'appearance')
                    : 'data',
            linesOpened:
                window.localStorage.getItem('App.echarts.Lines.opened') !== null
                    ? JSON.parse(window.localStorage.getItem('App.echarts.Lines.opened'))
                    : [],
            marksOpened:
                window.localStorage.getItem('App.echarts.Marks.opened') !== null
                    ? JSON.parse(window.localStorage.getItem('App.echarts.Marks.opened'))
                    : [],
            deleteLineDialog: null,
            deleteMarkDialog: null,
            showColorDialog: false,
            colorDialogValue: '',
            webInstances: [],
            toast: '',
            copiedObject,
            clientWidth: 0,

            legColor: '',
            legBg: '',
            exportColor: '',
            exportDataColor: '',
            titleColor: '',
            window_bg: '',
            bg_custom: '',
            x_labels_color: '',
            y_labels_color: '',
            y_ticks_color: '',
            border_color: '',
            barFontColor: '',
            x_ticks_color: '',
            grid_color: '',
        };

        void this.props.socket.getAdapterInstances('web').then(instances => {
            const webInstances = instances.map(obj => ({
                index: obj._id.split('.').pop(),
                link: `http${obj.native.secure ? 's' : ''}://${obj.native.bind === '0.0.0.0' ? window.location.hostname : obj.native.bind}:${obj.native.port}`,
            }));

            this.setState({ webInstances });
        });

        this.paperLineRef = React.createRef();
        this.paperMarkRef = React.createRef();

        this.colorPickerCb = null;
    }

    componentDidMount() {
        window.addEventListener('resize', this.handleResize);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleResize);
    }

    handleResize = (): void => {
        if (
            (!this.state.selectedTab || this.state.selectedTab === 'data') &&
            this.paperLineRef.current &&
            this.paperLineRef.current.clientWidth !== this.state.clientWidth
        ) {
            this.setState({ clientWidth: this.paperLineRef.current.clientWidth });
        } else if (
            this.state.selectedTab === 'markings' &&
            this.paperMarkRef.current &&
            this.paperMarkRef.current.clientWidth !== this.state.clientWidth
        ) {
            this.setState({ clientWidth: this.paperMarkRef.current.clientWidth });
        }
    };

    lineOpenToggle = (index: number): void => {
        const linesOpened = [...this.state.linesOpened];
        linesOpened[index] = !this.state.linesOpened[index];
        this.setState({ linesOpened });
        window.localStorage.setItem('App.echarts.Lines.opened', JSON.stringify(linesOpened));
    };

    markOpenToggle = (index: number): void => {
        const marksOpened = [...this.state.marksOpened];
        marksOpened[index] = !this.state.marksOpened[index];
        this.setState({ marksOpened });
        window.localStorage.setItem('App.echarts.Marks.opened', JSON.stringify(marksOpened));
    };

    updateMark = (index: number, markData: ChartMarkConfig): void => {
        const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
        presetData.marks[index] = markData;
        this.props.onChange(presetData);
    };

    updateLine = (index: number, lineData: ChartLineConfigMore): void => {
        const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
        presetData.l[index] = lineData;

        if (presetData.l[index].chartType === 'bar') {
            // apply bar to all lines
            presetData.l.forEach(line => {
                line.chartType = 'bar';
                if (line.aggregate === 'minmax') {
                    line.aggregate = 'max';
                }
            });
        } else if (presetData.l[index].chartType === 'polar') {
            // apply bar to all lines
            presetData.l.forEach(line => {
                line.chartType = 'polar';
                if (line.aggregate === 'minmax') {
                    line.aggregate = 'current';
                }
            });
        } else if (presetData.l.find(line => line.chartType === 'bar')) {
            // remove bar from all lines
            presetData.l.forEach(line => {
                line.chartType = presetData.l[index].chartType;
                if (line.aggregate === 'current') {
                    line.aggregate = 'minmax';
                }
            });
        } else if (presetData.l.find(line => line.chartType === 'polar')) {
            // remove polar from all lines
            presetData.l.forEach(line => {
                line.chartType = presetData.l[index].chartType;
                if (line.aggregate === 'current') {
                    line.aggregate = 'minmax';
                }
            });
        }

        this.props.onChange(presetData);
    };

    expandAllLines = (): void => {
        const linesOpened = this.props.presetData.l.map(() => true);
        window.localStorage.setItem('App.echarts.Lines.opened', JSON.stringify(linesOpened));
        this.setState({ linesOpened });
    };

    collapseAllLines = (): void => {
        window.localStorage.setItem('App.echarts.Lines.opened', JSON.stringify([]));
        this.setState({ linesOpened: [] });
    };

    expandAllMarks = (): void => {
        const marksOpened = this.props.presetData.marks.map(() => true);
        window.localStorage.setItem('App.echarts.Marks.opened', JSON.stringify([]));
        this.setState({ marksOpened });
    };

    collapseAllMarks = (): void => {
        window.localStorage.setItem('App.echarts.Marks.opened', JSON.stringify([]));
        this.setState({ marksOpened: [] });
    };

    addMark(data?: ChartMarkConfig): void {
        const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
        if (data) {
            presetData.marks.push(JSON.parse(JSON.stringify(data)));
        } else {
            const len = this.props.presetData.marks.length;
            const color = PREDEFINED_COLORS_MARKS[len % PREDEFINED_COLORS_MARKS.length];
            presetData.marks.push({ color } as ChartMarkConfig);
        }
        this.props.onChange(presetData);
    }

    deleteMark = (index: number): void => {
        const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
        presetData.marks.splice(index, 1);
        const marksOpened = [...this.state.marksOpened];
        marksOpened.splice(index, 1);
        this.setState({ marksOpened }, () => this.props.onChange(presetData));
    };

    addLine(data?: ChartLineConfigMore): void {
        const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
        if (data) {
            presetData.l.push(JSON.parse(JSON.stringify(data)));
        } else {
            const len = this.props.presetData.l.length;
            const line = getDefaultLine(this.props.systemConfig);
            line.xaxe = !len ? undefined : 'off';
            presetData.l.push(line);
        }
        // if any bar already exists, apply bar to new line
        if (presetData.l.find(line => line.chartType === 'bar')) {
            const line = presetData.l[presetData.l.length - 1];
            line.chartType = 'bar';
            if (line.aggregate === 'minmax') {
                line.aggregate = 'max';
            }
        } else if (presetData.l.find(line => line.chartType === 'polar')) {
            // if any bar already exists, apply bar to new line
            const line = presetData.l[presetData.l.length - 1];
            line.chartType = 'polar';
            if (line.aggregate === 'minmax') {
                line.aggregate = 'current';
            }
        }

        this.props.onChange(presetData);
    }

    deleteLine = (index: number): void => {
        const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));

        // Check if the yaxis of this line is used somewhere else and correct commonYAxis
        for (let i = 0; i < presetData.l.length; i++) {
            if (presetData.l[i].commonYAxis === undefined) {
                continue;
            }
            if (presetData.l[i].commonYAxis > index) {
                presetData.l[i].commonYAxis = presetData.l[i].commonYAxis - 1;
            } else if (presetData.l[i].commonYAxis === index) {
                delete presetData.l[i].commonYAxis;
            }
        }

        presetData.l.splice(index, 1);
        const linesOpened = [...this.state.linesOpened];
        linesOpened.splice(index, 1);
        this.setState({ linesOpened }, () => this.props.onChange(presetData));
    };

    renderDeleteLineDialog(): React.JSX.Element | null {
        return this.state.deleteLineDialog !== null ? (
            <Dialog
                open={!0}
                key="deleteLineDialog"
                onClose={() => this.setState({ deleteLineDialog: null })}
            >
                <DialogTitle>{I18n.t('Are you sure for delete this line?')}</DialogTitle>
                <DialogActions style={{ ...styles.alignRight, ...styles.buttonsContainer }}>
                    <Button
                        variant="contained"
                        color="secondary"
                        autoFocus
                        onClick={() => {
                            this.deleteLine(this.state.deleteLineDialog);
                            this.setState({ deleteLineDialog: null });
                        }}
                        startIcon={<IconDelete />}
                    >
                        {I18n.t('Delete')}
                    </Button>
                    <Button
                        color="grey"
                        variant="contained"
                        onClick={() => this.setState({ deleteLineDialog: null })}
                        startIcon={<IconCancel />}
                    >
                        {I18n.t('Cancel')}
                    </Button>
                </DialogActions>
            </Dialog>
        ) : null;
    }

    renderDeleteMarkDialog(): React.JSX.Element | null {
        return this.state.deleteMarkDialog !== null ? (
            <Dialog
                open={!0}
                key="deleteMarkDialog"
                onClose={() => this.setState({ deleteMarkDialog: null })}
            >
                <DialogTitle>{I18n.t('Are you sure for delete this mark?')}</DialogTitle>
                <DialogActions style={{ ...styles.alignRight, ...styles.buttonsContainer }}>
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={() => {
                            this.deleteMark(this.state.deleteMarkDialog);
                            this.setState({ deleteMarkDialog: null });
                        }}
                        startIcon={<IconDelete />}
                    >
                        {I18n.t('Delete')}
                    </Button>
                    <Button
                        color="grey"
                        variant="contained"
                        onClick={() => this.setState({ deleteMarkDialog: null })}
                        startIcon={<IconCancel />}
                    >
                        {I18n.t('Cancel')}
                    </Button>
                </DialogActions>
            </Dialog>
        ) : null;
    }

    showColorPicker(value: string, cb: (color: string) => void): void {
        this.colorPickerCb = cb;
        this.setState({ colorDialogValue: value, showColorDialog: true });
    }

    renderColorDialog(): React.JSX.Element | null {
        return (
            <Dialog
                onClose={() => {
                    this.colorPickerCb = null;
                    this.setState({ showColorDialog: false });
                }}
                open={this.state.showColorDialog}
            >
                {/* @ts-expect-error because too old. Must be replaced */}
                <ChromePicker
                    color={this.state.colorDialogValue}
                    onChange={(value: ColorResult) => {
                        this.setState(
                            { colorDialogValue: value.hex },
                            () => this.colorPickerCb && this.colorPickerCb(value.hex),
                        );
                    }}
                />
            </Dialog>
        );
    }

    componentDidUpdate(): void {
        if (
            (!this.state.selectedTab || this.state.selectedTab === 'data') &&
            this.paperLineRef.current &&
            this.paperLineRef.current.clientWidth !== this.state.clientWidth
        ) {
            // This one is just to trigger the update of component if width of menu changed
            this.windowWidth = this.props.windowWidth;
            this.setState({ clientWidth: this.paperLineRef.current.clientWidth });
        } else if (
            this.state.selectedTab === 'markings' &&
            this.paperMarkRef.current &&
            this.paperMarkRef.current.clientWidth !== this.state.clientWidth
        ) {
            // This one is just to trigger the update of component if width of menu changed
            this.windowWidth = this.props.windowWidth;
            this.setState({ clientWidth: this.paperMarkRef.current.clientWidth });
        }
    }

    renderTabLines(): React.ReactNode {
        const anyClosed =
            this.props.presetData.l.length > 1 && this.props.presetData.l.find((l, i) => !this.state.linesOpened[i]);
        const anyOpened =
            this.props.presetData.l.length > 1 && this.props.presetData.l.find((l, i) => this.state.linesOpened[i]);

        return (
            // @ts-expect-error idk
            <Droppable droppableId="tabs">
                {(provided, snapshot) => {
                    return (
                        <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            style={{
                                background: snapshot.isDraggingOver
                                    ? this.props.theme.palette.secondary.dark
                                    : undefined,
                                width: '100%',
                                minHeight: 'calc(100% - 32px)',
                            }}
                        >
                            <Paper
                                style={styles.tabContent}
                                ref={this.paperLineRef}
                            >
                                <Fab
                                    onClick={() => this.addLine()}
                                    size="small"
                                    color="secondary"
                                    style={styles.buttonAdd}
                                    title={I18n.t('Add line to chart')}
                                >
                                    <IconAdd />
                                </Fab>
                                {anyClosed ? (
                                    <Fab
                                        onClick={this.expandAllLines}
                                        size="small"
                                        color="default"
                                        style={styles.buttonExpandAll}
                                        title={I18n.t('Expand all lines')}
                                    >
                                        <IconExpand />
                                    </Fab>
                                ) : null}
                                {anyOpened ? (
                                    <Fab
                                        onClick={this.collapseAllLines}
                                        size="small"
                                        color="default"
                                        style={styles.buttonCollapseAll}
                                        title={I18n.t('Collapse all lines')}
                                    >
                                        <IconCollapse />
                                    </Fab>
                                ) : null}
                                {this.props.presetData.l.length ? (
                                    this.props.presetData.l.map((line, index) => (
                                        // @ts-expect-error idk
                                        <Draggable
                                            key={`${line.id}_${index}`}
                                            draggableId={`${line.id}_${index}`}
                                            index={index}
                                        >
                                            {(_provided, _snapshot) => (
                                                <div
                                                    ref={_provided.innerRef}
                                                    {..._provided.draggableProps}
                                                    style={getItemStyle(
                                                        _snapshot.isDragging,
                                                        _provided.draggableProps.style,
                                                    )}
                                                >
                                                    <Line
                                                        provided={_provided}
                                                        snapshot={_snapshot}
                                                        theme={this.props.theme}
                                                        instances={this.props.instances}
                                                        systemConfig={this.props.systemConfig}
                                                        line={line}
                                                        presetData={this.props.presetData}
                                                        width={this.state.clientWidth}
                                                        updateLine={this.updateLine}
                                                        deleteLine={_index =>
                                                            this.setState({ deleteLineDialog: _index })
                                                        }
                                                        index={index}
                                                        key={index}
                                                        socket={this.props.socket}
                                                        opened={
                                                            typeof this.state.linesOpened[index] !== 'undefined' &&
                                                            this.state.linesOpened[index] === true
                                                        }
                                                        lineOpenToggle={this.lineOpenToggle}
                                                        maxLines={this.props.presetData.l.length}
                                                        onSelectColor={(value: string, cb) =>
                                                            this.showColorPicker(value, cb)
                                                        }
                                                        onCopy={_line => {
                                                            this.setState({
                                                                copiedObject: {
                                                                    type: 'line',
                                                                    line: JSON.parse(JSON.stringify(_line)),
                                                                },
                                                            });
                                                            window.sessionStorage.setItem(
                                                                'echarts.copiedObject',
                                                                JSON.stringify({ type: 'line', line: _line }),
                                                            );
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </Draggable>
                                    ))
                                ) : (
                                    <div style={styles.noContent}>
                                        {I18n.t('Create a new line with a "+" on the right.')}
                                    </div>
                                )}
                                {this.state.copiedObject?.type === 'line' ? (
                                    <Line
                                        presetData={this.props.presetData}
                                        line={this.state.copiedObject.line}
                                        theme={this.props.theme}
                                        instances={this.props.instances}
                                        systemConfig={this.props.systemConfig}
                                        width={this.state.clientWidth}
                                        deleteLine={() => {
                                            window.sessionStorage.removeItem('echarts.copiedObject');
                                            this.setState({ copiedObject: null });
                                        }}
                                        key="copiedLine"
                                        socket={this.props.socket}
                                        opened={false}
                                        onPaste={() =>
                                            this.state.copiedObject?.type === 'line' &&
                                            this.addLine(this.state.copiedObject.line)
                                        }
                                    />
                                ) : null}
                                {provided.placeholder as any}
                                <div style={styles.dragHint}>
                                    {I18n.t('You can drag and drop simple lines from the left list.')}
                                </div>
                            </Paper>
                        </div>
                    );
                }}
            </Droppable>
        );
    }

    renderTabMarkings(): React.JSX.Element {
        const anyClosed =
            this.props.presetData.marks.length > 1 &&
            this.props.presetData.marks.find((l, i) => !this.state.marksOpened[i]);
        const anyOpened =
            this.props.presetData.marks.length > 1 &&
            this.props.presetData.marks.find((l, i) => this.state.marksOpened[i]);

        return (
            <Paper
                style={styles.tabContent}
                ref={this.paperMarkRef}
            >
                <Fab
                    onClick={() => this.addMark()}
                    size="small"
                    color="secondary"
                    style={styles.buttonAdd}
                    title={I18n.t('Add marking line to chart')}
                >
                    <IconAdd />
                </Fab>
                {anyClosed ? (
                    <Fab
                        onClick={this.expandAllMarks}
                        size="small"
                        color="default"
                        style={styles.buttonExpandAll}
                        title={I18n.t('Expand all markings')}
                    >
                        <IconExpand />
                    </Fab>
                ) : null}
                {anyOpened ? (
                    <Fab
                        onClick={this.collapseAllMarks}
                        size="small"
                        color="default"
                        style={styles.buttonCollapseAll}
                        title={I18n.t('Collapse all markings')}
                    >
                        <IconCollapse />
                    </Fab>
                ) : null}
                {this.props.presetData.marks.length ? (
                    this.props.presetData.marks.map((mark, index) => (
                        <Mark
                            mark={mark}
                            presetData={this.props.presetData}
                            updateMark={this.updateMark}
                            theme={this.props.theme}
                            deleteMark={_index => {
                                this.setState({ deleteMarkDialog: _index });
                            }}
                            index={index}
                            key={index}
                            socket={this.props.socket}
                            width={this.state.clientWidth}
                            opened={
                                typeof this.state.marksOpened[index] !== 'undefined' &&
                                this.state.marksOpened[index] === true
                            }
                            markOpenToggle={this.markOpenToggle}
                            onSelectColor={(value, cb) => this.showColorPicker(value, cb)}
                            onCopy={data => {
                                this.setState({
                                    copiedObject: { type: 'marking', mark: JSON.parse(JSON.stringify(data)) },
                                });
                                window.sessionStorage.setItem(
                                    'echarts.copiedObject',
                                    JSON.stringify({ type: 'marking', mark: data }),
                                );
                            }}
                        />
                    ))
                ) : (
                    <div style={styles.noContent}>
                        {I18n.t('You can create a new markings with a "+" on the right.')}
                    </div>
                )}
                {this.state.copiedObject?.type === 'marking' ? (
                    <Mark
                        presetData={this.props.presetData}
                        mark={this.state.copiedObject.mark}
                        theme={this.props.theme}
                        width={this.state.clientWidth}
                        deleteMark={() => {
                            window.sessionStorage.removeItem('echarts.copiedObject');
                            this.setState({ copiedObject: null });
                        }}
                        key="copiedMark"
                        opened={false}
                        onPaste={() =>
                            this.state.copiedObject?.type === 'marking' && this.addMark(this.state.copiedObject.mark)
                        }
                    />
                ) : null}
            </Paper>
        );
    }

    renderTabTime(): React.JSX.Element {
        const hasNotBarOrPolar = this.props.presetData.l.find(
            line => line.chartType !== 'bar' && line.chartType !== 'polar',
        );
        const hasBarOrPolar = this.props.presetData.l.find(
            line => line.chartType === 'bar' || line.chartType === 'polar',
        );
        const anyNotOnChange = this.props.presetData.l.find(line => line.aggregate !== 'onchange');

        const anyNotJson = this.props.presetData.l.find(line => line.instance !== 'json');

        const barIntervalOptions = {
            0: 'auto',
            15: 'i15min',
            60: 'i1hour',
            1440: 'i1day',
            43200: 'i30days',
        };
        if (this.props.presetData.timeType !== 'static') {
            if (
                this.props.presetData.range === 10 ||
                this.props.presetData.range === 30 ||
                this.props.presetData.range === 60
            ) {
                delete barIntervalOptions[60];
                delete barIntervalOptions[1440];
                delete barIntervalOptions[43200];
            } else if (
                this.props.presetData.range === 120 ||
                this.props.presetData.range === 180 ||
                this.props.presetData.range === 360 ||
                this.props.presetData.range === 720 ||
                this.props.presetData.range === 1440
            ) {
                delete barIntervalOptions[1440];
                delete barIntervalOptions[43200];
            } else if (
                this.props.presetData.range === 2880 ||
                this.props.presetData.range === 4320 ||
                this.props.presetData.range === 10080 ||
                this.props.presetData.range === 20160 ||
                this.props.presetData.range === '1m'
            ) {
                delete barIntervalOptions[43200];
            }
        }

        return (
            <Paper style={styles.tabContent}>
                {anyNotJson ? (
                    <Box
                        component="div"
                        sx={styles.group}
                    >
                        <p style={styles.title}>{I18n.t('Type')}</p>
                        <IOSelect
                            value={this.props.presetData.timeType || 'relative'}
                            updateValue={(value: string): void => {
                                const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                                presetData.timeType = value as 'relative' | 'static';
                                this.props.onChange(presetData);
                            }}
                            label="Type"
                            options={{
                                relative: 'relative',
                                static: 'static',
                            }}
                        />
                    </Box>
                ) : null}
                {anyNotJson ? (
                    <Box
                        component="div"
                        sx={styles.group}
                    >
                        {this.props.presetData.timeType === 'static' ? (
                            <>
                                <p style={styles.title}>{I18n.t('Start and end')}</p>
                                <IODateTimeField
                                    date={
                                        this.props.presetData.start === undefined
                                            ? ''
                                            : this.props.presetData.start.toString()
                                    }
                                    time={this.props.presetData.start_time}
                                    updateValue={(date: string, time: string): void => {
                                        const presetData: ChartConfigMore = JSON.parse(
                                            JSON.stringify(this.props.presetData),
                                        );
                                        presetData.start = date;
                                        presetData.start_time = time;
                                        this.props.onChange(presetData);
                                    }}
                                    label="Start"
                                />
                                <IODateTimeField
                                    date={
                                        this.props.presetData.end === undefined
                                            ? ''
                                            : this.props.presetData.end.toString()
                                    }
                                    time={this.props.presetData.end_time}
                                    updateValue={(date: string, time: string): void => {
                                        const presetData: ChartConfigMore = JSON.parse(
                                            JSON.stringify(this.props.presetData),
                                        );
                                        presetData.end = date;
                                        presetData.end_time = time;
                                        this.props.onChange(presetData);
                                    }}
                                    label="End"
                                />
                            </>
                        ) : (
                            <>
                                <p style={styles.title}>{I18n.t('Relative')}</p>
                                <IOSelect
                                    value={this.props.presetData.relativeEnd}
                                    updateValue={(value: string): void => {
                                        const presetData: ChartConfigMore = JSON.parse(
                                            JSON.stringify(this.props.presetData),
                                        );
                                        presetData.relativeEnd = value as ChartRelativeEnd;
                                        this.props.onChange(presetData);
                                    }}
                                    label="End"
                                    options={{
                                        now: 'now',
                                        '1minute': 'end of minute',
                                        '5minutes': 'end of 5 minutes',
                                        '10minutes': 'end of 10 minutes',
                                        '30minutes': 'end of 30 minutes',
                                        '1hour': 'end of hour',
                                        '2hours': 'end of 2 hours',
                                        '3hours': 'end of 3 hours',
                                        '4hours': 'end of 4 hours',
                                        '6hours': 'end of 6 hours',
                                        '8hours': 'end of 8 hours',
                                        '12hours': 'end of 12 hours',
                                        today: 'end of day',
                                        weekEurope: 'end of sunday',
                                        weekUsa: 'end of saturday',
                                        month: 'this month',
                                        year: 'this year',
                                    }}
                                />
                                <IOSelect
                                    value={
                                        this.props.presetData.range === undefined
                                            ? ''
                                            : this.props.presetData.range.toString()
                                    }
                                    updateValue={(value: string): void => {
                                        const presetData: ChartConfigMore = JSON.parse(
                                            JSON.stringify(this.props.presetData),
                                        );
                                        if (!value.includes('m') && !value.includes('y')) {
                                            presetData.range = parseInt(value, 10);
                                        } else {
                                            presetData.range = value as '1m' | '2m' | '3m' | '6m' | '1y' | '2y';
                                        }
                                        this.props.onChange(presetData);
                                    }}
                                    label="Range"
                                    options={{
                                        10: '10 minutes',
                                        30: '30 minutes',
                                        60: '1 hour',
                                        120: '2 hours',
                                        180: '3 hours',
                                        360: '6 hours',
                                        720: '12 hours',
                                        1440: '1 day',
                                        2880: '2 days',
                                        4320: '3 days',
                                        10080: '7 days',
                                        20160: '14 days',
                                        '1m': '1 month',
                                        '2m': '2 months',
                                        '3m': '3 months',
                                        '6m': '6 months',
                                        '1y': '1 year',
                                        '2y': '2 years',
                                    }}
                                />
                                <IOSelect
                                    value={
                                        this.props.presetData.live === undefined
                                            ? ''
                                            : this.props.presetData.live.toString()
                                    }
                                    updateValue={(value: string): void => {
                                        const presetData: ChartConfigMore = JSON.parse(
                                            JSON.stringify(this.props.presetData),
                                        );
                                        if (!value) {
                                            delete presetData.live;
                                        } else {
                                            presetData.live = parseInt(value, 10);
                                        }

                                        this.props.onChange(presetData);
                                    }}
                                    label="Live update every"
                                    options={{
                                        '': 'none',
                                        5: '5 seconds',
                                        10: '10 seconds',
                                        15: '15 seconds',
                                        20: '20 seconds',
                                        30: '30 seconds',
                                        60: '1 minute',
                                        120: '2 minutes',
                                        300: '5 minutes',
                                        600: '10 minutes',
                                        900: '15 minutes',
                                        1200: '20 minutes',
                                        1800: '30 minutes',
                                        3600: '1 hour',
                                        7200: '2 hours',
                                        10800: '3 hours',
                                        21600: '6 hours',
                                        43200: '12 hours',
                                        86400: '1 day',
                                    }}
                                />
                            </>
                        )}
                    </Box>
                ) : null}
                {/* <Box component="div" sx={styles.group}>
                <p style={styles.title}>{I18n.t('Start and end')}</p>
                <IOObjectField socket={this.props.socket} value={this.props.presetData.} updateValue={(value: string): void => {
                                const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                                presetData.timeType = value;
                                this.props.onChange(presetData);
                            }} name="ticks" label="Use X-ticks from" />
            </box> */}
                {anyNotJson && anyNotOnChange && hasNotBarOrPolar ? (
                    <Box
                        component="div"
                        sx={styles.group}
                    >
                        <p style={styles.title}>{I18n.t('Aggregate for lines')}</p>
                        <IOSelect
                            value={this.props.presetData.aggregateType}
                            updateValue={(value: string): void => {
                                const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                                presetData.aggregateType = value as 'count' | 'step';
                                this.props.onChange(presetData);
                            }}
                            label="Step type"
                            options={{
                                count: 'counts',
                                step: 'seconds',
                            }}
                        />
                        <IOTextField
                            value={
                                this.props.presetData.aggregateSpan === undefined
                                    ? ''
                                    : this.props.presetData.aggregateSpan.toString()
                            }
                            updateValue={(value: string): void => {
                                const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                                if (!value) {
                                    delete presetData.aggregateSpan;
                                } else {
                                    presetData.aggregateSpan = parseInt(value, 10);
                                }
                                this.props.onChange(presetData);
                            }}
                            label={this.props.presetData.aggregateType === 'step' ? 'Seconds' : 'Counts'}
                        />
                    </Box>
                ) : null}
                {hasBarOrPolar ? (
                    <Box
                        component="div"
                        sx={styles.group}
                    >
                        <p style={styles.title}>{I18n.t('Aggregate for bars')}</p>
                        <IOSelect
                            value={
                                this.props.presetData.aggregateBar === undefined
                                    ? ''
                                    : this.props.presetData.aggregateBar.toString()
                            }
                            updateValue={(value: string): void => {
                                const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                                if (!value) {
                                    delete presetData.aggregateBar;
                                } else {
                                    presetData.aggregateBar = parseInt(value, 10);
                                }
                                this.props.onChange(presetData);
                            }}
                            label={I18n.t('Intervals')}
                            options={barIntervalOptions}
                        />
                    </Box>
                ) : null}
                <Box
                    component="div"
                    sx={styles.group}
                >
                    <p style={styles.title}>{I18n.t('Time format')}</p>
                    <IOCheckbox
                        value={this.props.presetData.timeFormatCustom}
                        updateValue={(value: boolean): void => {
                            const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                            presetData.timeFormatCustom = value;
                            this.props.onChange(presetData);
                        }}
                        label="Custom time format"
                    />
                    {!this.props.presetData.timeFormatCustom ? (
                        <IOSelect
                            value={this.props.presetData.timeFormat}
                            updateValue={(value: string): void => {
                                const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                                presetData.timeFormat = value;
                                this.props.onChange(presetData);
                            }}
                            label="Time format"
                            options={{
                                '': 'Default',
                                'HH:mm DD.MM': 'HH:MM dd.mm',
                                'HH:mm DD.MM.': 'HH:MM dd.mm.',
                                'HH:mm <br /> DD.MM': 'HH:MM / dd.mm',
                                'HH:mm <br /> DD.MM.': 'HH:MM / dd.mm.',
                                'HH:mm <br /> DD.MM.YY': 'HH:MM / dd.mm.yy',
                                'HH:mm:ss DD.MM.YY': 'HH:MM:SS dd.mm.yy',
                                'HH:mm DD.MM.YY': 'HH:MM dd.mm.yy',
                                'hh:mm:ss MM/DD/YY a': 'HH:MM:SS mm/dd/yy am (US)',
                                'HH:mm:ss DD/MM/YY': 'HH:MM:SS dd/mm/yy (UK)',
                                'HH:mm:ss MM.DD.YY': 'HH:MM:SS mm.dd.yy',
                                'HH:mm ddd': 'HH:MM dow',
                                'HH:mm:ss ddd': 'HH:MM:SS dow',
                                'HH:mm MM.DD': 'HH:MM mm.dd',
                                'HH:mm:ss': 'HH:MM:SS',
                                'HH:mm': 'HH:MM',
                                'DD.MM': 'dd.mm',
                                'DD.MM.': 'dd.mm.',
                                'MM/DD': 'mm/dd',
                                DD: 'dd',
                                MM: 'mm',
                                YY: 'y',
                                HH: 'HH',
                                mm: 'MM',
                                ddd: 'dow',
                                'DD.MM.YY': 'dd.mm.yy',
                            }}
                        />
                    ) : (
                        <IOTextField
                            value={this.props.presetData.timeFormat}
                            updateValue={(value: string): void => {
                                const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                                presetData.timeFormat = value;
                                this.props.onChange(presetData);
                            }}
                            label="Time format"
                            helperLink="https://momentjs.com/docs/#/displaying/format/"
                        />
                    )}
                    {/* <IOSelect value={this.props.presetData.} updateValue={(value: string): void => {
                                const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                                presetData.timeType = value;
                                this.props.onChange(presetData);
                            }} label="Animation" name="animation" options={{
                                '0': 'no',
                                '300': '300ms',
                                '500': '500ms',
                                '1000': '1 second',
                                '2000': '2 seconds',
                                '3000': '3 seconds',
                                '5000': '5 seconds',
                                '10000': '10 seconds',
                            }} /> */}
                </Box>
            </Paper>
        );
    }

    renderToast(): React.JSX.Element | null {
        if (!this.state.toast) {
            return null;
        }
        return (
            <Snackbar
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                open={!0}
                autoHideDuration={2000}
                onClose={() => this.setState({ toast: '' })}
                ContentProps={{ 'aria-describedby': 'message-id' }}
                message={<span id="message-id">{this.state.toast}</span>}
                action={[
                    <IconButton
                        key="close"
                        aria-label="Close"
                        color="inherit"
                        style={styles.close}
                        onClick={() => this.setState({ toast: '' })}
                    >
                        <IconClose />
                    </IconButton>,
                ]}
            />
        );
    }

    renderTabOptions(): React.JSX.Element {
        const anyPolar = this.props.presetData.l.find(item => item.chartType === 'polar');

        return (
            <Paper style={styles.tabContent}>
                {/* Legend line */}
                <Box
                    component="div"
                    sx={styles.group}
                >
                    <p style={styles.title}>{I18n.t('Legend')}</p>
                    <IOSelect
                        value={this.props.presetData.legend}
                        updateValue={(value: string): void => {
                            const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                            presetData.legend = value as 'nw' | 'sw' | 'ne' | 'se' | 'dialog' | '';
                            this.props.onChange(presetData);
                        }}
                        label="Show legend"
                        options={{
                            '': 'none',
                            nw: 'Top, left',
                            ne: 'Top, right',
                            sw: 'Bottom, left',
                            se: 'Bottom, right',
                            dialog: 'Dialog',
                        }}
                    />
                    {this.props.presetData.legend ? (
                        <>
                            {/* <IOTextField value={this.props.presetData.} updateValue={(value: string): void => {
                                const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                                presetData.timeType = value;
                                this.props.onChange(presetData);
                            }} label="Legend columns" name="legColumns" min="1" type="number" /> */}
                            {/* <IOTextField value={this.props.presetData.} updateValue={(value: string): void => {
                                const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                                presetData.timeType = value;
                                this.props.onChange(presetData);
                            }} label="Legend opacity (0-1)" name="legBgOpacity" /> */}
                            {this.renderColorField(this.props.presetData.legColor, 'Legend text color', 'legColor')}
                            {this.renderColorField(this.props.presetData.legBg, 'Legend background', 'legBg')}
                            <IOCheckbox
                                value={this.props.presetData.legActual}
                                updateValue={(value: boolean): void => {
                                    const presetData: ChartConfigMore = JSON.parse(
                                        JSON.stringify(this.props.presetData),
                                    );
                                    presetData.legActual = value;
                                    this.props.onChange(presetData);
                                }}
                                label="Show values"
                            />
                            <IOSelect
                                value={this.props.presetData.legendDirection === 'vertical' ? 'vertical' : ''}
                                updateValue={(value: string): void => {
                                    const presetData: ChartConfigMore = JSON.parse(
                                        JSON.stringify(this.props.presetData),
                                    );
                                    presetData.legendDirection = value as 'vertical' | '';
                                    this.props.onChange(presetData);
                                }}
                                label="Orientation"
                                options={{
                                    '': 'horizontal',
                                    vertical: 'vertical',
                                }}
                            />
                            <IONumberField
                                value={this.props.presetData.legFontSize}
                                updateValue={(value: number): void => {
                                    const presetData: ChartConfigMore = JSON.parse(
                                        JSON.stringify(this.props.presetData),
                                    );
                                    presetData.legFontSize = value;
                                    this.props.onChange(presetData);
                                }}
                                label="Font size"
                                min={6}
                            />
                            <IONumberField
                                value={this.props.presetData.legendHeight}
                                updateValue={(value: number): void => {
                                    const presetData: ChartConfigMore = JSON.parse(
                                        JSON.stringify(this.props.presetData),
                                    );
                                    presetData.legendHeight = value;
                                    this.props.onChange(presetData);
                                }}
                                label="Height"
                                min={6}
                            />
                        </>
                    ) : null}
                </Box>
                {/* Options line */}
                <Box
                    component="div"
                    sx={styles.group}
                >
                    <p style={styles.title}>{I18n.t('Options')}</p>
                    <IOCheckbox
                        value={this.props.presetData.hoverDetail}
                        updateValue={(value: boolean): void => {
                            const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                            presetData.hoverDetail = value;
                            this.props.onChange(presetData);
                        }}
                        label="Hover details"
                    />
                    <IOCheckbox
                        value={this.props.presetData.hoverNoInterpolate}
                        updateValue={(value: boolean): void => {
                            const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                            presetData.hoverNoInterpolate = value;
                            this.props.onChange(presetData);
                        }}
                        label="No interpolate in hover"
                    />
                    {this.props.presetData.hoverDetail ? (
                        <IOCheckbox
                            value={this.props.presetData.hoverNoNulls}
                            updateValue={(value: boolean): void => {
                                const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                                presetData.hoverNoNulls = value;
                                this.props.onChange(presetData);
                            }}
                            label="Hide nulls in tooltip"
                        />
                    ) : null}
                    <IOCheckbox
                        value={this.props.presetData.useComma}
                        updateValue={(value: boolean): void => {
                            const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                            presetData.useComma = value;
                            this.props.onChange(presetData);
                        }}
                        label="Use comma"
                    />
                    <IOCheckbox
                        value={this.props.presetData.zoom}
                        updateValue={(value: boolean): void => {
                            const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                            presetData.zoom = value;
                            this.props.onChange(presetData);
                        }}
                        label="Enable zoom and pan"
                    />
                    {/* <IOCheckbox value={this.props.presetData.} updateValue={(value: string): void => {
                                const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                                presetData.timeType = value;
                                this.props.onChange(presetData);
                            }} label={'Hide edit button'} name="noedit" /> */}
                    <IOCheckbox
                        value={this.props.presetData.export}
                        updateValue={(value: boolean): void => {
                            const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                            presetData.export = value;
                            this.props.onChange(presetData);
                        }}
                        label="Show save image button"
                    />
                    {this.props.presetData.export
                        ? this.renderColorField(
                              this.props.presetData.exportColor,
                              'Save image button color',
                              'exportColor',
                          )
                        : null}
                    <IOCheckbox
                        value={this.props.presetData.exportData}
                        updateValue={(value: boolean): void => {
                            const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                            presetData.exportData = value;
                            this.props.onChange(presetData);
                        }}
                        label="Show export data button"
                    />
                    {this.props.presetData.export
                        ? this.renderColorField(
                              this.props.presetData.exportDataColor,
                              'Export data color',
                              'exportDataColor',
                          )
                        : null}
                    <IOCheckbox
                        value={this.props.presetData.autoGridPadding}
                        updateValue={(value: boolean): void => {
                            const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                            presetData.autoGridPadding = value;
                            this.props.onChange(presetData);
                        }}
                        label="Auto padding"
                    />
                    {this.props.presetData.zoom ? (
                        <IOSelect
                            value={
                                this.props.presetData.resetZoom === undefined
                                    ? ''
                                    : this.props.presetData.resetZoom.toString()
                            }
                            updateValue={(value: string): void => {
                                const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                                if (!value) {
                                    delete presetData.resetZoom;
                                } else {
                                    presetData.resetZoom = parseInt(value, 10);
                                }
                                this.props.onChange(presetData);
                            }}
                            label="Reset zoom after idle"
                            options={{
                                '': 'none',
                                10: '10 seconds',
                                15: '15 seconds',
                                30: '30 seconds',
                                60: '1 minute',
                                90: '90 seconds',
                                120: '2 minutes',
                                180: '3 minutes',
                                300: '5 minutes',
                                600: '10 minutes',
                                1200: '20 minutes',
                                1800: '30 minutes',
                            }}
                        />
                    ) : null}
                    {anyPolar ? (
                        <IOSelect
                            value={this.props.presetData.radarCircle || ''}
                            updateValue={(value: string): void => {
                                const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                                if (value) {
                                    presetData.radarCircle = 'circle';
                                } else {
                                    delete presetData.radarCircle;
                                }
                                this.props.onChange(presetData);
                            }}
                            label="Background of radar chart"
                            options={{
                                '': 'Polygonal',
                                circle: 'Circle',
                            }}
                        />
                    ) : null}
                </Box>
                {/* Links line */}
                <Box
                    component="div"
                    sx={styles.group}
                >
                    <p style={styles.title}>{I18n.t('Copy link to clipboard')}</p>
                    <Button
                        color="grey"
                        variant="contained"
                        style={styles.buttonCopyLink}
                        onClick={() => {
                            const link = `${window.location.protocol}//${window.location.host}/adapter/echarts/chart/index.html?preset=${this.props.selectedId}`;
                            this.setState({ toast: `${I18n.t('copied')}: ${link}` }, () => Utils.copyToClipboard(link));
                        }}
                    >
                        <IconCopy />
                        admin
                    </Button>
                    {this.state.webInstances.map((instance, i) => (
                        <Button
                            color="grey"
                            key={i}
                            variant="contained"
                            style={styles.buttonCopyLink}
                            onClick={() => {
                                const link = `${instance.link}/echarts/index.html?preset=${this.props.selectedId}`;
                                this.setState({ toast: `${I18n.t('copied')}: ${link}` }, () =>
                                    Utils.copyToClipboard(link),
                                );
                            }}
                        >
                            <IconCopy />
                            {`web.${instance.index}`}
                        </Button>
                    ))}
                </Box>
            </Paper>
        );
    }

    renderTabTitle(): React.JSX.Element {
        return (
            <Paper style={styles.tabContent}>
                <Box
                    component="div"
                    sx={styles.group}
                >
                    <p style={styles.title}>{I18n.t('Title')}</p>
                    <IOTextField
                        value={this.props.presetData.title}
                        updateValue={(value: string): void => {
                            const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                            presetData.title = value;
                            this.props.onChange(presetData);
                        }}
                        label="Title"
                    />
                    {this.props.presetData.title ? (
                        <>
                            <IOSelect
                                value={this.props.presetData.titlePos}
                                updateValue={(value: string): void => {
                                    const presetData: ChartConfigMore = JSON.parse(
                                        JSON.stringify(this.props.presetData),
                                    );
                                    presetData.titlePos = value;
                                    this.props.onChange(presetData);
                                }}
                                label="Title position"
                                options={{
                                    '': 'default',
                                    'top:35;left:65': 'Top, left, inside',
                                    'top:35;right:5': 'Top, right, inside',
                                    'top:35;left:50': 'Top, center, inside',
                                    'top:50;left:65': 'Middle, left, inside',
                                    'top:50;right:5': 'Middle, right, inside',
                                    'bottom:5;left:65': 'Bottom, left, inside',
                                    'bottom:5;right:5': 'Bottom, right, inside',
                                    'bottom:5;left:50': 'Bottom, center, inside',
                                    /* 'top:5;right:-5': 'Top, right, outside',
                            'top:50;right:-5': 'Middle, right, outside',
                            'bottom:5;right:-5': 'Bottom, right, outside',
                            'bottom:-5;left:50': 'Bottom, center, outside', */
                                }}
                            />
                            {this.renderColorField(this.props.presetData.titleColor, 'Title color', 'titleColor')}
                            <IONumberField
                                value={this.props.presetData.titleSize}
                                updateValue={(value: number): void => {
                                    const presetData: ChartConfigMore = JSON.parse(
                                        JSON.stringify(this.props.presetData),
                                    );
                                    presetData.titleSize = value;
                                    this.props.onChange(presetData);
                                }}
                                label="Title size"
                                min={0}
                            />
                        </>
                    ) : null}
                </Box>
            </Paper>
        );
    }

    renderTabAppearance(): React.JSX.Element {
        return (
            <Paper style={styles.tabContent}>
                {/* <h4>{I18n.t('Appearance')}</h4> */}
                <Box
                    component="div"
                    sx={styles.group}
                >
                    <p style={styles.title}>{I18n.t('Theme')}</p>
                    <IOSelect
                        value={this.props.presetData.theme}
                        updateValue={(value: string): void => {
                            const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                            presetData.theme = value as ThemeChartType | 'default';
                            this.props.onChange(presetData);
                        }}
                        label="Theme"
                        noTranslate
                        options={{
                            '': 'auto',
                            default: 'default',
                            dark: 'dark',
                            'dark-bold': 'dark-bold',
                            'dark-blue': 'dark-blue',
                            gray: 'gray',
                            vintage: 'vintage',
                            macarons: 'macarons',
                            infographic: 'infographic',
                            shine: 'shine',
                            roma: 'roma',
                            azul: 'azul',
                            'bee-inspired': '',
                            blue: 'blue',
                            royal: 'royal',
                            'tech-blue': 'tech-blue',
                            red: 'red',
                            'red-velvet': 'red-velvet',
                            green: 'green',
                        }}
                    />
                </Box>
                <Box
                    component="div"
                    sx={styles.group}
                >
                    <p style={styles.title}>{I18n.t('Chart size')}</p>
                    <IOTextField
                        value={this.props.presetData.width === undefined ? '' : this.props.presetData.width.toString()}
                        updateValue={(value: string): void => {
                            const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                            if (!value) {
                                delete presetData.width;
                            } else {
                                presetData.width = value;
                            }
                            this.props.onChange(presetData);
                        }}
                        label="Width"
                        styles={{ fieldContainer: styles.marginTop }}
                    />
                    <IOTextField
                        value={
                            this.props.presetData.height === undefined ? '' : this.props.presetData.height.toString()
                        }
                        updateValue={(value: string): void => {
                            const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                            if (!value) {
                                delete presetData.height;
                            } else {
                                presetData.height = value;
                            }
                            this.props.onChange(presetData);
                        }}
                        label="Height"
                        styles={{ fieldContainer: styles.marginTop }}
                    />
                </Box>
                <Box
                    component="div"
                    sx={styles.group}
                >
                    <p style={styles.title}>{I18n.t('Backgrounds')}</p>
                    <IOCheckbox
                        value={this.props.presetData.noBackground}
                        updateValue={(value: boolean): void => {
                            const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                            presetData.noBackground = value;
                            this.props.onChange(presetData);
                        }}
                        label="No background"
                    />
                    {!this.props.presetData.noBackground
                        ? this.renderColorField(
                              this.props.presetData.window_bg,
                              'Window background',
                              'window_bg',
                              undefined,
                              styles.marginTop,
                          )
                        : null}
                    {this.renderColorField(
                        this.props.presetData.bg_custom,
                        'Chart background',
                        'bg_custom',
                        undefined,
                        styles.marginTop,
                    )}
                </Box>
                <Box
                    component="div"
                    sx={styles.group}
                >
                    <p style={styles.title}>{I18n.t('Labels')}</p>
                    {this.renderColorField(
                        this.props.presetData.x_labels_color,
                        'X labels color',
                        'x_labels_color',
                        undefined,
                        styles.marginTop,
                    )}
                    <IONumberField
                        value={this.props.presetData.x_labels_size}
                        updateValue={(value: number): void => {
                            const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                            presetData.x_labels_size = value;
                            this.props.onChange(presetData);
                        }}
                        label="X labels size"
                        min={6}
                    />
                    {this.renderColorField(
                        this.props.presetData.x_ticks_color,
                        'X ticks color',
                        'x_ticks_color',
                        undefined,
                        styles.marginTop,
                    )}
                    {this.renderColorField(
                        this.props.presetData.y_labels_color,
                        'Y labels color',
                        'y_labels_color',
                        undefined,
                        styles.marginTop,
                    )}
                    <IONumberField
                        value={this.props.presetData.y_labels_size}
                        updateValue={(value: number): void => {
                            const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                            presetData.y_labels_size = value;
                            this.props.onChange(presetData);
                        }}
                        label="Y labels size"
                        min={6}
                    />
                    {this.renderColorField(
                        this.props.presetData.y_ticks_color,
                        'Y ticks color',
                        'y_ticks_color',
                        undefined,
                        styles.marginTop,
                    )}
                    <IOSelect
                        value={
                            this.props.presetData.xLabelShift === undefined
                                ? ''
                                : this.props.presetData.xLabelShift.toString()
                        }
                        updateValue={(value: string): void => {
                            const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                            if (value.includes('m') || value.includes('y')) {
                                presetData.xLabelShift = value as
                                    | '1m'
                                    | '2m'
                                    | '3m'
                                    | '6m'
                                    | '1y'
                                    | '2y'
                                    | '-1m'
                                    | '-2m'
                                    | '-3m'
                                    | '-6m'
                                    | '-1y'
                                    | '-2y';
                            } else {
                                presetData.xLabelShift = parseInt(value, 10);
                            }
                            this.props.onChange(presetData);
                        }}
                        tooltip="This time offset will be added to the X label by displaying data on the chart"
                        label="X-Label-Offset"
                        options={{
                            0: '0 seconds',
                            10: '10 seconds',
                            30: '30 seconds',
                            60: '60 seconds',
                            120: '2 minutes',
                            180: '3 minutes',
                            240: '4 minutes',
                            300: '5 minutes',
                            600: '10 minutes',
                            900: '15 minutes',
                            1800: '30 minutes',
                            2700: '45 minutes',
                            3600: '1 hour',
                            7200: '2 hours',
                            21600: '6 hours',
                            43200: '12 hours',
                            86400: '1 day',
                            172800: '2 days',
                            259200: '3 days',
                            345600: '4 days',
                            604800: '1 week',
                            1209600: '2 weeks',
                            '1m': '1 month',
                            '2m': '2 months',
                            '3m': '3 months',
                            '6m': '6 months',
                            '1y': '1 year',
                            '2y': '2 years',
                            '-10': '-10 seconds',
                            '-30': '-30 seconds',
                            '-60': '-60 seconds',
                            '-120': '-2 minutes',
                            '-180': '-3 minutes',
                            '-240': '-4 minutes',
                            '-300': '-5 minutes',
                            '-600': '-10 minutes',
                            '-900': '-15 minutes',
                            '-1800': '-30 minutes',
                            '-2700': '-45 minutes',
                            '-3600': '-1 hour',
                            '-7200': '-2 hours',
                            '-21600': '-6 hours',
                            '-43200': '-12 hours',
                            '-86400': '-1 day',
                            '-172800': '-2 days',
                            '-259200': '-3 days',
                            '-345600': '-4 days',
                            '-604800': '-1 week',
                            '-1209600': '-2 weeks',
                            '-1m': '-1 month',
                            '-2m': '-2 months',
                            '-3m': '-3 months',
                            '-6m': '-6 months',
                            '-1y': '-1 year',
                            '-2y': '-2 years',
                        }}
                    />
                </Box>
                <Box
                    component="div"
                    sx={styles.group}
                >
                    <p style={styles.title}>{I18n.t('Grid')}</p>
                    <IOCheckbox
                        value={this.props.presetData.grid_hideX}
                        updateValue={(value: boolean): void => {
                            const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                            presetData.grid_hideX = value;
                            this.props.onChange(presetData);
                        }}
                        label="Hide X grid"
                    />
                    <IOCheckbox
                        value={this.props.presetData.grid_hideY}
                        updateValue={(value: boolean): void => {
                            const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                            presetData.grid_hideY = value;
                            this.props.onChange(presetData);
                        }}
                        label="Hide Y grid"
                    />
                    {!this.props.presetData.grid_hideX || !this.props.presetData.grid_hideY
                        ? this.renderColorField(this.props.presetData.grid_color, 'Grid color', 'grid_color')
                        : null}
                </Box>
                <Box
                    component="div"
                    sx={styles.group}
                >
                    <p style={styles.title}>{I18n.t('Border')}</p>
                    <IOSelect
                        value={this.props.presetData.noBorder || ''}
                        updateValue={(value: string): void => {
                            const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                            if (value) {
                                presetData.noBorder = 'noborder';
                            } else {
                                delete presetData.noBorder;
                            }
                            this.props.onChange(presetData);
                        }}
                        label="Border"
                        options={{
                            '': 'With border',
                            noborder: 'Without border',
                        }}
                    />
                    {this.props.presetData.noBorder !== 'noborder' ? (
                        <>
                            <IONumberField
                                value={this.props.presetData.border_width}
                                updateValue={(value: number): void => {
                                    const presetData: ChartConfigMore = JSON.parse(
                                        JSON.stringify(this.props.presetData),
                                    );
                                    presetData.border_width = value;
                                    this.props.onChange(presetData);
                                }}
                                label="Border width"
                                min={0}
                            />
                            {this.props.presetData.border_width
                                ? this.renderColorField(
                                      this.props.presetData.border_color,
                                      'Border color',
                                      'border_color',
                                  )
                                : null}
                            {this.props.presetData.border_width ? (
                                <IOSelect
                                    value={this.props.presetData.border_style}
                                    updateValue={(value: string): void => {
                                        const presetData: ChartConfigMore = JSON.parse(
                                            JSON.stringify(this.props.presetData),
                                        );
                                        presetData.border_style = value as
                                            | 'solid'
                                            | 'dashed'
                                            | 'dotted'
                                            | 'double'
                                            | 'groove'
                                            | 'ridge'
                                            | 'inset'
                                            | 'outset';
                                        this.props.onChange(presetData);
                                    }}
                                    label="Border style"
                                    options={{
                                        solid: 'solid',
                                        dotted: 'dotted',
                                        dashed: 'dashed',
                                        double: 'double',
                                        groove: 'groove',
                                        ridge: 'ridge',
                                        inset: 'inset',
                                        outset: 'outset',
                                    }}
                                />
                            ) : null}
                            <IONumberField
                                value={this.props.presetData.border_padding}
                                updateValue={(value: number): void => {
                                    const presetData: ChartConfigMore = JSON.parse(
                                        JSON.stringify(this.props.presetData),
                                    );
                                    presetData.border_padding = value;
                                    this.props.onChange(presetData);
                                }}
                                label="Border padding"
                                min={0}
                            />
                        </>
                    ) : null}
                </Box>
                {this.props.presetData.l.find(line => line.chartType === 'bar') ? (
                    <Grid
                        item
                        sm={6}
                        xs={12}
                    >
                        <p style={styles.title}>{I18n.t('Bar settings')}</p>
                        <IOSelect
                            value={this.props.presetData.barLabels}
                            updateValue={(value: string): void => {
                                const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                                presetData.barLabels = value as 'topover' | 'topunder' | 'bottom' | 'inside' | '';
                                this.props.onChange(presetData);
                            }}
                            label="Show labels"
                            options={{
                                '': 'none',
                                topover: 'top over',
                                topunder: 'top under',
                                bottom: 'bottom',
                                middle: 'middle',
                            }}
                        />
                        <IONumberField
                            value={this.props.presetData.barWidth}
                            updateValue={(value: number): void => {
                                const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                                presetData.barWidth = value;
                                this.props.onChange(presetData);
                            }}
                            label="Bars width"
                            min={0}
                        />
                        <IONumberField
                            value={this.props.presetData.barFontSize}
                            updateValue={(value: number): void => {
                                const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
                                presetData.barFontSize = value;
                                this.props.onChange(presetData);
                            }}
                            label="Label font size"
                            min={0}
                        />
                        {this.renderColorField(this.props.presetData.barFontColor, 'Label color', 'barFontColor')}
                    </Grid>
                ) : null}
            </Paper>
        );
    }

    renderColorField(
        value: string,
        label: string,
        name:
            | 'legColor'
            | 'legBg'
            | 'exportColor'
            | 'exportDataColor'
            | 'titleColor'
            | 'window_bg'
            | 'bg_custom'
            | 'x_labels_color'
            | 'y_labels_color'
            | 'y_ticks_color'
            | 'border_color'
            | 'barFontColor'
            | 'x_ticks_color'
            | 'grid_color',
        minWidth?: string | number,
        styles?: React.CSSProperties,
    ): React.JSX.Element {
        let textColor = Utils.isUseBright(value, null);
        if (textColor === null) {
            textColor = undefined;
        }

        const onUpdate = (value: string): void => {
            const presetData: ChartConfigMore = JSON.parse(JSON.stringify(this.props.presetData));
            presetData[name] = value;
            this.props.onChange(presetData);
        };

        return (
            <div style={styles}>
                <TextField
                    variant="standard"
                    style={{ minWidth, width: 'calc(100% - 8px)' }}
                    label={I18n.t(label)}
                    value={value || ''}
                    onClick={() => {
                        this.setState({ [name]: value } as unknown as PresetTabsState, () =>
                            this.showColorPicker(this.state[name], color =>
                                this.setState({ [name]: color } as unknown as PresetTabsState, () =>
                                    onUpdate(ColorPicker.getColor(color, true)),
                                ),
                            ),
                        );
                    }}
                    onChange={e => {
                        const color = e.target.value;
                        this.setState({ [name]: color } as unknown as PresetTabsState, () => onUpdate(color));
                    }}
                    slotProps={{
                        inputLabel: { shrink: true },
                        htmlInput: {
                            style: {
                                backgroundColor: value,
                                color: textColor ? '#FFF' : '#000',
                            },
                        },
                        input: {
                            endAdornment: value ? (
                                <IconButton
                                    size="small"
                                    onClick={e => {
                                        e.stopPropagation();
                                        this.setState({ [name]: '' } as unknown as PresetTabsState, () => onUpdate(''));
                                    }}
                                >
                                    <IconClose />
                                </IconButton>
                            ) : undefined,
                        },
                    }}
                />
            </div>
        );
    }

    render(): React.JSX.Element {
        const anyPolar = this.props.presetData.l.find(line => line.chartType === 'polar');
        const anyNotCurrent = this.props.presetData.l.find(line => line.aggregate !== 'current');

        return (
            <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                <AppBar
                    position="static"
                    style={styles.tabsContainer}
                >
                    {this.props.selectedPresetChanged || this.props.autoSave ? (
                        <Checkbox
                            style={{
                                ...styles.button,
                                color: this.props.theme.palette.text.primary,
                            }}
                            checked={!!this.props.autoSave}
                            title={I18n.t('Auto save')}
                            onChange={e => this.props.onAutoSave(e.target.checked)}
                        />
                    ) : null}
                    {!this.props.selectedPresetChanged ? (
                        <IconButton
                            style={{ ...styles.button, ...styles.noPaddingOnSide }}
                            onClick={() =>
                                window.open(`chart/index.html?preset=${this.props.selectedId}`, 'own-preset-echarts')
                            }
                            title={I18n.t('Open chart in own window')}
                        >
                            <IconNewWindow />
                        </IconButton>
                    ) : null}
                    {!this.props.autoSave && this.props.selectedPresetChanged ? (
                        <IconButton
                            style={{
                                ...styles.noPaddingOnSide,
                                ...styles.buttonSave,
                                ...styles.button,
                            }}
                            onClick={() => this.props.savePreset()}
                        >
                            <IconSave />
                        </IconButton>
                    ) : null}
                    <Tabs
                        onChange={(
                            _event,
                            selectedTab: 'data' | 'markings' | 'time' | 'options' | 'title' | 'appearance',
                        ) => {
                            window.localStorage.setItem('App.echarts.presetTabs.selectedTab', selectedTab);
                            this.setState({ selectedTab });
                        }}
                        value={this.state.selectedTab || 'data'}
                        variant="scrollable"
                        scrollButtons
                        sx={{ '& .MuiTabs-indicator': styles.indicator }}
                    >
                        <Tab
                            sx={{ '&.Mui-selected': styles.selected }}
                            label={I18n.t('Data')}
                            value="data"
                        />
                        {anyPolar ? null : (
                            <Tab
                                sx={{ '&.Mui-selected': styles.selected }}
                                label={I18n.t('Markings')}
                                value="markings"
                            />
                        )}
                        {!anyNotCurrent ? null : (
                            <Tab
                                sx={{ '&.Mui-selected': styles.selected }}
                                label={I18n.t('Time')}
                                value="time"
                            />
                        )}
                        <Tab
                            sx={{ '&.Mui-selected': styles.selected }}
                            label={I18n.t('Options')}
                            value="options"
                        />
                        <Tab
                            sx={{ '&.Mui-selected': styles.selected }}
                            label={I18n.t('Title')}
                            value="title"
                        />
                        <Tab
                            sx={{ '&.Mui-selected': styles.selected }}
                            label={I18n.t('Appearance')}
                            value="appearance"
                        />
                    </Tabs>
                </AppBar>
                <div style={styles.tabsBody}>
                    {this.state.selectedTab === 'data' || !this.state.selectedTab ? this.renderTabLines() : null}
                    {this.state.selectedTab === 'markings' && !anyPolar ? this.renderTabMarkings() : null}
                    {this.state.selectedTab === 'time' && anyNotCurrent ? this.renderTabTime() : null}
                    {this.state.selectedTab === 'options' ? this.renderTabOptions() : null}
                    {this.state.selectedTab === 'title' ? this.renderTabTitle() : null}
                    {this.state.selectedTab === 'appearance' ? this.renderTabAppearance() : null}
                </div>
                {this.renderDeleteLineDialog()}
                {this.renderDeleteMarkDialog()}
                {this.renderColorDialog()}
                {this.renderToast()}
            </div>
        );
    }
}

export default PresetTabs;
