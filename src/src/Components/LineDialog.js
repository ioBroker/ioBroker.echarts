import React from 'react';
import PropTypes from 'prop-types';

import {
    Button, Dialog, DialogActions,
    DialogContent, DialogTitle,
} from '@mui/material';

import I18n from '@iobroker/adapter-react-v5/i18n';

import {
    CgBorderStyleSolid as IconSolid,
    CgBorderStyleDashed as IconDashed,
    CgBorderStyleDotted as IconDotted,
} from 'react-icons/cg';

import { MdClose as IconClose } from 'react-icons/md';
import { IOSelect, IOSlider } from './Fields';

const styles = {
    dialogSlider: {
        padding: '20px 0px',
    },
};

class LineDialog extends React.Component {
    render() {
        return <Dialog open={this.props.open} onClose={this.props.onClose}>
            <DialogTitle>
                {I18n.t('Line')}
                {' '}
                {this.props.index + 1}
                {this.props.line.name ? ` - ${this.props.line.name}` : ''}
                {' '}
                {I18n.t('edit')}
            </DialogTitle>
            <DialogContent>
                <IOSelect
                    formData={this.props.line}
                    updateValue={this.props.updateField}
                    name="lineStyle"
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
                    <IOSlider formData={this.props.line} updateValue={this.props.updateField} name="fill" label="Fill (from 0 to 1)" />
                </div>
                <div style={styles.dialogSlider}>
                    <IOSlider
                        formData={this.props.line}
                        updateValue={this.props.updateField}
                        name="thickness"
                        label="ØL - Line thickness"
                        min={this.props.line.fill > 0.01 ? 0 : 1}
                        max={10}
                        step={1}
                    />
                </div>
            </DialogContent>
            <DialogActions>
                <Button variant="contained" color="primary" onClick={this.props.onClose} startIcon={<IconClose />}>{I18n.t('Close')}</Button>
            </DialogActions>
        </Dialog>;
    }
}

LineDialog.propTypes = {
    updateField: PropTypes.func,
    line: PropTypes.object,
    open: PropTypes.bool,
    onClose: PropTypes.func,
};

export default LineDialog;
