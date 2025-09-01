import React from 'react';

import { IconButton, Card, CardContent, TextField, Box } from '@mui/material';

import {
    ContentCopy as IconCopy,
    ContentPaste as IconPaste,
    Delete as IconDelete,
    Close as ClearIcon,
} from '@mui/icons-material';
import { FaFolder as IconFolderClosed, FaFolderOpen as IconFolderOpened } from 'react-icons/fa';

import { I18n, Utils, ColorPicker, type IobTheme, type AdminConnection } from '@iobroker/adapter-react-v5';

import { IOTextField, IOSelect, IOObjectField, IOSlider, IONumberField } from './Fields';
import type { ChartConfigMore, ChartMarkConfig } from '../../../src/types';

const WIDTHS = {
    lineId: 100,
    upperValueOrId: 150,
    lowerValueOrId: 100,
    color: 100,
    fill: 100,
    text: 150,
    buttons: 70,
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
    cardPaste: (theme: IobTheme): any => ({
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
        display: 'block',
        '& > div': {
            display: 'inline-flex',
            pr: '20px',
            width: 200,
        },
        pb: '16px',
        borderBottom: `1px dotted ${theme.palette.grey[400]}`,
    }),
    shortFieldsLast: {
        borderBottom: 0,
        paddingBottom: 0,
        position: 'relative',
    },
    shortLineIdField: {
        display: 'inline-flex',
        minWidth: WIDTHS.lineId,
        paddingTop: 0,
        verticalAlign: 'top',
        marginTop: 2,
    },
    shortUpperValueOrIdField: {
        display: 'inline-flex',
        minWidth: WIDTHS.upperValueOrId,
        paddingTop: 0,
        verticalAlign: 'top',
    },
    shortLowerValueOrIdField: {
        display: 'inline-flex',
        minWidth: WIDTHS.lowerValueOrId,
        paddingTop: 0,
        verticalAlign: 'top',
    },
    shortColorField: {
        display: 'inline-flex',
        minWidth: WIDTHS.color,
        paddingTop: 0,
        verticalAlign: 'top',
    },
    shortFillField: {
        display: 'inline-flex',
        width: WIDTHS.fill,
        paddingTop: 0,
        verticalAlign: 'top',
    },
    sliderRoot: {
        marginTop: 10,
    },
    shortTextField: {
        display: 'inline-flex',
        minWidth: WIDTHS.text,
        paddingTop: 0,
        verticalAlign: 'top',
    },
    shortButtonsField: {
        display: 'inline-flex',
        minWidth: WIDTHS.buttons,
        paddingTop: 0,
        verticalAlign: 'top',
    },
    lineClosed: {
        display: 'inline-flex',
        flexFlow: 'column wrap',
        overflow: 'hidden',
        flexDirection: 'row',
        flex: 1,
    },
    lineClosedContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: 4,
    },
    deleteButton: {},
    deleteButtonFull: {},
    copyButtonFull: {},
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
        paddingRight: 40,
    },
};

interface MarkProps {
    mark: ChartMarkConfig;
    index?: number;
    updateMark?: (index: number, mark: ChartMarkConfig) => void;
    deleteMark: (index: number) => void;
    onPaste?: () => void;
    socket?: AdminConnection;
    opened: boolean;
    markOpenToggle?: (index: number) => void;
    onSelectColor?: (color: string, cb: (color: string) => void) => void;
    onCopy?: (mark: ChartMarkConfig) => void;
    theme: IobTheme;
    presetData: ChartConfigMore;
    width: number;
}

interface MarkState {
    color: string;
    textColor: string;
}

class Mark extends React.Component<MarkProps, MarkState> {
    constructor(props: MarkProps) {
        super(props);
        this.state = {
            color: props.mark.color,
            textColor: props.mark.textColor,
        };
    }

    renderColorField(minWidth?: string | number, styles?: React.CSSProperties): React.JSX.Element {
        let textColorInvert = Utils.isUseBright(this.props.mark.color, null);
        if (textColorInvert === null) {
            textColorInvert = undefined;
        }

        const onUpdate = (color: string): void => {
            const mark: ChartMarkConfig = JSON.parse(JSON.stringify(this.props.mark));
            mark.color = color;
            this.props.updateMark(this.props.index, mark);
        };

        return (
            <div style={styles}>
                <TextField
                    variant="standard"
                    disabled={!!this.props.onPaste}
                    style={{ minWidth, width: 'calc(100% - 8px)' }}
                    label={I18n.t('Color')}
                    value={this.props.mark.color}
                    onClick={() =>
                        !this.props.onPaste &&
                        this.setState({ color: this.props.mark.color }, () =>
                            this.props.onSelectColor(this.state.color, color =>
                                this.setState({ color }, () => onUpdate(ColorPicker.getColor(color, true))),
                            ),
                        )
                    }
                    onChange={e => {
                        const color = e.target.value;
                        this.setState({ color }, () => onUpdate(color));
                    }}
                    slotProps={{
                        htmlInput: {
                            style: {
                                paddingLeft: 8,
                                backgroundColor: this.props.mark.color,
                                color: textColorInvert ? '#FFF' : '#000',
                            },
                        },
                        input: {
                            endAdornment:
                                !this.props.onPaste && this.props.mark.color ? (
                                    <IconButton
                                        size="small"
                                        onClick={e => {
                                            e.stopPropagation();
                                            this.setState({ color: '' }, () => onUpdate(''));
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

    renderTextColorField(minWidth?: string | number, styles?: React.CSSProperties): React.JSX.Element {
        let textColorInvert = Utils.isUseBright(this.props.mark.textColor, null);
        if (textColorInvert === null) {
            textColorInvert = undefined;
        }

        const onUpdate = (textColor: string): void => {
            const mark: ChartMarkConfig = JSON.parse(JSON.stringify(this.props.mark));
            mark.textColor = textColor;
            this.props.updateMark(this.props.index, mark);
        };

        return (
            <div style={styles}>
                <TextField
                    variant="standard"
                    disabled={!!this.props.onPaste}
                    style={{ minWidth, width: 'calc(100% - 8px)' }}
                    label={I18n.t('Text color')}
                    value={this.props.mark.textColor}
                    onClick={() =>
                        !this.props.onPaste &&
                        this.setState({ textColor: this.props.mark.textColor }, () =>
                            this.props.onSelectColor(this.state.textColor, textColor =>
                                this.setState({ textColor }, () => onUpdate(ColorPicker.getColor(textColor, true))),
                            ),
                        )
                    }
                    onChange={e => {
                        const textColor = e.target.value;
                        this.setState({ textColor }, () => onUpdate(textColor));
                    }}
                    slotProps={{
                        htmlInput: {
                            style: {
                                paddingLeft: 8,
                                backgroundColor: this.props.mark.textColor,
                                color: textColorInvert ? '#FFF' : '#000',
                            },
                        },
                        input: {
                            endAdornment:
                                !this.props.onPaste && this.props.mark.textColor ? (
                                    <IconButton
                                        size="small"
                                        onClick={e => {
                                            e.stopPropagation();
                                            this.setState({ textColor: '' }, () => onUpdate(''));
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

    renderClosedLine(lines: Record<number, string>, colors: Record<number, string>): React.JSX.Element {
        const visible: {
            upper?: boolean;
            lower?: boolean;
            color?: boolean;
            fill?: boolean;
            text?: boolean;
        } = {};
        const upperVisible = this.props.mark.lineId !== null && this.props.mark.lineId !== undefined ? 1 : 0;
        const lowerVisible =
            upperVisible &&
            this.props.mark.upperValueOrId !== null &&
            this.props.mark.upperValueOrId !== undefined &&
            this.props.mark.upperValueOrId !== ''
                ? 1
                : 0;
        const fillVisible =
            lowerVisible &&
            this.props.mark.lowerValueOrId !== null &&
            this.props.mark.lowerValueOrId !== undefined &&
            this.props.mark.lowerValueOrId !== ''
                ? 1
                : 0;
        const windowWidth = (this.props.width || 1024) - 32 - 40; // 32 is padding, width of folder icon is 40
        const padding = 4;

        if (
            windowWidth >=
            WIDTHS.lineId +
                WIDTHS.upperValueOrId * upperVisible +
                WIDTHS.lowerValueOrId * lowerVisible +
                WIDTHS.color * lowerVisible +
                WIDTHS.fill * fillVisible +
                WIDTHS.text * lowerVisible +
                WIDTHS.buttons +
                padding * 6
        ) {
            visible.upper = !!upperVisible;
            visible.lower = !!lowerVisible;
            visible.color = !!lowerVisible;
            visible.fill = !!fillVisible;
            visible.text = !!lowerVisible;
        } else if (
            windowWidth >=
            WIDTHS.lineId +
                WIDTHS.upperValueOrId * upperVisible +
                WIDTHS.lowerValueOrId * lowerVisible +
                WIDTHS.color * lowerVisible +
                WIDTHS.fill * fillVisible +
                WIDTHS.buttons +
                padding * 5
        ) {
            visible.upper = !!upperVisible;
            visible.lower = !!lowerVisible;
            visible.color = !!lowerVisible;
            visible.fill = !!fillVisible;
        } else if (
            windowWidth >=
            WIDTHS.lineId +
                WIDTHS.upperValueOrId * upperVisible +
                WIDTHS.lowerValueOrId * lowerVisible +
                WIDTHS.color * lowerVisible +
                WIDTHS.buttons +
                padding * 4
        ) {
            visible.upper = !!upperVisible;
            visible.lower = !!lowerVisible;
            visible.color = !!lowerVisible;
        } else if (
            windowWidth >=
            WIDTHS.lineId +
                WIDTHS.upperValueOrId * upperVisible +
                WIDTHS.lowerValueOrId * lowerVisible +
                WIDTHS.buttons +
                padding * 3
        ) {
            visible.upper = !!upperVisible;
            visible.lower = !!lowerVisible;
        } else {
            visible.upper = !!upperVisible;
        }

        return (
            <div style={styles.lineClosedContainer}>
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
                        onClick={() => this.props.markOpenToggle(this.props.index)}
                    >
                        <IconFolderClosed />
                    </IconButton>
                )}
                <IOSelect
                    disabled={!!this.props.onPaste}
                    noTranslate
                    value={this.props.mark.lineId === undefined ? '' : this.props.mark.lineId.toString()}
                    updateValue={(value: string): void => {
                        const mark: ChartMarkConfig = JSON.parse(JSON.stringify(this.props.mark));
                        mark.lineId = value ? parseInt(value, 10) : undefined;
                        this.props.updateMark(this.props.index, mark);
                    }}
                    label="Line ID"
                    options={lines}
                    colors={colors}
                    styles={{ fieldContainer: styles.shortLineIdField }}
                    minWidth={WIDTHS.lineId}
                />
                {visible.upper ? (
                    <IOObjectField
                        theme={this.props.theme}
                        disabled={!!this.props.onPaste}
                        value={
                            this.props.mark.upperValueOrId === undefined
                                ? ''
                                : this.props.mark.upperValueOrId.toString()
                        }
                        updateValue={(value: string): void => {
                            const mark: ChartMarkConfig = JSON.parse(JSON.stringify(this.props.mark));
                            mark.upperValueOrId = value;
                            this.props.updateMark(this.props.index, mark);
                        }}
                        name="upperValueOrId"
                        label="Upper value or ID"
                        socket={this.props.socket}
                        styles={{ fieldContainer: styles.shortUpperValueOrIdField }}
                        minWidth={WIDTHS.upperValueOrId}
                    />
                ) : null}
                {visible.lower ? (
                    <IOObjectField
                        theme={this.props.theme}
                        disabled={!!this.props.onPaste}
                        value={
                            this.props.mark.lowerValueOrId === undefined
                                ? ''
                                : this.props.mark.lowerValueOrId.toString()
                        }
                        updateValue={(value: string): void => {
                            const mark: ChartMarkConfig = JSON.parse(JSON.stringify(this.props.mark));
                            mark.lowerValueOrId = value;
                            this.props.updateMark(this.props.index, mark);
                        }}
                        name="lowerValueOrId"
                        label="Lower value or ID"
                        socket={this.props.socket}
                        styles={{ fieldContainer: styles.shortLowerValueOrIdField }}
                        minWidth={WIDTHS.lowerValueOrId}
                    />
                ) : null}
                {visible.color ? this.renderColorField(WIDTHS.color, styles.shortColorField) : null}
                {visible.fill ? (
                    <IOSlider
                        disabled={!!this.props.onPaste}
                        value={this.props.mark.fill}
                        updateValue={(value: number): void => {
                            const mark: ChartMarkConfig = JSON.parse(JSON.stringify(this.props.mark));
                            mark.fill = value;
                            this.props.updateMark(this.props.index, mark);
                        }}
                        styles={{ fieldContainer: styles.shortFillField, sliderRoot: styles.sliderRoot }}
                        label="Fill (from 0 to 1)"
                        min={0}
                        max={1}
                        step={0.1}
                    />
                ) : null}
                {visible.text ? (
                    <IOTextField
                        disabled={!!this.props.onPaste}
                        value={this.props.mark.text}
                        updateValue={(value: string): void => {
                            const mark: ChartMarkConfig = JSON.parse(JSON.stringify(this.props.mark));
                            mark.text = value;
                            this.props.updateMark(this.props.index, mark);
                        }}
                        label="Text"
                        styles={{ fieldContainer: styles.shortTextField }}
                        minWidth={WIDTHS.fill}
                    />
                ) : null}
                <div style={{ flexGrow: 1 }} />
                <IconButton
                    aria-label="Delete"
                    title={I18n.t('Delete')}
                    onClick={() => this.props.deleteMark(this.props.index)}
                >
                    <IconDelete />
                </IconButton>
                <div style={{ width: 30 }} />
            </div>
        );
    }

    renderOpenedCard(lines: Record<number, string>, colors: Record<number, string>): React.JSX.Element {
        return (
            <>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <IconButton
                        title={I18n.t('Close')}
                        onClick={() => this.props.markOpenToggle(this.props.index)}
                    >
                        <IconFolderOpened />
                    </IconButton>
                    {I18n.t('Mark')} {this.props.index + 1}
                    {this.props.mark.text ? ` - ${this.props.mark.text}` : ''}
                    <div style={{ flexGrow: 1 }} />
                    <IconButton
                        style={styles.copyButtonFull}
                        aria-label="Copy"
                        title={I18n.t('Copy')}
                        onClick={() => this.props.onCopy(this.props.mark)}
                    >
                        <IconCopy />
                    </IconButton>
                    <IconButton
                        style={styles.deleteButtonFull}
                        aria-label="Delete"
                        title={I18n.t('Delete')}
                        onClick={() => this.props.deleteMark(this.props.index)}
                    >
                        <IconDelete />
                    </IconButton>
                    <div style={{ width: 30 }} />
                </div>
                <Box
                    component="div"
                    sx={styles.shortFields}
                >
                    <p style={styles.title}>{I18n.t('Limits')}</p>
                    <IOSelect
                        value={
                            this.props.mark.lineId === undefined || this.props.mark.lineId === null
                                ? ''
                                : this.props.mark.lineId.toString()
                        }
                        updateValue={(value: string): void => {
                            const mark: ChartMarkConfig = JSON.parse(JSON.stringify(this.props.mark));
                            mark.lineId = value ? parseInt(value, 10) : undefined;
                            this.props.updateMark(this.props.index, mark);
                        }}
                        noTranslate
                        label="Line ID"
                        options={lines}
                        colors={colors}
                    />

                    {this.props.mark.lineId !== null && this.props.mark.lineId !== undefined ? (
                        <IOObjectField
                            theme={this.props.theme}
                            value={
                                this.props.mark.upperValueOrId === undefined
                                    ? ''
                                    : this.props.mark.upperValueOrId.toString()
                            }
                            updateValue={(value: string): void => {
                                const mark: ChartMarkConfig = JSON.parse(JSON.stringify(this.props.mark));
                                mark.upperValueOrId = value;
                                this.props.updateMark(this.props.index, mark);
                            }}
                            name="upperValueOrId"
                            label="Upper value or ID"
                            socket={this.props.socket}
                        />
                    ) : null}

                    {this.props.mark.upperValueOrId !== null &&
                    this.props.mark.upperValueOrId !== undefined &&
                    this.props.mark.upperValueOrId !== '' ? (
                        <IOObjectField
                            theme={this.props.theme}
                            value={
                                this.props.mark.lowerValueOrId === undefined
                                    ? ''
                                    : this.props.mark.lowerValueOrId.toString()
                            }
                            updateValue={(value: string): void => {
                                const mark: ChartMarkConfig = JSON.parse(JSON.stringify(this.props.mark));
                                mark.lowerValueOrId = value;
                                this.props.updateMark(this.props.index, mark);
                            }}
                            name="lowerValueOrId"
                            label="Lower value or ID"
                            socket={this.props.socket}
                        />
                    ) : null}
                </Box>

                {(this.props.mark.upperValueOrId !== null &&
                    this.props.mark.upperValueOrId !== undefined &&
                    this.props.mark.upperValueOrId !== '') ||
                (this.props.mark.lowerValueOrId !== null &&
                    this.props.mark.lowerValueOrId !== undefined &&
                    this.props.mark.lowerValueOrId !== '') ? (
                    <Box
                        component="div"
                        sx={styles.shortFields}
                    >
                        <p style={styles.title}>{I18n.t('Style')}</p>
                        {this.renderColorField()}

                        <IONumberField
                            value={this.props.mark.ol}
                            updateValue={(value: number): void => {
                                const mark: ChartMarkConfig = JSON.parse(JSON.stringify(this.props.mark));
                                mark.ol = value;
                                this.props.updateMark(this.props.index, mark);
                            }}
                            label="ØL Line thickness"
                        />

                        <IONumberField
                            value={this.props.mark.os}
                            updateValue={(value: number): void => {
                                const mark: ChartMarkConfig = JSON.parse(JSON.stringify(this.props.mark));
                                mark.os = value;
                                this.props.updateMark(this.props.index, mark);
                            }}
                            label="ØS Shadow size"
                        />

                        <IOSelect
                            value={this.props.mark.lineStyle}
                            updateValue={(value: string): void => {
                                const mark: ChartMarkConfig = JSON.parse(JSON.stringify(this.props.mark));
                                mark.lineStyle = value as 'solid' | 'dashed' | 'dotted';
                                this.props.updateMark(this.props.index, mark);
                            }}
                            label="Line style"
                            options={{
                                solid: 'solid',
                                dashed: 'dashed',
                                dotted: 'dotted',
                            }}
                        />

                        {this.props.mark.upperValueOrId !== null &&
                        this.props.mark.upperValueOrId !== undefined &&
                        this.props.mark.upperValueOrId !== '' &&
                        this.props.mark.lowerValueOrId !== null &&
                        this.props.mark.lowerValueOrId !== undefined &&
                        this.props.mark.lowerValueOrId !== '' ? (
                            <IOSlider
                                value={this.props.mark.fill}
                                updateValue={(value: number): void => {
                                    const mark: ChartMarkConfig = JSON.parse(JSON.stringify(this.props.mark));
                                    mark.fill = value;
                                    this.props.updateMark(this.props.index, mark);
                                }}
                                label="Fill (from 0 to 1)"
                                min={0}
                                max={1}
                                step={0.1}
                            />
                        ) : null}
                    </Box>
                ) : null}

                {(this.props.mark.upperValueOrId !== null &&
                    this.props.mark.upperValueOrId !== undefined &&
                    this.props.mark.upperValueOrId !== '') ||
                (this.props.mark.lowerValueOrId !== null &&
                    this.props.mark.lowerValueOrId !== undefined &&
                    this.props.mark.lowerValueOrId !== '') ? (
                    <Box
                        component="div"
                        sx={Utils.getStyle(this.props.theme, styles.shortFields, styles.shortFieldsLast)}
                    >
                        <p style={styles.title}>{I18n.t('Label')}</p>
                        <IOTextField
                            value={this.props.mark.text}
                            updateValue={(value: string): void => {
                                const mark: ChartMarkConfig = JSON.parse(JSON.stringify(this.props.mark));
                                mark.text = value;
                                this.props.updateMark(this.props.index, mark);
                            }}
                            label="Text"
                        />
                        {this.props.mark.text ? (
                            <IOSelect
                                value={this.props.mark.textPosition}
                                updateValue={(value: string): void => {
                                    const mark: ChartMarkConfig = JSON.parse(JSON.stringify(this.props.mark));
                                    mark.textPosition = value as
                                        | 'r'
                                        | 'l'
                                        | 'insideStart'
                                        | 'insideStartTop'
                                        | 'insideStartBottom'
                                        | 'insideMiddle'
                                        | 'insideMiddleTop'
                                        | 'insideMiddleBottom'
                                        | 'insideEnd'
                                        | 'insideEndTop'
                                        | 'insideEndBottom';
                                    this.props.updateMark(this.props.index, mark);
                                }}
                                label="Text position"
                                options={{
                                    l: 'Left',
                                    r: 'Right',
                                    insideStart: 'Inside start',
                                    insideStartTop: 'Inside start top',
                                    insideStartBottom: 'Inside start bottom',
                                    insideMiddle: 'Inside middle',
                                    insideMiddleTop: 'Inside middle top',
                                    insideMiddleBottom: 'Inside middle bottom',
                                    insideEnd: 'Inside end',
                                    insideEndTop: 'Inside end top',
                                    insideEndBottom: 'Inside end bottom',
                                }}
                            />
                        ) : null}
                        {this.props.mark.text ? (
                            <IONumberField
                                value={this.props.mark.textOffset}
                                updateValue={(value: number): void => {
                                    const mark: ChartMarkConfig = JSON.parse(JSON.stringify(this.props.mark));
                                    mark.textOffset = value;
                                    this.props.updateMark(this.props.index, mark);
                                }}
                                label="Text X offset"
                            />
                        ) : null}
                        {this.props.mark.text ? (
                            <IONumberField
                                value={this.props.mark.textSize}
                                updateValue={(value: number): void => {
                                    const mark: ChartMarkConfig = JSON.parse(JSON.stringify(this.props.mark));
                                    mark.textSize = value;
                                    this.props.updateMark(this.props.index, mark);
                                }}
                                label="Text size"
                            />
                        ) : null}
                        {this.props.mark.text ? this.renderTextColorField() : null}
                    </Box>
                ) : null}
            </>
        );
    }

    render(): React.JSX.Element {
        const lines: Record<number, string> = {};
        const colors: Record<number, string> = {};
        this.props.presetData?.l.forEach((line, index) => {
            lines[index] = `${index} - ${line.id || I18n.t('No ID yet')}`;
            colors[index] = line.color;
        });
        return (
            <Card sx={Utils.getStyle(this.props.theme, styles.card, this.props.onPaste && styles.cardPaste)}>
                <CardContent sx={styles.cardContent}>
                    {this.props.opened && !this.props.onPaste
                        ? this.renderOpenedCard(lines, colors)
                        : this.renderClosedLine(lines, colors)}
                </CardContent>
            </Card>
        );
    }
}

export default Mark;
