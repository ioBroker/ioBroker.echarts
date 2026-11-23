'use strict';

// The answer of send with the fields of the shared catalog (rule 7: contentType, file), next to the data URL
const assert = require('node:assert/strict');
const { pictureAnswer } = require('../build/lib/picture');

describe('send answers a picture in the form of the shared catalog', () => {
    it('adds contentType and file to the data URL', () => {
        assert.deepEqual(pictureAnswer('data:image/png;base64,iVBORw0KGgo=', 'echarts.0'), {
            data: 'data:image/png;base64,iVBORw0KGgo=',
            contentType: 'image/png',
        });
        assert.deepEqual(pictureAnswer('data:image/svg+xml;base64,PHN2Zz4=', 'echarts.1', '/agent/chart.svg'), {
            data: 'data:image/svg+xml;base64,PHN2Zz4=',
            contentType: 'image/svg+xml',
            file: 'echarts.1/agent/chart.svg',
        });
        assert.equal(pictureAnswer('data:application/pdf;base64,JVBE', 'echarts.0').contentType, 'application/pdf');
    });

    it('answers send with them, also for a picture kept by cache', async () => {
        const corePath = require.resolve('@iobroker/adapter-core');
        const saved = require.cache[corePath];
        class Adapter {
            constructor() {
                this.namespace = 'echarts.0';
                this.log = { debug() {}, info() {}, warn() {}, error() {} };
            }
            on() {}
        }
        require.cache[corePath] = { id: corePath, filename: corePath, loaded: true, exports: { Adapter } };
        let adapter;
        try {
            adapter = require('../build/main')({});
        } finally {
            if (saved) {
                require.cache[corePath] = saved;
            } else {
                delete require.cache[corePath];
            }
        }
        const rendered = [];
        adapter.renderImage = async options => {
            rendered.push(options);
            return 'data:image/png;base64,iVBORw0KGgo=';
        };
        const send = message =>
            new Promise(resolve => {
                adapter.__lastMessageTime = 0;
                adapter.sendTo = (to, command, answer) => resolve(answer);
                adapter.processMessage({ command: 'send', message, from: 'system.adapter.assistant.0', callback: {} });
            });

        assert.deepEqual(await send({ preset: 'echarts.0.Temp', renderer: 'png', fileName: 'agent/chart.png' }), {
            data: 'data:image/png;base64,iVBORw0KGgo=',
            contentType: 'image/png',
            file: 'echarts.0/agent/chart.png',
        });
        await send({ preset: 'echarts.0.Temp', renderer: 'png', cache: 60 });
        const cached = await send({ preset: 'echarts.0.Temp', renderer: 'png', cache: 60, fileName: 'other.png' });
        assert.equal(rendered.length, 2, 'the third send gets the kept picture');
        assert.equal(cached.contentType, 'image/png');
        assert.equal(cached.data, 'data:image/png;base64,iVBORw0KGgo=');
        assert.equal(cached.file, undefined, 'the kept picture was not stored as other.png');
    });
});
