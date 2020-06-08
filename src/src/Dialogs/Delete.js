import React from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Dialog from '@material-ui/core/Dialog';
import {MdDelete as IconDelete} from 'react-icons/md';

import I18n from '@iobroker/adapter-react/i18n';

class DialogDelete extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            name: props.name,
            id: props.id,
        };
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.name !== this.props.name) {
            this.setState({name: nextProps.name});
        }
        if (nextProps.id !== this.props.id) {
            this.setState({id: nextProps.id});
        }
    }

    handleCancel = () => {
        this.props.onClose(null);
    };

    handleOk = () => {
        this.props.onDelete(this.state.id);
        this.props.onClose(this.props.value);
    };

    render() {
        return (
            <Dialog
                disableBackdropClick
                disableEscapeKeyDown
                maxWidth="md"
                fullWidth={true}
                open={true}
                aria-labelledby="confirmation-dialog-title"
            >
                <DialogTitle id="confirmation-dialog-title">{I18n.t('Are you sure?')}</DialogTitle>
                <DialogContent>
                    <IconDelete/>
                    <span style={{fontSize: 14, fontWeight: 'bold'}}>{I18n.t('Delete %s', this.state.name)}</span>
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.handleOk} color="primary">{I18n.t('Ok')}</Button>
                    <Button onClick={this.handleCancel} color="primary">{I18n.t('Cancel')}</Button>
                </DialogActions>
            </Dialog>
        );
    }
}

DialogDelete.propTypes = {
    onClose: PropTypes.func,
    onDelete: PropTypes.func,
    name: PropTypes.string,
    id: PropTypes.string,
};

export default DialogDelete;
