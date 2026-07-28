"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSocket = getSocket;
let systemConfig;
function getSocket(adapter) {
    return {
        getState: function (id) {
            return adapter.getForeignStateAsync(id);
        },
        getHistoryEx: function (id, options) {
            return new Promise((resolve, reject) => adapter.getHistory(id, options, (err, values, step, sessionId) => err ? reject(err) : resolve({ values, sessionId, step })));
        },
        getObject: function (id) {
            return adapter.getForeignObjectAsync(id);
        },
        getSystemConfig: function () {
            systemConfig =
                systemConfig instanceof Promise ? systemConfig : adapter.getForeignObjectAsync('system.config');
            return systemConfig;
        },
        unsubscribeState: function (_id, _cb) { },
        subscribeState: function (_id, _cb) {
            return Promise.resolve();
        },
        unsubscribeObject: function (_id, _cb) {
            return Promise.resolve();
        },
        subscribeObject: function (_id, _cb) {
            return Promise.resolve();
        },
    };
}
//# sourceMappingURL=socketSimulator.js.map