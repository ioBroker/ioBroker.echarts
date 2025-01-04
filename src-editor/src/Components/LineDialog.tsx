import React from 'react';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';

import { I18n } from '@iobroker/adapter-react-v5';

import {
    CgBorderStyleSolid as IconSolid,
    CgBorderStyleDashed as IconDashed,
    CgBorderStyleDotted as IconDotted,
} from 'react-icons/cg';

import { MdClose as IconClose } from 'react-icons/md';
import { IOSelect, IOSlider } from './Fields';
import type { ChartLineConfigMore } from '../../../src/types';

const styles: Record<string, React.CSSProperties> = {
    dialogSlider: {
        padding: '20px 0px',
    },
};

interface LineDialogProps {
    updateLine: (index: number, line: ChartLineConfigMore) => void;
    line: ChartLineConfigMore;
    open: boolean;
    index: number;
    onClose: () => void;
}

class LineDialog extends React.Component<LineDialogProps> {
    render(): React.JSX.Element {
        return (
            <Dialog
                open={this.props.open}
                onClose={this.props.onClose}
            >
                <DialogTitle>
                    {I18n.t('Line')} {this.props.index + 1}
                    {this.props.line.name ? ` - ${this.props.line.name}` : ''} {I18n.t('edit')}
                </DialogTitle>
                <DialogContent>
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
                        icons={{
                            solid: <IconSolid />,
                            dashed: <IconDashed />,
                            dotted: <IconDotted />,
                        }}
                    />
                    <div style={styles.dialogSlider}>
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
                    </div>
                    <div style={styles.dialogSlider}>
                        <IOSlider
                            value={this.props.line.thickness}
                            updateValue={(value: number): void => {
                                const line: ChartLineConfigMore = JSON.parse(JSON.stringify(this.props.line));
                                line.thickness = value;
                                this.props.updateLine(this.props.index, line);
                            }}
                            label="ØL - Line thickness"
                            min={this.props.line.fill > 0.01 ? 0 : 1}
                            max={10}
                            step={1}
                        />
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={this.props.onClose}
                        startIcon={<IconClose />}
                    >
                        {I18n.t('Close')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

export default LineDialog;
