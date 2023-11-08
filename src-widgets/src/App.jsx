import React from 'react';
import { withStyles } from '@mui/styles';

import WidgetDemoApp from '@iobroker/vis-2-widgets-react-dev/widgetDemoApp';
import { i18n as I18n } from '@iobroker/adapter-react-v5';

import translations from './translations';

import Echarts from './Echarts';
import './App.scss';

const styles = theme => ({
    app: {
        backgroundColor: theme?.palette?.background.default,
        color: theme?.palette?.text.primary,
        height: '100%',
        width: '100%',
        overflow: 'auto',
        display: 'flex',
    },
});

class App extends WidgetDemoApp {
    constructor(props) {
        super(props);

        // init translations
        I18n.extendTranslations(translations);

        this.socket.registerConnectionHandler(this.onConnectionChanged);
    }

    renderWidget() {
        return <div className={this.props.classes.app}>
            <Echarts
                context={{ socket: this.socket }}
                themeType={this.state.themeType}
                style={{
                    width: 400,
                    height: 300,
                }}
                data={{
                    instance: '0',
                    profile: 'af1b84fa-ee94-4cf8-959b-8896efd5c176',
                    // profile: '58f45953-9821-4746-8046-eaa5d69eaccd',
                }}
            />
        </div>;
    }
}

export default withStyles(styles)(App);
