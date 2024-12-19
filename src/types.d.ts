export type EchartOptions = {
    preset: string; // the only mandatory attribute

    renderer?: 'svg' | 'png' | 'jpg' | 'pdf'; // svg | png | jpg | pdf, default: svg

    /** default 1024 */
    width?: number;
    /** default 300 */
    height?: number;
    /** Background color */
    background?: string;
    /** Theme type */
    theme?: 'light' | 'dark';
    /** @deprecated use theme instead */
    themeType?: 'light' | 'dark';

    /** Title of PDF document */
    title?: string;
    /** quality of JPG */
    quality?: number;
    /** Compression level of PNG */
    compressionLevel?: number;
    /** Filters of PNG (Bit combination https://github.com/Automattic/node-canvas/blob/master/types/index.d.ts#L10) */
    filters?: number;

    /** Path on disk to save the file. */
    fileOnDisk?: string;
    /** Path in ioBroker DB to save the files on 'echarts.0'. E.g. if your set "chart.svg", so you can access your picture via http(s)://ip:8082/echarts.0/chart.png */
    fileName?: string;

    /** Cache time for this preset in seconds, default: 0 - no cache */
    cache?: number;
    /** Ignore cache */
    forceRefresh?: boolean;
};

export interface Connection {
    getState: (id: string) => Promise<ioBroker.State | null | undefined>;
    getHistoryEx: (
        id: string,
        options: ioBroker.GetHistoryOptions,
    ) => Promise<{
        values: ioBroker.GetHistoryResult;
        sessionId: number | string;
        step: number;
    }>;

    getObject: (id: string) => Promise<ioBroker.Object | null | undefined>;

    getSystemConfig: () => Promise<ioBroker.SystemConfigObject>;

    unsubscribeState: (_id: string | string[], _cb?: ioBroker.StateChangeHandler) => void;
    subscribeState: (_id: string | string[], _cb: ioBroker.StateChangeHandler) => Promise<void>;

    unsubscribeObject: (
        _id: string | string[],
        _cb?: (
            id: string,
            obj: ioBroker.Object | null | undefined,
            oldObj?: {
                _id: string;
                type: string;
            },
        ) => void,
    ) => Promise<void>;

    subscribeObject: (
        _id: string | string[],
        _cb: (
            id: string,
            obj: ioBroker.Object | null | undefined,
            oldObj?: {
                _id: string;
                type: string;
            },
        ) => void,
    ) => Promise<void>;
}
