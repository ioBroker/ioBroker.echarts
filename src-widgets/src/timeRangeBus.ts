/**
 * The channel between the "E-Charts time range" widget and the chart widgets it drives.
 *
 * Both widgets live in the same vis view, so the range does not have to travel through an ioBroker
 * state: the selector simply hands it to the chart widgets that were picked in its settings. The
 * registry hangs on `window` and not in the module scope, because the two widgets are two exposures
 * of the module federation remote and may end up in two chunks of their own.
 */

export interface EchartsTimeRange {
    timeType?: 'relative' | 'static';
    /** Relative range in minutes, or `1m`, `2m`, `3m`, `6m`, `1y`, `2y` */
    range?: string;
    relativeEnd?: string;
    /** Static range: `DD.MM.YYYY` as the chart expects it */
    start?: string;
    /** Static range: `HH:mm` */
    start_time?: string;
    end?: string;
    end_time?: string;
}

type Listener = (range: EchartsTimeRange) => void;

interface TimeRangeStore {
    /** The last range per chart widget, so a chart that is mounted later is not left behind */
    last: Record<string, EchartsTimeRange>;
    listeners: Record<string, Listener[]>;
}

function getStore(): TimeRangeStore {
    const holder = window as unknown as { __echartsTimeRange?: TimeRangeStore };
    holder.__echartsTimeRange ||= { last: {}, listeners: {} };
    return holder.__echartsTimeRange;
}

/** Hand the range to the given chart widgets and remember it for the ones that are not mounted yet. */
export function publishTimeRange(targets: string[], range: EchartsTimeRange): void {
    const store = getStore();

    targets.forEach(wid => {
        if (!wid) {
            return;
        }
        store.last[wid] = range;
        store.listeners[wid]?.forEach(listener => {
            try {
                listener(range);
            } catch (e) {
                console.error(`Cannot apply time range on ${wid}: ${e as Error}`);
            }
        });
    });
}

/** The range that was published for this widget before it was mounted, if there was one. */
export function getLastTimeRange(wid: string): EchartsTimeRange | undefined {
    return getStore().last[wid];
}

/** Listen for ranges addressed to this widget. Returns the unsubscribe function. */
export function subscribeTimeRange(wid: string, listener: Listener): () => void {
    const store = getStore();
    (store.listeners[wid] ||= []).push(listener);

    return (): void => {
        const listeners = store.listeners[wid];
        if (!listeners) {
            return;
        }
        const pos = listeners.indexOf(listener);
        if (pos !== -1) {
            listeners.splice(pos, 1);
        }
        if (!listeners.length) {
            delete store.listeners[wid];
        }
    };
}

/**
 * The range as the chart reads it out of the URL hash. Empty parts are left out, so they do not
 * override what the preset brings.
 */
export function timeRangeToHash(range: EchartsTimeRange | null | undefined): string {
    if (!range) {
        return '';
    }

    return Object.keys(range)
        .filter(name => {
            const value = range[name as keyof EchartsTimeRange];
            return value !== undefined && value !== null && value !== '';
        })
        .map(name => `${name}=${encodeURIComponent(range[name as keyof EchartsTimeRange]!)}`)
        .join('&');
}
