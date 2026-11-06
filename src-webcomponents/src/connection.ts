import type { WebComponentSocket } from '@iobroker/web-components';

import type { Connection } from '../../src/types';

/**
 * The connection the chart model expects (`Connection` of `src/types.d.ts`, the same the server renders with), made
 * of the methods every host hands a web component.
 *
 * Two of them are not in `WebComponentSocket`, and both are thin:
 * - `getSystemConfig` is the object `system.config`,
 * - `getHistoryEx` is `getHistory` plus the session of the request. The server only echoes the session the model
 *   sent with the options, and the model compares it with its newest one to drop answers that come too late. The
 *   session of the options is the same number, so the model drops the same answers.
 *
 * @param socket the connection of the host
 */
export function toChartConnection(socket: WebComponentSocket): Connection {
    return {
        getState: id => socket.getState(id),
        getObject: id => socket.getObject(id),
        getSystemConfig: async () => (await socket.getObject('system.config')) as ioBroker.SystemConfigObject,
        getHistoryEx: async (id, options) => {
            const sessionId = options.sessionId ?? 0;
            const values = await socket.getHistory(id, options);
            return { values, sessionId, step: options.step || 0 };
        },
        subscribeState: (id, cb) => socket.subscribeState(id, cb),
        unsubscribeState: (id, cb) => socket.unsubscribeState(id, cb),
        subscribeObject: (id, cb) => socket.subscribeObject(id, cb),
        unsubscribeObject: (id, cb) => socket.unsubscribeObject(id, cb),
    };
}
