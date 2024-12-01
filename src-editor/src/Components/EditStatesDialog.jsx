import React from 'react';
import PropTypes from 'prop-types';

import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Switch,
    IconButton,
    TextField,
    FormControlLabel,
} from '@mui/material';

import { I18n } from '@iobroker/adapter-react-v5';

import {
    MdAdd as IconAdd,
    MdCheck as IconCheck,
    MdClose as IconClose,
    MdDelete as IconDelete,
} from 'react-icons/md';

const styles = {
    stateValueEdit: {
        marginBottom: 10,
    },
};

class EditStatesDialog extends React.Component {
    constructor(props) {
        super(props);

        this.originalStates = JSON.parse(props.originalStates);
        this.statesBeforeEdit = JSON.stringify(props.withStates);

        this.state = {
            withStates: JSON.parse(JSON.stringify(props.withStates)),
            disabledStates: this.props.withStates ? JSON.stringify(props.withStates) : props.originalStates,
            showAddStateDialog: false,
            newValue: '',
            newTextValue: '',
        };

        if (props.isBoolean) {
            if (this.state.withStates.true) {
                this.state.withStates['1'] = this.state.withStates.true;
                delete this.state.withStates.true;
            }
            if (this.state.withStates.false) {
                this.state.withStates['0'] = this.state.withStates.false;
                delete this.state.withStates.false;
            }

            this.state.withStates['1'] = this.state.withStates['1'] || 'true';
            this.state.withStates['0'] = this.state.withStates['0'] || 'false';
        }
    }

    renderAddStateDialog() {
        if (!this.state.showAddStateDialog) {
            return null;
        }

        return <Dialog
            open={!0}
            onClose={() => this.setState({ showAddStateDialog: false })}
        >
            <DialogTitle>{I18n.t('Add new state name')}</DialogTitle>
            <DialogContent>
                <TextField
                    style={styles.stateValueEdit}
                    variant="standard"
                    label={I18n.t('State value')}
                    value={this.state.newValue}
                    onChange={e => this.setState({ newValue: e.target.value })}
                />
                <br />
                <TextField
                    style={styles.stateValueEdit}
                    variant="standard"
                    label={I18n.t('State value text')}
                    value={this.state.newTextValue}
                    onChange={e => this.setState({ newTextValue: e.target.value })}
                    onKeyUp={e => {
                        if (e.keyCode === 13 && this.state.newValue && this.state.withStates[this.state.newValue] === undefined) {
                            const withStates = JSON.parse(JSON.stringify(this.state.withStates));
                            withStates[this.state.newValue] = this.state.newTextValue;
                            this.setState({ showAddStateDialog: null, withStates });
                        }
                    }}
                />
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    color="primary"
                    autoFocus
                    disabled={!this.state.newValue || this.state.withStates[this.state.newValue] !== undefined}
                    onClick={() => {
                        const withStates = JSON.parse(JSON.stringify(this.state.withStates));
                        withStates[this.state.newValue] = this.state.newTextValue;
                        this.setState({ showAddStateDialog: null, withStates });
                    }}
                    startIcon={<IconAdd />}
                >
                    {I18n.t('Add')}
                </Button>
                <Button variant="contained" color="grey" onClick={() => this.setState({ showAddStateDialog: false })} startIcon={<IconClose />}>{I18n.t('Cancel')}</Button>
            </DialogActions>
        </Dialog>;
    }

    render() {
        return <>
            {this.renderAddStateDialog()}
            <Dialog
                open={!0}
                onClose={() => this.props.onClose()}
            >
                <DialogTitle>{I18n.t('Edit state names')}</DialogTitle>
                <DialogContent>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={this.state.withStates !== false}
                                onChange={() => {
                                    if (this.state.withStates === false) {
                                        this.setState({ withStates: JSON.parse(this.state.disabledStates) });
                                    } else {
                                        this.setState({ withStates: false, disabledStates: JSON.stringify(this.state.withStates) });
                                    }
                                }}
                            />
                        }
                        label={I18n.t('Use state names')}
                    />
                    {this.state.withStates !== false ? <>
                        <br />
                        {!this.props.isBoolean ? <IconButton
                            onClick={() => {
                                const keys = Object.keys(this.state.withStates).sort();
                                let newValue = '';
                                // eslint-disable-next-line no-restricted-properties
                                if (window.isFinite(keys[keys.length - 1])) {
                                    newValue = parseInt(keys[keys.length - 1], 10) + 1;
                                }

                                this.setState({ showAddStateDialog: true, newValue, newTextValue: '' });
                            }}
                            title={I18n.t('Add new value')}
                        >
                            <IconAdd />
                        </IconButton> : null}
                        <br />
                        {Object.keys(this.state.withStates)
                            .map(val =>
                                <div key={val}>
                                    <TextField
                                        style={styles.stateValueEdit}
                                        variant="standard"
                                        label={this.props.isBoolean ? (val === '1' ? I18n.t('TRUE') : (val === '0' ? I18n.t('FALSE') : val)) : val.toString()}
                                        value={this.state.withStates[val]}
                                        onChange={e => this.setState({ withStates: { ...this.state.withStates, [val]: e.target.value } })}
                                        InputProps={{
                                            endAdornment: this.state.withStates[val] ?
                                                <IconButton
                                                    // KeyboardButtonProps={{ tabIndex: '-1' }}
                                                    size="small"
                                                    onClick={() => this.setState({ withStates: { ...this.state.withStates, [val]: '' } })}
                                                >
                                                    <IconClose />
                                                </IconButton>
                                                : undefined,
                                        }}
                                    />
                                    {!this.props.isBoolean && this.originalStates[val] === undefined ? <IconButton
                                        onClick={() => {
                                            const withStates = { ...this.state.withStates };
                                            delete withStates[val];
                                            this.setState({ withStates });
                                        }}
                                        title={I18n.t('Delete text value')}
                                    >
                                        <IconDelete />
                                    </IconButton> : null}
                                </div>)}
                    </> : null}
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        color="primary"
                        autoFocus
                        disabled={this.statesBeforeEdit === JSON.stringify(this.state.withStates)}
                        onClick={() => this.props.onClose(this.state.withStates)}
                        startIcon={<IconCheck />}
                    >
                        {I18n.t('Apply')}
                    </Button>
                    <Button variant="contained" color="grey" onClick={() => this.props.onClose()} startIcon={<IconClose />}>{I18n.t('Close')}</Button>
                </DialogActions>
            </Dialog>
        </>;
    }
}

EditStatesDialog.propTypes = {
    onClose: PropTypes.func,
    withStates: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
    originalStates: PropTypes.string,
    isBoolean: PropTypes.string,
};

export default EditStatesDialog;
