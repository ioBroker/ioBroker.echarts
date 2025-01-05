import React from 'react';

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

import { MdAdd as IconAdd, MdCheck as IconCheck, MdClose as IconClose, MdDelete as IconDelete } from 'react-icons/md';

const styles: Record<string, React.CSSProperties> = {
    stateValueEdit: {
        marginBottom: 10,
    },
};

interface EditStatesDialogProps {
    onClose: (withStates?: Record<string, string> | false) => void;
    withStates: Record<string, string>;
    originalStates: string;
    isBoolean: boolean;
}

interface EditStatesDialogState {
    withStates: Record<string, string> | false;
    disabledStates: string;
    showAddStateDialog: boolean;
    newValue: string;
    newTextValue: string;
}

class EditStatesDialog extends React.Component<EditStatesDialogProps, EditStatesDialogState> {
    private readonly originalStates: Record<string, string>;

    private readonly statesBeforeEdit: string;

    constructor(props: EditStatesDialogProps) {
        super(props);

        this.originalStates = JSON.parse(props.originalStates);
        this.statesBeforeEdit = JSON.stringify(props.withStates);

        const withStates: Record<string, string> = props.withStates ? JSON.parse(JSON.stringify(props.withStates)) : {};

        if (props.isBoolean) {
            if (withStates.true) {
                withStates['1'] = withStates.true;
                delete withStates.true;
            }
            if (withStates.false) {
                withStates['0'] = withStates.false;
                delete withStates.false;
            }

            withStates['1'] = withStates['1'] || 'true';
            withStates['0'] = withStates['0'] || 'false';
        }

        this.state = {
            withStates,
            disabledStates: this.props.withStates ? JSON.stringify(props.withStates) : props.originalStates,
            showAddStateDialog: false,
            newValue: '',
            newTextValue: '',
        };
    }

    renderAddStateDialog(): React.JSX.Element | null {
        if (!this.state.showAddStateDialog) {
            return null;
        }

        return (
            <Dialog
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
                            if (
                                e.key === 'Enter' &&
                                this.state.newValue &&
                                (this.state.withStates as Record<string, string>)[this.state.newValue] === undefined
                            ) {
                                const withStates: Record<string, string> = JSON.parse(
                                    JSON.stringify(this.state.withStates),
                                );
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
                        disabled={
                            !this.state.newValue ||
                            (this.state.withStates as Record<string, string>)[this.state.newValue] !== undefined
                        }
                        onClick={() => {
                            const withStates: Record<string, string> = JSON.parse(
                                JSON.stringify(this.state.withStates),
                            );
                            withStates[this.state.newValue] = this.state.newTextValue;
                            this.setState({ showAddStateDialog: null, withStates });
                        }}
                        startIcon={<IconAdd />}
                    >
                        {I18n.t('Add')}
                    </Button>
                    <Button
                        variant="contained"
                        color="grey"
                        onClick={() => this.setState({ showAddStateDialog: false })}
                        startIcon={<IconClose />}
                    >
                        {I18n.t('Cancel')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    render(): React.JSX.Element {
        return (
            <>
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
                                            this.setState({
                                                withStates: false,
                                                disabledStates: JSON.stringify(this.state.withStates),
                                            });
                                        }
                                    }}
                                />
                            }
                            label={I18n.t('Use state names')}
                        />
                        {this.state.withStates !== false ? (
                            <>
                                <br />
                                {!this.props.isBoolean ? (
                                    <IconButton
                                        onClick={() => {
                                            const keys: string[] = Object.keys(this.state.withStates).sort();
                                            let newValue = '';
                                            if (window.isFinite(parseInt(keys[keys.length - 1], 10))) {
                                                newValue = (parseInt(keys[keys.length - 1], 10) + 1).toString();
                                            }

                                            this.setState({ showAddStateDialog: true, newValue, newTextValue: '' });
                                        }}
                                        title={I18n.t('Add new value')}
                                    >
                                        <IconAdd />
                                    </IconButton>
                                ) : null}
                                <br />
                                {Object.keys(this.state.withStates).map(val => (
                                    <div key={val}>
                                        <TextField
                                            style={styles.stateValueEdit}
                                            variant="standard"
                                            label={
                                                this.props.isBoolean
                                                    ? val === '1'
                                                        ? I18n.t('TRUE')
                                                        : val === '0'
                                                          ? I18n.t('FALSE')
                                                          : val
                                                    : val.toString()
                                            }
                                            value={(this.state.withStates as Record<string, string>)[val]}
                                            onChange={e =>
                                                this.setState({
                                                    withStates: { ...this.state.withStates, [val]: e.target.value },
                                                })
                                            }
                                            slotProps={{
                                                input: {
                                                    endAdornment: (this.state.withStates as Record<string, string>)[
                                                        val
                                                    ] ? (
                                                        <IconButton
                                                            // KeyboardButtonProps={{ tabIndex: '-1' }}
                                                            size="small"
                                                            onClick={() =>
                                                                this.setState({
                                                                    withStates: { ...this.state.withStates, [val]: '' },
                                                                })
                                                            }
                                                        >
                                                            <IconClose />
                                                        </IconButton>
                                                    ) : undefined,
                                                },
                                            }}
                                        />
                                        {!this.props.isBoolean && this.originalStates[val] === undefined ? (
                                            <IconButton
                                                onClick={() => {
                                                    const withStates = { ...this.state.withStates };
                                                    delete withStates[val];
                                                    this.setState({ withStates });
                                                }}
                                                title={I18n.t('Delete text value')}
                                            >
                                                <IconDelete />
                                            </IconButton>
                                        ) : null}
                                    </div>
                                ))}
                            </>
                        ) : null}
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
                        <Button
                            variant="contained"
                            color="grey"
                            onClick={() => this.props.onClose()}
                            startIcon={<IconClose />}
                        >
                            {I18n.t('Close')}
                        </Button>
                    </DialogActions>
                </Dialog>
            </>
        );
    }
}

export default EditStatesDialog;
