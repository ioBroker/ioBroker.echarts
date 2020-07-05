import React from 'react';
import ReactDOM from 'react-dom';
import { MuiThemeProvider} from '@material-ui/core/styles';
//import createTheme from '@iobroker/adapter-react/createTheme';

import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

import theme from '@iobroker/adapter-react/Theme';
import Utils from '@iobroker/adapter-react/Components/Utils';

let themeName = Utils.getThemeName();

function build() {
    if (typeof Map === 'undefined') {
        console.log('Something is wrong')
    }
    return ReactDOM.render(<MuiThemeProvider theme={ theme(themeName) }>
        <App onThemeChange={_theme => {
            theme = _theme;
            build();
        }}/>
    </MuiThemeProvider>, document.getElementById('root'));

}

build();
// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
