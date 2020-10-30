/**
 *
 *      ioBroker echarts Adapter
 *
 *      (c) 2020 bluefox <dogafox@gmail.com>
 *
 *      MIT License
 *
 */
'use strict';

const utils = require('@iobroker/adapter-core'); // Get common adapter utils
const adapterName = require('./package.json').name.split('.').pop();
const fs = require('fs');
let echarts;
let Canvas;
let JSDOM;
let adapter;

function startAdapter(options) {
    options = options || {};
    Object.assign(options, {
        name: adapterName, // adapter name
    });

    adapter = new utils.Adapter(options);

    adapter.on('message', obj =>
        obj && obj.command === 'send' && processMessage(adapter, obj));

    adapter.on('ready', () => {
        main(adapter);
    });

    adapter.__emailTransport  = null;
    adapter.__stopTimer       = null;
    adapter.__lastMessageTime = 0;
    adapter.__lastMessageText = '';

    return adapter;
}

function processMessage(adapter, obj) {
    if (!obj || !obj.message) {
        return;
    }

    // filter out double messages
    const json = JSON.stringify(obj.message);
    if (adapter.__lastMessageTime && adapter.__lastMessageText === json && Date.now() - adapter.__lastMessageTime < 300) {
        return adapter.log.debug('Filter out double message [first was for ' + (Date.now() - adapter.__lastMessageTime) + 'ms]: ' + json);
    }

    adapter.__lastMessageTime = Date.now();
    adapter.__lastMessageText = json;

    if (!obj.message || !obj.message.preset) {
        adapter.log.error('Please define settings: {"preset": "echarts.0.XXX", width: 500, height: 200, renderer: "png/svg"}');
        obj.callback && adapter.sendTo(obj.from, 'send', {error: 'Please define settings: {"preset": "echarts.0.XXX", width: 500, height: 200, renderer: "svg/png"}'}, obj.callback);
    } else {
        try {
            echarts = echarts || require('echarts');
            Canvas  = Canvas  || require('canvas');
            JSDOM   = JSDOM   || require('jsdom').JSDOM;
        } catch (e) {
            adapter.log.error('Cannot find required modules: ' + e);
            return obj.callback && adapter.sendTo(obj.from, 'send', {error: 'Cannot find required modules: looks like it is not possible to generate charts on your Hardware/OS'}, obj.callback);
        }

        obj.message.width = parseFloat(obj.message.width) || 500;
        obj.message.height = parseFloat(obj.message.height) || 200;
        obj.message.renderer = obj.message.renderer || 'png';

        const {window} = new JSDOM();
        global.window = window;
        global.navigator = window.navigator;
        global.document = window.document;

        const root = document.createElement('div');
        root.style.cssText = `width: ${obj.message.width}px; height: ${obj.message.height}px;`;
        const chart = echarts.init(root, null, {
            renderer: 'svg'
        });
        chart.setOption({
            title: {
                text: 'ECharts 入门示例'
            },
            tooltip: {},
            legend: {
                data: ['销量']
            },
            xAxis: {
                data: ['衬衫', '羊毛衫', '雪纺衫', '裤子', '高跟鞋', '袜子']
            },
            yAxis: {},
            series: [{
                animation: false,
                name: '销量',
                type: 'bar',
                data: [5, 20, 36, 10, 10, 20]
            }]
        });

        const svg = root.querySelector('svg').outerHTML;
        const data = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
        obj.callback && adapter.sendTo(obj.from, 'send', {data}, obj.callback);

        chart.dispose();
    }
}

function main(adapter) {

}

// If started as allInOne mode => return function to create instance
if (module && module.parent) {
    module.exports = startAdapter;
} else {
    // or start the instance directly
    startAdapter();
}