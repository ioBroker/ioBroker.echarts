const makeFederation = require('@iobroker/vis-2-widgets-react-dev/modulefederation.config');

module.exports = makeFederation(
    'echarts',
    {
        './Echarts': './src/Echarts',
        './translations': './src/translations',
    }
);