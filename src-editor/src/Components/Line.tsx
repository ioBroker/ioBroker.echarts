import React from 'react';

import {
    IconButton,
    Card,
    CardContent,
    DialogActions,
    DialogContent,
    DialogContentText,
    Dialog,
    Button,
    TextField,
    Box,
} from '@mui/material';

import {
    MdDelete as IconDelete,
    MdEdit as IconEdit,
    MdContentCopy as IconCopy,
    MdMenu as IconDrag,
    MdContentPaste as IconPaste,
    MdClose as IconClose,
} from 'react-icons/md';
import { FaFolder as IconFolderClosed, FaFolderOpen as IconFolderOpened } from 'react-icons/fa';
import { Close as ClearIcon } from '@mui/icons-material';

import { I18n, Utils, ColorPicker, type IobTheme, type AdminConnection } from '@iobroker/adapter-react-v5';

import { IOTextField, IOCheckbox, IOSelect, IOObjectField, IOSlider, IONumberField } from './Fields';

import LineDialog from './LineDialog';
import EditStatesDialog from './EditStatesDialog';
import type { ChartAggregateType, ChartConfigMore, ChartLineConfigMore, ChartType } from '../../../src/types';

const WIDTHS = {
    instance: 100,
    id: 200,
    chartType: 120,
    dataType: 110,
    color: 100,
    name: 200,
    buttons: 50 + 50 + 16 + 50,
};

const styles: Record<string, any> = {
    card: (theme: IobTheme): any => ({
        borderStyle: 'dashed',
        borderWidth: 1,
        mb: '8px',
        p: '8px',
        borderColor: theme.palette.grey['600'],
        overflow: 'initial',
    }),
    cardPaste: (theme: IobTheme): React.CSSProperties => ({
        borderColor: theme.palette.mode === 'dark' ? theme.palette.grey['400'] : theme.palette.grey['800'],
        backgroundColor: 'rgba(0,0,0,0)',
        opacity: 0.8,
    }),
    cardContent: {
        p: 0,
        m: 0,
        '&:last-child': {
            p: 0,
        },
    },
    shortFields: (theme: IobTheme): any => ({
        display: 'flex',
        '& > div': {
            display: 'inline-flex',
            pr: '20px',
            width: 200,
        },
        flexWrap: 'wrap',
        alignItems: 'center',
        position: 'relative',
        pb: '16px',
        borderBottom: `1px dotted ${theme.palette.grey[400]}`,
    }),
    lineClosed: {
        display: 'flex',
        gap: 4,
        alignItems: 'center',
    },
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
    shortFieldsLast: {
        borderBottom: '0px',
        paddingBottom: 0,
    },
    shortInstanceField: {
        display: 'inline-block',
        minWidth: WIDTHS.instance,
        paddingTop: 0,
        verticalAlign: 'top',
    },
    shortIdField: {
        display: 'inline-block',
        minWidth: WIDTHS.id,
        paddingTop: 0,
        verticalAlign: 'top',
    },
    shortDataTypeField: {
        display: 'inline-block',
        minWidth: WIDTHS.dataType,
        paddingTop: 0,
        verticalAlign: 'top',
    },
    shortChartTypeField: {
        display: 'inline-block',
        minWidth: WIDTHS.chartType,
        paddingTop: 0,
        verticalAlign: 'top',
    },
    shortColorField: {
        display: 'inline-block',
        minWidth: WIDTHS.color,
        width: WIDTHS.color,
        paddingTop: 0,
        verticalAlign: 'top',
    },
    shortNameField: {
        display: 'inline-block',
        minWidth: WIDTHS.name,
        paddingTop: 0,
        verticalAlign: 'top',
    },
    shortButtonsField: {
        display: 'inline-block',
        minWidth: WIDTHS.buttons,
        paddingTop: 0,
        verticalAlign: 'top',
    },
    editButton: {},
    deleteButton: {},
    editButtonFull: {},
    deleteButtonFull: {},
    copyButtonFull: {},
    fullWidth: {
        width: '100%',
        minWidth: 200,
    },
    paste: {
        opacity: 0.3,
    },
    emptyDrag: {
        display: 'inline-block',
        width: 16,
    },

    chapterMain: {
        backgroundColor: 'rgba(3,104,255,0.1)',
    },
    chapterTexts: {
        backgroundColor: 'rgba(101,253,0,0.1)',
    },
    chapterLine: {
        backgroundColor: 'rgba(255,20,0,0.1)',
    },
    chapterAxis: {
        backgroundColor: 'rgba(179,2,255,0.1)',
    },
    chapterOther: {
        backgroundColor: 'rgba(255,146,0,0.1)',
    },
    states: {
        verticalAlign: 'top',
        marginTop: 12,
    },
    state: {
        textAlign: 'center',
        marginRight: 8,
    },
    stateValue: {
        fontSize: 10,
    },
    stateText: {
        fontSize: 12,
        fontStyle: 'italic',
        display: 'block',
        whiteSpace: 'nowrap',
    },
};

interface LineProps {
    opened: boolean;
    index?: number;
    line: ChartLineConfigMore;
    width: number;
    maxLines?: number;
    instances: ioBroker.InstanceObject[];
    presetData: ChartConfigMore;
    updateLine?: (index: number, line: ChartLineConfigMore) => void;
    deleteLine: (index: number) => void;
    lineOpenToggle?: (index: number) => void;
    onSelectColor?: (color: string, callback: (color: string) => void) => void;
    onCopy?: (line: ChartLineConfigMore) => void;
    onPaste?: () => void;
    provided?: { dragHandleProps: Record<string, any> };
    snapshot?: { isDragging: boolean };
    theme: IobTheme;
    socket: AdminConnection;
    systemConfig: ioBroker.SystemConfigObject;
}

interface LineState {
    width: number;
    dialogOpen: boolean;
    showConvertHelp: boolean;
    isBoolean: boolean;
    withStates: Record<string, string> | null | false;
    originalStates?: string;
    showStatesEdit?: boolean;
    color: string;
}

class Line extends React.Component<LineProps, LineState> {
    constructor(props: LineProps) {
        super(props);
        this.state = {
            width: this.props.width,
            dialogOpen: false,
            showConvertHelp: false,
            isBoolean: false,
            withStates: null,
            color: this.props.line.color || '',
        };

        if (this.props.line.id) {
            this.props.socket
                .getObject(this.props.line.id)
                .then((obj: ioBroker.StateObject): void => {
                    let newState: Partial<LineState> | null = null;
                    if (obj?.common?.type === 'boolean') {
                        newState = { isBoolean: true };
                    }
                    // we expect states only for enums, like: {0: 'OFF', 1: 'ON', '-1': 'whatever'}
                    if (
                        obj?.common?.states &&
                        typeof obj.common.states !== 'string' &&
                        !Array.isArray(obj.common.states) &&
                        !obj.common.unit
                    ) {
                        newState = newState || {};
                        newState.withStates = obj.common.states;

                        newState.originalStates = JSON.stringify(obj.common.states);
                        if (this.props.line.states) {
                            Object.assign(newState.withStates, this.props.line.states);
                        } else if (this.props.line.states === false) {
                            newState.withStates = false;
                        }
                    }

                    if (newState) {
                        this.setState(newState as LineState);
                    }
                })
                .catch(() => {
                    // ignore
                });
        }
    }

    static getDerivedStateFromProps(props: LineProps, state: LineState): Partial<LineState> | null {
        if (props.width !== state.width) {
            return { width: props.width };
        }
        return null;
    }

    onIdChanged = async (value: string): Promise<void> => {
        const line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
        line.id = value;
        this.props.updateLine(this.props.index, line);

        // If ID changed => read unit and name
        if (this.props.line.id !== value) {
            try {
                const obj: ioBroker.Object | null | undefined = await this.props.socket.getObject(value);
                const _line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
                let name: string;
                if (obj?.common?.name) {
                    name = Utils.getObjectNameFromObj(obj, null, { language: I18n.getLanguage() });
                } else {
                    const _name = value.split('.');
                    name = _name.length ? _name[_name.length - 1] : '';
                }
                if (obj?.common?.unit) {
                    _line.unit = obj.common.unit;
                }
                if (obj?.common && (obj.common.type === 'boolean' || obj.common.type === 'number')) {
                    _line.chartType = 'auto';
                    delete _line.aggregate;
                }

                const newState: Partial<LineState> = { isBoolean: obj?.common?.type === 'boolean' };
                // we expect states only for enums, like: {0: 'OFF', 1: 'ON', '-1': 'whatever'}
                if (
                    obj?.common?.states &&
                    typeof obj?.common?.states !== 'string' &&
                    !Array.isArray(obj.common.states) &&
                    !obj.common.unit
                ) {
                    newState.withStates = obj.common.states as Record<string, string>;
                    newState.originalStates = JSON.stringify(obj.common.states);
                    // merge with existing states
                    if (_line.states) {
                        Object.assign(newState.withStates, _line.states);
                    } else if (_line.states === false) {
                        newState.withStates = false;
                    }
                } else {
                    newState.withStates = null;
                    delete _line.states;
                }

                if (
                    newState.isBoolean !== this.state.isBoolean ||
                    JSON.stringify(this.state.withStates) !== JSON.stringify(newState.withStates) ||
                    this.state.originalStates !== newState.originalStates
                ) {
                    setTimeout(_newState => this.setState(_newState as LineState), 50, newState);
                }
                _line.name = name;
                this.props.updateLine(this.props.index, _line);
                return;
            } catch (e: unknown) {
                console.error(e);
            }
            const _line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
            const _name = value.split('.');
            _line.name = _name.length ? _name[_name.length - 1] : '';
            this.props.updateLine(this.props.index, _line);
        }
    };

    renderClosedLine(): React.JSX.Element {
        const visible: {
            chartType?: boolean;
            dataType?: boolean;
            color?: boolean;
            name?: boolean;
        } = {};

        const windowWidth = this.props.width - 95;
        const padding = 8;

        let idWidth: string;
        if (
            windowWidth >=
            WIDTHS.instance +
                WIDTHS.id +
                WIDTHS.chartType +
                WIDTHS.dataType +
                WIDTHS.color +
                WIDTHS.name +
                WIDTHS.buttons +
                padding * 6
        ) {
            idWidth = `calc(100% - ${WIDTHS.instance + WIDTHS.chartType + WIDTHS.dataType + WIDTHS.color + WIDTHS.name + WIDTHS.buttons + padding * 6}px)`;
            visible.chartType = true;
            visible.dataType = true;
            visible.color = true;
            visible.name = true;
        } else if (
            windowWidth >=
            WIDTHS.instance +
                WIDTHS.id +
                WIDTHS.chartType +
                WIDTHS.dataType +
                WIDTHS.color +
                WIDTHS.buttons +
                padding * 5
        ) {
            idWidth = `calc(100% - ${WIDTHS.buttons + WIDTHS.instance + WIDTHS.chartType + WIDTHS.dataType + WIDTHS.color + padding * 5}px)`;
            visible.chartType = true;
            visible.dataType = true;
            visible.color = true;
        } else if (
            windowWidth >=
            WIDTHS.instance + WIDTHS.id + WIDTHS.chartType + WIDTHS.dataType + WIDTHS.buttons + padding * 4
        ) {
            idWidth = `calc(100% - ${WIDTHS.buttons + WIDTHS.instance + WIDTHS.chartType + WIDTHS.dataType + padding * 4}px)`;
            visible.chartType = true;
            visible.dataType = true;
        } else if (windowWidth >= WIDTHS.instance + WIDTHS.id + WIDTHS.chartType + WIDTHS.buttons + padding * 3) {
            // nothing visible
            idWidth = `calc(100% - ${WIDTHS.buttons + WIDTHS.instance + WIDTHS.chartType + padding * 3}px)`;
            visible.chartType = true;
        } else {
            // nothing visible
            idWidth = `calc(100% - ${WIDTHS.buttons + WIDTHS.instance + padding * 2}px)`;
        }

        const hasBarOrPolar = this.props.presetData.l.find(
            line => line.chartType === 'bar' || line.chartType === 'polar',
        );
        const aggregateTypes: Record<ChartAggregateType, string> = {
            minmax: 'minmax',
            average: 'average',
            min: 'min',
            max: 'max',
            total: 'total',
            count: 'count',
            onchange: 'raw',
            percentile: 'percentile',
            integral: 'integral',

            current: undefined,
            none: undefined,
        };

        if (hasBarOrPolar) {
            delete aggregateTypes.minmax;
            if (this.props.presetData.l.find(line => line.chartType === 'polar')) {
                aggregateTypes.current = 'current';
            }
        }

        return (
            <div style={styles.lineClosed}>
                {this.props.provided ? (
                    <span
                        title={I18n.t('Drag me')}
                        style={{ marginTop: 4 }}
                        {...this.props.provided.dragHandleProps}
                    >
                        <IconDrag />
                    </span>
                ) : (
                    <div style={styles.emptyDrag} />
                )}
                {this.props.onPaste ? (
                    <IconButton
                        title={I18n.t('Paste')}
                        onClick={() => this.props.onPaste()}
                    >
                        <IconPaste />
                    </IconButton>
                ) : (
                    <IconButton
                        title={I18n.t('Edit')}
                        onClick={() => this.props.lineOpenToggle(this.props.index)}
                    >
                        <IconFolderClosed />
                    </IconButton>
                )}
                <IOSelect
                    disabled={!!this.props.onPaste}
                    value={this.props.line.instance}
                    updateValue={(value: string): void => {
                        const line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
                        line.instance = value;
                        this.props.updateLine(this.props.index, line);
                    }}
                    label="Source"
                    noTranslate
                    options={(() => {
                        const result: Record<string, string> = { '': I18n.t('standard') };
                        this.props.instances.forEach(
                            instance => (result[instance._id] = instance._id.replace('system.adapter.', '')),
                        );
                        result.json = 'JSON';
                        return result;
                    })()}
                    minWidth={WIDTHS.instance}
                    styles={{
                        fieldContainer: {
                            ...styles.shortInstanceField,
                            ...(this.props.onPaste ? styles.paste : undefined),
                            marginTop: 2,
                        },
                    }}
                />
                <IOObjectField
                    disabled={!!this.props.onPaste}
                    value={this.props.line.id}
                    updateValue={this.onIdChanged}
                    theme={this.props.theme}
                    width={idWidth}
                    name="id"
                    label="ID"
                    customFilter={
                        this.props.line.instance !== 'json'
                            ? {
                                  common: {
                                      custom: this.props.line.instance
                                          ? this.props.line.instance.replace('system.adapter.', '')
                                          : this.props.systemConfig.common.defaultHistory || true,
                                  },
                              }
                            : null
                    }
                    styles={{
                        fieldContainer: { ...styles.shortIdField, ...(this.props.onPaste ? styles.paste : undefined) },
                    }}
                    socket={this.props.socket}
                />
                {visible.chartType ? (
                    <IOSelect
                        disabled={!!this.props.onPaste}
                        value={this.props.line.chartType}
                        updateValue={(value: string): void => {
                            const line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
                            line.chartType = value as ChartType;
                            this.props.updateLine(this.props.index, line);
                        }}
                        minWidth={WIDTHS.chartType}
                        label="Chart type"
                        options={{
                            auto: 'Auto',
                            line: 'Line',
                            bar: 'Bar',
                            polar: 'Polar',
                            scatterplot: 'Scatter plot',
                            steps: 'Steps',
                            stepsStart: 'Steps on start',
                            spline: 'Spline',
                        }}
                        styles={{
                            fieldContainer: {
                                ...styles.shortChartTypeField,
                                ...(this.props.onPaste ? styles.paste : undefined),
                                marginTop: 2,
                            },
                        }}
                    />
                ) : null}
                {this.props.line.instance !== 'json' && visible.dataType && this.props.line.chartType !== 'auto' ? (
                    <IOSelect
                        disabled={!!this.props.onPaste}
                        value={this.props.line.aggregate}
                        updateValue={(value: string): void => {
                            const line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
                            line.aggregate = value as ChartAggregateType;
                            if (
                                value === 'percentile' &&
                                (line.percentile === undefined || line.percentile < 0 || line.percentile > 100)
                            ) {
                                line.percentile = 50;
                            } else if (value === 'integral') {
                                line.integralUnit = line.integralUnit || 60;
                                line.integralInterpolation = line.integralInterpolation || 'none';
                            }
                            this.props.updateLine(this.props.index, line);
                        }}
                        minWidth={WIDTHS.dataType}
                        label="Type"
                        options={aggregateTypes}
                        styles={{
                            fieldContainer: {
                                ...styles.shortDataTypeField,
                                ...(this.props.onPaste ? styles.paste : undefined),
                            },
                        }}
                    />
                ) : null}
                {visible.color
                    ? this.renderColorField(
                          WIDTHS.color,
                          { ...styles.shortColorField, ...(this.props.onPaste ? styles.paste : undefined) },
                          true,
                      )
                    : null}
                {visible.name ? (
                    <IOTextField
                        disabled={!!this.props.onPaste}
                        width={WIDTHS.name}
                        value={this.props.line.name}
                        updateValue={(value: string): void => {
                            const line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
                            line.name = value;
                            this.props.updateLine(this.props.index, line);
                        }}
                        label="Name"
                        styles={{
                            fieldContainer: {
                                ...styles.shortNameField,
                                ...(this.props.onPaste ? styles.paste : undefined),
                            },
                        }}
                    />
                ) : null}
                <div style={{ flexGrow: 1 }} />
                {!this.props.onPaste &&
                this.props.line.chartType !== 'scatterplot' &&
                this.props.line.chartType !== 'bar' &&
                (!this.props.index || this.props.line.chartType !== 'polar') ? (
                    <IconButton
                        style={styles.editButton}
                        aria-label="Edit"
                        title={I18n.t('Edit')}
                        onClick={() => this.setState({ dialogOpen: true })}
                    >
                        <IconEdit />
                    </IconButton>
                ) : null}
                <IconButton
                    style={styles.deleteButton}
                    aria-label="Delete"
                    title={I18n.t('Delete')}
                    onClick={() => this.props.deleteLine(this.props.index)}
                >
                    <IconDelete />
                </IconButton>
                <div style={{ width: 30 }} />
            </div>
        );
    }

    renderColorField(minWidth?: string | number, style?: React.CSSProperties, noPadding?: boolean): React.JSX.Element {
        let textColor = Utils.isUseBright(this.props.line.color, null);
        if (textColor === null) {
            textColor = undefined;
        }

        const updateValue = (value: string): void => {
            const line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
            line.color = value;
            this.props.updateLine(this.props.index, line);
        };

        return (
            <div style={style}>
                <TextField
                    variant="standard"
                    disabled={!!this.props.onPaste}
                    style={{ minWidth, width: 'calc(100% - 8px)' }}
                    label={I18n.t('Color')}
                    value={this.props.line.color || ''}
                    onClick={() => {
                        if (!this.props.onPaste) {
                            this.setState({ color: this.props.line.color }, () =>
                                this.props.onSelectColor(this.state.color, color =>
                                    this.setState({ color }, () => updateValue(ColorPicker.getColor(color, true))),
                                ),
                            );
                        }
                    }}
                    onChange={e => {
                        const color = e.target.value;
                        this.setState({ color }, () => updateValue(color));
                    }}
                    slotProps={{
                        htmlInput: {
                            style: {
                                paddingLeft: noPadding ? 0 : 8,
                                backgroundColor: this.props.line.color,
                                color: textColor ? '#FFF' : '#000',
                            },
                        },
                        input: {
                            endAdornment: this.props.line.color ? (
                                <IconButton
                                    disabled={!!this.props.onPaste}
                                    size="small"
                                    onClick={e => {
                                        e.stopPropagation();
                                        this.setState({ color: '' }, () => {
                                            updateValue('');
                                        });
                                    }}
                                >
                                    <ClearIcon />
                                </IconButton>
                            ) : undefined,
                        },
                        inputLabel: { shrink: true },
                    }}
                />
            </div>
        );
    }

    showConvertHelp = (): void => this.setState({ showConvertHelp: true });

    renderConvertHelp(): React.JSX.Element | null {
        if (!this.state.showConvertHelp) {
            return null;
        }

        return (
            <Dialog
                open={!0}
                onClose={() => this.setState({ showConvertHelp: false })}
            >
                <DialogContent>
                    <DialogContentText>{I18n.t('convert_help')}</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        onClick={() => this.setState({ showConvertHelp: false })}
                        color="primary"
                        startIcon={<IconClose />}
                    >
                        {I18n.t('Close')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    renderStates(): React.JSX.Element | null {
        if (this.state.withStates === null) {
            return null;
        }
        return (
            <div style={styles.states}>
                {this.state.withStates ? (
                    Object.keys(this.state.withStates).map(val => (
                        <div
                            key={val}
                            style={styles.state}
                        >
                            <span style={styles.stateValue}>{val}</span>↓
                            <span style={styles.stateText}>
                                {(this.state.withStates as Record<string, string>)[val]}
                            </span>
                        </div>
                    ))
                ) : (
                    <div style={styles.state}>
                        <span style={styles.stateText}>{I18n.t('Text values not used')}</span>
                    </div>
                )}
                <Button
                    variant="outlined"
                    onClick={() => this.setState({ showStatesEdit: true })}
                    startIcon={<IconEdit />}
                    title={I18n.t('Edit state names')}
                >
                    ...
                </Button>

                {this.state.showStatesEdit ? (
                    <EditStatesDialog
                        withStates={this.state.withStates as Record<string, string>}
                        originalStates={this.state.originalStates}
                        isBoolean={this.state.isBoolean}
                        onClose={withStates => {
                            if (withStates !== undefined) {
                                this.setState({
                                    showStatesEdit: false,
                                    withStates: JSON.parse(JSON.stringify(withStates)),
                                });
                                const line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
                                if (withStates) {
                                    const states: Record<string, string> = JSON.parse(JSON.stringify(withStates));
                                    const originalStates = JSON.parse(this.state.originalStates);
                                    Object.keys(states).forEach(val => {
                                        if (states[val] === originalStates[val]) {
                                            delete states[val];
                                        }
                                    });
                                    line.states = states;
                                } else {
                                    line.states = false;
                                }
                                this.props.updateLine(this.props.index, line);
                            } else {
                                this.setState({ showStatesEdit: false });
                            }
                        }}
                    />
                ) : null}
            </div>
        );
    }

    renderOpenedLine(): React.JSX.Element {
        const xAxisOptions: Record<string, string> = {
            '': I18n.t('own axis'),
        };
        for (let i = 0; i < this.props.maxLines; i++) {
            if (i !== this.props.index) {
                if (this.props.presetData.l[i].commonYAxis === undefined) {
                    xAxisOptions[i] = I18n.t('From line %s', i + 1);
                }
            }
        }
        const hasBarOrPolar = this.props.presetData.l.find(
            line => line.chartType === 'bar' || line.chartType === 'polar',
        );

        const chartTypes = {
            auto: 'Auto (Line or Steps)',
            line: 'Line',
            bar: 'Bar',
            polar: 'Polar',
            scatterplot: 'Scatter plot',
            steps: 'Steps',
            stepsStart: 'Steps on start',
            spline: 'Spline',
        };

        const aggregateTypes: Record<ChartAggregateType, string | undefined> = {
            minmax: 'minmax',
            average: 'average',
            min: 'min',
            max: 'max',
            total: 'total',
            count: 'count',
            onchange: 'raw',
            percentile: 'percentile',
            integral: 'integral',
            current: undefined,
            none: undefined,
        };

        if (hasBarOrPolar) {
            delete aggregateTypes.minmax;
            if (this.props.presetData.l.find(line => line.chartType === 'polar')) {
                aggregateTypes.current = 'current';
            }
        }

        const ownYAxis = this.props.line.commonYAxis === undefined;
        return (
            <>
                {/* Folder line */}
                <div style={styles.lineClosed}>
                    {this.props.provided ? (
                        <span
                            title={I18n.t('Drag me')}
                            {...this.props.provided.dragHandleProps}
                        >
                            <IconDrag />
                        </span>
                    ) : null}
                    <IconButton
                        title={I18n.t('Close')}
                        onClick={() => this.props.lineOpenToggle(this.props.index)}
                    >
                        <IconFolderOpened />
                    </IconButton>
                    {I18n.t('Line')} {this.props.index + 1}
                    {this.props.line.name ? ` - ${this.props.line.name}` : ''}
                    <div style={{ flexGrow: 1 }} />
                    <IconButton
                        style={styles.copyButtonFull}
                        aria-label="Copy"
                        title={I18n.t('Copy')}
                        onClick={() => this.props.onCopy(this.props.line)}
                    >
                        <IconCopy />
                    </IconButton>
                    {this.props.line.chartType !== 'scatterplot' &&
                    this.props.line.chartType !== 'bar' &&
                    (!this.props.index || this.props.line.chartType !== 'polar') ? (
                        <IconButton
                            style={styles.editButtonFull}
                            aria-label="Edit"
                            title={I18n.t('Edit')}
                            onClick={() => this.setState({ dialogOpen: true })}
                        >
                            <IconEdit />
                        </IconButton>
                    ) : null}
                    <IconButton
                        style={styles.deleteButtonFull}
                        aria-label="Delete"
                        title={I18n.t('Delete')}
                        onClick={() => this.props.deleteLine(this.props.index)}
                    >
                        <IconDelete />
                    </IconButton>
                    <div style={{ width: 30 }} />
                </div>
                {/* Source and OID */}
                <Box
                    component="div"
                    sx={styles.shortFields}
                    style={{ marginRight: 30 }}
                >
                    <IOSelect
                        value={this.props.line.instance}
                        updateValue={(value: string): void => {
                            const line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
                            line.instance = value as ChartType;
                            this.props.updateLine(this.props.index, line);
                        }}
                        label="Source"
                        noTranslate
                        options={(() => {
                            const result: Record<string, string> = {};
                            this.props.instances.forEach(
                                instance => (result[instance._id] = instance._id.replace('system.adapter.', '')),
                            );
                            result.json = 'JSON';
                            return result;
                        })()}
                    />
                    <IOObjectField
                        theme={this.props.theme}
                        value={this.props.line.id}
                        styles={{ objectContainer: styles.fullWidth }}
                        updateValue={this.onIdChanged}
                        name="id"
                        label="ID"
                        width="calc(100% - 250px)"
                        customFilter={
                            this.props.line.instance !== 'json'
                                ? {
                                      common: {
                                          custom: this.props.line.instance
                                              ? this.props.line.instance.replace('system.adapter.', '')
                                              : this.props.systemConfig.common.defaultHistory || true,
                                      },
                                  }
                                : undefined
                        }
                        socket={this.props.socket}
                    />
                </Box>
                {/* main settings */}
                <Box
                    component="div"
                    sx={Utils.getStyle(this.props.theme, styles.shortFields, styles.chapterMain)}
                >
                    <p style={styles.title}>{I18n.t('Main')}</p>
                    {!this.props.index || this.props.line.chartType !== 'polar' ? this.renderColorField() : null}
                    <IOSelect
                        value={this.props.line.chartType}
                        updateValue={(value: string): void => {
                            const line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
                            line.chartType = value as ChartType;
                            this.props.updateLine(this.props.index, line);
                        }}
                        label="Chart type"
                        options={chartTypes}
                    />
                    {this.props.line.instance !== 'json' && this.props.line.chartType !== 'auto' ? (
                        <IOSelect
                            value={this.props.line.aggregate}
                            updateValue={(value: string): void => {
                                const line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
                                line.aggregate = value as ChartAggregateType;
                                this.props.updateLine(this.props.index, line);
                            }}
                            label="Type"
                            options={aggregateTypes}
                        />
                    ) : null}
                    {this.props.line.chartType === 'bar' ? (
                        <IOSelect
                            value={this.props.line.postProcessing}
                            updateValue={(value: string): void => {
                                const line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
                                line.postProcessing = value as '' | 'diff';
                                this.props.updateLine(this.props.index, line);
                            }}
                            label="Processing"
                            options={{
                                '': 'non-processed',
                                diff: 'difference',
                            }}
                        />
                    ) : null}
                    {this.props.line.aggregate === 'percentile' ? (
                        <IOSlider
                            value={this.props.line.percentile}
                            updateValue={(value: number): void => {
                                const line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
                                line.percentile = value;
                                this.props.updateLine(this.props.index, line);
                            }}
                            step={5}
                            min={0}
                            max={100}
                            label="Percentile"
                        />
                    ) : null}
                    {this.props.line.aggregate === 'integral' ? (
                        <IONumberField
                            value={this.props.line.integralUnit}
                            updateValue={(value: number): void => {
                                const line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
                                line.integralUnit = value;
                                this.props.updateLine(this.props.index, line);
                            }}
                            label="Integral unit"
                            min={1}
                            tooltip={I18n.t('In seconds')}
                        />
                    ) : null}
                    {this.props.line.aggregate === 'integral' ? (
                        <IOSelect
                            value={this.props.line.integralInterpolation}
                            updateValue={(value: string): void => {
                                const line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
                                line.integralInterpolation = value as 'none' | 'linear';
                                this.props.updateLine(this.props.index, line);
                            }}
                            label="Interpolation method"
                            options={{
                                none: 'none_no',
                                linear: 'linear',
                            }}
                        />
                    ) : null}
                    {this.props.line.chartType === 'scatterplot' || this.props.line.points ? (
                        <IONumberField
                            value={this.props.line.symbolSize}
                            updateValue={(value: number): void => {
                                const line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
                                line.symbolSize = value;
                                this.props.updateLine(this.props.index, line);
                            }}
                            label="Point size"
                            min={1}
                        />
                    ) : null}
                    {this.props.line.chartType !== 'scatterplot' &&
                    this.props.line.chartType !== 'bar' &&
                    this.props.line.chartType !== 'polar' ? (
                        <IONumberField
                            value={this.props.line.validTime}
                            updateValue={(value: number): void => {
                                const line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
                                line.validTime = value;
                                this.props.updateLine(this.props.index, line);
                            }}
                            label="Valid time (sec)"
                            min={0}
                            tooltip={I18n.t(
                                'If the current value is not older than X seconds, assume it is still the same.',
                            )}
                        />
                    ) : null}
                    {this.props.presetData.legend ? (
                        <IOCheckbox
                            value={this.props.line.hide}
                            updateValue={(value: boolean): void => {
                                const line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
                                line.hide = value;
                                this.props.updateLine(this.props.index, line);
                            }}
                            label="Show only in legend"
                        />
                    ) : null}
                    {this.props.line.chartType !== 'bar' && this.props.line.chartType !== 'polar' ? (
                        <IOCheckbox
                            value={this.props.line.noFuture}
                            updateValue={(value: boolean): void => {
                                const line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
                                line.noFuture = value;
                                this.props.updateLine(this.props.index, line);
                            }}
                            label="No future"
                        />
                    ) : null}
                </Box>
                <Box
                    component="div"
                    sx={Utils.getStyle(this.props.theme, styles.shortFields, styles.chapterTexts)}
                >
                    <p style={styles.title}>{I18n.t('Texts')}</p>
                    <IOTextField
                        value={this.props.line.name}
                        updateValue={(value: string): void => {
                            const line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
                            line.name = value;
                            this.props.updateLine(this.props.index, line);
                        }}
                        label="Name"
                    />
                    {!this.state.isBoolean && ownYAxis ? (
                        <IOTextField
                            value={this.props.line.unit}
                            updateValue={(value: string): void => {
                                const line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
                                line.unit = value;
                                this.props.updateLine(this.props.index, line);
                            }}
                            label="Unit"
                        />
                    ) : null}
                    {this.state.isBoolean && this.state.withStates === null ? (
                        <IOTextField
                            value={this.props.line.falseText}
                            updateValue={(value: string): void => {
                                const line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
                                line.falseText = value;
                                this.props.updateLine(this.props.index, line);
                            }}
                            label="Text by false"
                        />
                    ) : null}
                    {this.state.isBoolean && this.state.withStates === null ? (
                        <IOTextField
                            value={this.props.line.trueText}
                            updateValue={(value: string): void => {
                                const line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
                                line.trueText = value;
                                this.props.updateLine(this.props.index, line);
                            }}
                            label="Text by true"
                        />
                    ) : null}
                    {this.renderStates()}
                </Box>
                {/* Line thick and fill */}
                {this.props.line.chartType !== 'scatterplot' &&
                this.props.line.chartType !== 'bar' &&
                (!this.props.index || this.props.line.chartType !== 'polar') ? (
                    <Box
                        component="div"
                        sx={Utils.getStyle(this.props.theme, styles.shortFields, styles.chapterLine)}
                    >
                        <p style={styles.title}>{I18n.t('Line and area')}</p>
                        <IOSlider
                            value={this.props.line.fill}
                            updateValue={(value: number): void => {
                                const line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
                                line.fill = value;
                                if (value < 0.01 && !parseFloat(line.thickness as unknown as string)) {
                                    line.thickness = 1;
                                }
                                this.props.updateLine(this.props.index, line);
                            }}
                            min={0}
                            max={1}
                            step={0.1}
                            label="Fill (from 0 to 1)"
                        />
                        <IOCheckbox
                            value={this.props.line.points}
                            updateValue={(value: boolean): void => {
                                const line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
                                line.points = value;
                                this.props.updateLine(this.props.index, line);
                            }}
                            label="Show points"
                        />
                        {this.props.line.points ? (
                            <IONumberField
                                value={this.props.line.symbolSize}
                                updateValue={(value: number): void => {
                                    const line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
                                    line.symbolSize = value;
                                    this.props.updateLine(this.props.index, line);
                                }}
                                label="Point size"
                                min={1}
                            />
                        ) : null}
                        <IONumberField
                            value={this.props.line.thickness}
                            updateValue={(value: number): void => {
                                const line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
                                line.thickness = value;
                                this.props.updateLine(this.props.index, line);
                            }}
                            label="ØL - Line thickness"
                            min={this.props.line.fill > 0.01 ? 0 : 1}
                        />
                        <IONumberField
                            value={this.props.line.shadowsize}
                            updateValue={(value: number): void => {
                                const line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
                                line.shadowsize = value;
                                this.props.updateLine(this.props.index, line);
                            }}
                            label="ØS - Shadow size"
                            min={0}
                        />
                    </Box>
                ) : null}
                {/* Axis */}
                <Box
                    component="div"
                    sx={Utils.getStyle(this.props.theme, styles.shortFields, styles.chapterAxis)}
                >
                    <p style={styles.title}>{I18n.t('Axis')}</p>
                    {!this.props.index && this.props.line.chartType !== 'polar' ? (
                        <IOSelect
                            value={this.props.line.xaxe}
                            updateValue={(value: string): void => {
                                const line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
                                line.xaxe = value as 'top' | '' | 'off';
                                this.props.updateLine(this.props.index, line);
                            }}
                            label="X Axis position"
                            options={{
                                '': 'bottom',
                                top: 'top',
                                off: 'off',
                            }}
                        />
                    ) : null}
                    {!this.props.index && this.props.line.chartType !== 'polar' ? (
                        <IONumberField
                            value={this.props.line.xticks}
                            updateValue={(value: number): void => {
                                const line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
                                line.xticks = value;
                                this.props.updateLine(this.props.index, line);
                            }}
                            label="X-Axis ticks"
                            min={1}
                        />
                    ) : null}
                    {this.props.line.chartType !== 'polar' ? (
                        <IOSelect
                            value={this.props.line.offset === undefined ? '0' : this.props.line.offset.toString()}
                            updateValue={(value: string | number): void => {
                                const line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
                                if (!value) {
                                    delete line.offset;
                                } else {
                                    line.offset = value as
                                        | number
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
                                }
                                this.props.updateLine(this.props.index, line);
                            }}
                            tooltip={I18n.t('This time offset will be added to the request by reading data from DB')}
                            label="X-Offset"
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
                    ) : null}
                    {this.props.line.chartType !== 'polar' ? (
                        <IONumberField
                            value={this.props.line.yOffset}
                            updateValue={(value: number): void => {
                                const line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
                                line.yOffset = value;
                                this.props.updateLine(this.props.index, line);
                            }}
                            label="Y-Offset"
                        />
                    ) : null}

                    <br />
                    {this.props.line.chartType !== 'polar' ? (
                        <IOSelect
                            value={
                                this.props.line.commonYAxis === undefined ? '' : this.props.line.commonYAxis.toString()
                            }
                            updateValue={(value: string): void => {
                                const line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
                                line.commonYAxis = value === '' ? undefined : parseInt(value, 10);
                                this.props.updateLine(this.props.index, line);
                            }}
                            label="Common Y Axis"
                            noTranslate
                            options={xAxisOptions}
                        />
                    ) : null}

                    {this.props.line.chartType !== 'polar' && ownYAxis ? (
                        <IOSelect
                            value={this.props.line.yaxe}
                            updateValue={(value: string): void => {
                                const line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
                                line.yaxe = value as 'off' | 'left' | 'right' | 'leftColor' | 'rightColor' | '';
                                this.props.updateLine(this.props.index, line);
                            }}
                            label="Y Axis position"
                            options={{
                                '': '',
                                off: 'off',
                                left: 'left',
                                right: 'right',
                                leftColor: 'left colored',
                                rightColor: 'right colored',
                            }}
                        />
                    ) : null}
                    {this.props.line.chartType !== 'polar' && ownYAxis ? (
                        <IOTextField
                            value={this.props.line.min === undefined ? '' : this.props.line.min.toString()}
                            updateValue={(value: string): void => {
                                const line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
                                line.min = value;
                                this.props.updateLine(this.props.index, line);
                            }}
                            label="Min"
                        />
                    ) : null}
                    {ownYAxis ? (
                        <IOTextField
                            value={this.props.line.max === undefined ? '' : this.props.line.max.toString()}
                            updateValue={(value: string): void => {
                                const line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
                                line.max = value;
                                this.props.updateLine(this.props.index, line);
                            }}
                            label="Max"
                        />
                    ) : null}
                    {this.props.line.chartType !== 'polar' && ownYAxis ? (
                        <IONumberField
                            value={this.props.line.yticks}
                            updateValue={(value: number): void => {
                                const line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
                                line.yticks = value;
                                this.props.updateLine(this.props.index, line);
                            }}
                            label="Y-Axis ticks"
                        />
                    ) : null}
                </Box>
                {/* Other settings */}
                <Box
                    component="div"
                    sx={Utils.getStyle(this.props.theme, styles.shortFields, styles.chapterOther)}
                >
                    <p style={styles.title}>{I18n.t('Others')}</p>
                    <IOSelect
                        value={
                            this.props.line.ignoreNull === undefined ? 'false' : this.props.line.ignoreNull.toString()
                        }
                        updateValue={(value: string): void => {
                            const line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
                            line.ignoreNull = value === 'true' ? true : value === '0' ? 0 : false;
                            this.props.updateLine(this.props.index, line);
                        }}
                        label="NULL as"
                        options={{
                            false: 'default',
                            true: 'ignore null values',
                            0: 'use 0 instead of null values',
                        }}
                    />
                    {/* <IOTextField value={this.props.line.} updateValue={(value: number): void => {
                        const line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
                        line.integralUnit = value;
                        this.props.updateLine(this.props.index, line);
                    }} name="smoothing" label="Smoothing" type="number" min={0} /> */}
                    <IONumberField
                        value={this.props.line.afterComma}
                        updateValue={(value: number): void => {
                            const line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
                            line.afterComma = value;
                            this.props.updateLine(this.props.index, line);
                        }}
                        label="Digits after comma"
                        min={0}
                    />
                    {this.props.line.chartType !== 'bar' ? (
                        <IOSelect
                            value={this.props.line.lineStyle}
                            updateValue={(value: string): void => {
                                const line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
                                line.lineStyle = value as 'solid' | 'dashed' | 'dotted';
                                this.props.updateLine(this.props.index, line);
                            }}
                            label="Line style"
                            options={{
                                solid: 'solid',
                                dashed: 'dashed',
                                dotted: 'dotted',
                            }}
                        />
                    ) : null}
                    <IOTextField
                        value={this.props.line.convert}
                        updateValue={(value: string): void => {
                            const line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
                            line.convert = value;
                            this.props.updateLine(this.props.index, line);
                        }}
                        label="Convert formula"
                        helperLink={this.showConvertHelp}
                    />
                </Box>
                {/* <Box component="div" sx={Utils.getStyle(this.props.theme, styles.shortFields, styles.shortFieldsLast)}>
                <IOCheckbox value={this.props.line.} updateValue={(value: number): void => {
                        const line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
                        line.integralUnit = value;
                        this.props.updateLine(this.props.index, line);
                    }} name="dashes" label="Dashes" />
                {this.props.line.dashes ? <IOTextField value={this.props.line.} updateValue={(value: number): void => {
                        const line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
                        line.integralUnit = value;
                        this.props.updateLine(this.props.index, line);
                    }} name="dashLength" label="Dashes length" min={1} type="number" /> : null}
                {this.props.line.dashes ? <IOTextField value={this.props.line.} updateValue={(value: number): void => {
                        const line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
                        line.integralUnit = value;
                        this.props.updateLine(this.props.index, line);
                    }} name="spaceLength" label="Space length" min={1} type="number" /> : null}
            </Box> */}
            </>
        );
    }

    render(): React.JSX.Element {
        return (
            <Card
                sx={Utils.getStyle(this.props.theme, styles.card, this.props.onPaste && styles.cardPaste)}
                style={{
                    background: this.props.snapshot?.isDragging ? this.props.theme.palette.secondary.light : undefined,
                }}
            >
                <CardContent sx={styles.cardContent}>
                    {this.props.opened && !this.props.onPaste ? this.renderOpenedLine() : this.renderClosedLine()}
                    <LineDialog
                        open={this.state.dialogOpen}
                        onClose={() => this.setState({ dialogOpen: false })}
                        line={this.props.line}
                        index={this.props.index}
                        updateLine={(index: number, line: ChartLineConfigMore): void =>
                            this.props.updateLine(index, line)
                        }
                    />
                </CardContent>
                {this.renderConvertHelp()}
            </Card>
        );
    }
}

export default Line;
