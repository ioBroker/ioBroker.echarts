import React from 'react';
import PropTypes from 'prop-types';
import {withStyles} from "@material-ui/core";

const styles = theme => ({
    darkBackground: {
        stroke: '#3a3a3a !important',
        fill: '#515151 !important',
    },
    iframe: {
        width: '100%',
        height: '100%',
        border: 0,
        color: theme.palette.primary.main// && console.log(JSON.stringify(theme))
    }
});

class ChartFrame extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        const defaultSrc = 'http://localhost:8082/flot/index.html?l%5B0%5D%5Bid%5D=system.adapter.admin.0.memHeapTotal&l%5B0%5D%5Boffset%5D=0&l%5B0%5D%5Baggregate%5D=minmax&l%5B0%5D%5Bcolor%5D=%23FF0000&l%5B0%5D%5Bthickness%5D=3&l%5B0%5D%5Bshadowsize%5D=3&l%5B1%5D%5Bid%5D=system.adapter.admin.0.memHeapUsed&l%5B1%5D%5Boffset%5D=0&l%5B1%5D%5Baggregate%5D=minmax&l%5B1%5D%5Bcolor%5D=%2300FF00&l%5B1%5D%5Bthickness%5D=3&l%5B1%5D%5Bshadowsize%5D=3&timeType=relative&relativeEnd=now&range=10&aggregateType=count&aggregateSpan=300&hoverDetail=false&useComma=false&zoom=true&noedit=false&animation=0';

        return (<iframe
            className={this.props.classes.iframe}
            src={this.props.src || defaultSrc}>

        </iframe>);
    }
}

ChartFrame.propTypes = {
    src: PropTypes.string,
};

export default withStyles(styles)(ChartFrame);