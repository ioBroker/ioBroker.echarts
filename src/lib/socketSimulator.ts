import type { Connection } from '../types';

let systemConfig: Promise<ioBroker.SystemConfigObject> | undefined;

export function getSocket(adapter: ioBroker.Adapter): Connection {
    return {
        getState: function (id: string): Promise<ioBroker.State | null | undefined> {
            return adapter.getForeignStateAsync(id);
        },

        getHistoryEx: function (
            id: string,
            options: ioBroker.GetHistoryOptions,
        ): Promise<{
            values: ioBroker.GetHistoryResult;
            sessionId: number | string;
            step: number;
        }> {
            return new Promise((resolve, reject) =>
                adapter.getHistory(
                    id,
                    options,
                    (err: Error | null, values?: ioBroker.GetHistoryResult, step?: number, sessionId?: string): void =>
                        err ? reject(err) : resolve({ values, sessionId, step }),
                ),
            );
        },

        getObject: function (id: string): Promise<ioBroker.Object | null | undefined> {
            return adapter.getForeignObjectAsync(id);
        },

        getSystemConfig: function (): Promise<ioBroker.SystemConfigObject> {
            systemConfig =
                systemConfig instanceof Promise ? systemConfig : adapter.getForeignObjectAsync('system.config');
            return systemConfig;
        },

        unsubscribeState: function (_id: string | string[], _cb?: ioBroker.StateChangeHandler): void {},
        subscribeState: function (_id: string | string[], _cb: ioBroker.StateChangeHandler): Promise<void> {
            return Promise.resolve();
        },

        unsubscribeObject: function (
            _id: string | string[],
            _cb?: (
                id: string,
                obj: ioBroker.Object | null | undefined,
                oldObj?: {
                    _id: string;
                    type: string;
                },
            ) => void,
        ): Promise<void> {
            return Promise.resolve();
        },

        subscribeObject: function (
            _id: string | string[],
            _cb: (
                id: string,
                obj: ioBroker.Object | null | undefined,
                oldObj?: {
                    _id: string;
                    type: string;
                },
            ) => void,
        ): Promise<void> {
            return Promise.resolve();
        },
    };
}
