// Standalone dev harness for the echarts viewer widget. NOT part of the production bundle.
// Runs `npm run start` against a live ioBroker admin (localhost:8081) so the widget can be
// developed without launching the full Devices admin app.

import React, { useEffect, useMemo, useState } from 'react';
import { Connection } from '@iobroker/adapter-react-v5';
import type { StateChangeListener, ObjectChangeListener } from '@iobroker/dm-widgets';

// `IStateContext` was renamed to `StateContext` in newer dm-widgets — the installed v0.3.1
// only exports the latter as a class. We declare the shape locally to keep the dev harness
// independent of version skew. The fields we use match what the production host provides.
interface IStateContext {
    defaultHistory: string | null;
    instanceId: string;
    admin: boolean;
    language: ioBroker.Languages;
    longitude: number | null;
    latitude: number | null;
    isFloatComma: boolean;
    dateFormat: string;
    imagePrefix: string;
    getState(id: string, handler: StateChangeListener): void;
    removeState(id: string, handler: StateChangeListener): void;
    getObject<T>(id: string): Promise<T | undefined>;
    getObjectProperty(id: string, property: string, cb: ObjectChangeListener): void;
    removeObject(id: string, cb: ObjectChangeListener): Promise<void>;
    getSocket(): Connection;
    getImagePath(fileName: string | null | undefined): string | null;
    destroy(): void;
}
import EchartComponent, { type EchartsViewerSettings } from './EchartComponent';

const IOB_HOST = 'localhost';
const IOB_PORT = 8081;
const STORAGE_KEY = 'echartsDevHarness.presetId';

const overlayStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#191c1d',
    color: '#d8dde0',
    fontFamily: 'system-ui, sans-serif',
    fontSize: 18,
};

const toolbarStyle: React.CSSProperties = {
    padding: '10px 16px',
    borderBottom: '1px solid #2a2f33',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
};

const tabButtonStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 12px',
    borderRadius: 6,
    border: `1px solid ${active ? '#4a9eff' : '#3a3f43'}`,
    background: active ? '#1b3a5c' : '#0b0f14',
    color: active ? '#ffffff' : '#d8dde0',
    fontFamily: 'system-ui, sans-serif',
    fontSize: 14,
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
});

type SizeOption = '1x1' | '2x1' | '2x2';
const SIZES: SizeOption[] = ['1x1', '2x1', '2x2'];

class DevStateContext implements IStateContext {
    private handlers = new Map<string, Set<StateChangeListener>>();
    private readonly socket: Connection;

    defaultHistory: string | null = null;
    instanceId = '';
    admin = false;
    language: ioBroker.Languages = 'en';
    longitude: number | null = null;
    latitude: number | null = null;
    isFloatComma = true;
    dateFormat = 'DD.MM.YYYY';
    imagePrefix = '../../files/';

    constructor(socket: Connection) {
        this.socket = socket;
    }

    getState(id: string, handler: StateChangeListener): void {
        let set = this.handlers.get(id);
        if (!set) {
            set = new Set();
            this.handlers.set(id, set);
            void this.socket.subscribeState(id, (sid, state) => {
                const listeners = this.handlers.get(sid);
                if (!listeners || !state) {
                    return;
                }
                for (const cb of listeners) {
                    cb(sid, state);
                }
            });
        }
        set.add(handler);
    }

    removeState(id: string, handler: StateChangeListener): void {
        const set = this.handlers.get(id);
        if (!set) {
            return;
        }
        set.delete(handler);
        if (set.size === 0) {
            this.socket.unsubscribeState(id);
            this.handlers.delete(id);
        }
    }

    async getObject<T>(id: string): Promise<T | undefined> {
        try {
            return (await this.socket.getObject(id)) as unknown as T;
        } catch {
            return undefined;
        }
    }

    getObjectProperty(_id: string, _property: string, _cb: ObjectChangeListener): void {}
    async removeObject(_id: string, _cb: ObjectChangeListener): Promise<void> {}

    getSocket(): Connection {
        return this.socket;
    }

    getImagePath(fileName: string | null | undefined): string | null {
        return fileName || '';
    }

    destroy(): void {
        for (const id of this.handlers.keys()) {
            this.socket.unsubscribeState(id);
        }
        this.handlers.clear();
    }

    setCoordinates(latitude: number | null, longitude: number | null): void {
        this.latitude = latitude;
        this.longitude = longitude;
    }
}

/**
 * Dev subclass — the real WidgetGeneric is provided by the host via Module Federation and is
 * stubbed in the installed dm-widgets package, so `render()` returns null when the widget is
 * loaded standalone. Override it to render the iframe in a sized container.
 */
class DevEchart extends EchartComponent {
    override render(): React.JSX.Element {
        // Mirror the production host's dispatch (see ioBroker.devices Generic.tsx render()):
        //   '2x0.5' → renderWide
        //   '2x1'   → renderWideTall
        //   '2x2'   → renderHuge
        //   default → renderCompact
        const size = (this.props.settings.size || '1x1') as SizeOption;
        if (size === '2x2') {
            return this.renderHuge();
        }
        if (size === '2x1') {
            return this.renderWideTall();
        }
        return this.renderCompact();
    }
}

type ConnState = 'connecting' | 'ready' | { error: string };

interface PresetEntry {
    id: string;
    name: string;
}

export default function App(): React.JSX.Element {
    const [ctx, setCtx] = useState<DevStateContext | null>(null);
    const [conn, setConn] = useState<ConnState>('connecting');
    const [presets, setPresets] = useState<PresetEntry[]>([]);
    const [presetId, setPresetId] = useState<string>(() => {
        try {
            return window.localStorage.getItem(STORAGE_KEY) || '';
        } catch {
            return '';
        }
    });
    const [size, setSize] = useState<SizeOption>('2x2');

    useEffect(() => {
        let socket: Connection | null = null;
        try {
            socket = new Connection({
                host: IOB_HOST,
                port: IOB_PORT,
                protocol: 'http:',
                name: 'echarts-dev-harness',
                admin5only: true,
                onReady: async () => {
                    const c = new DevStateContext(socket!);
                    setCtx(c);
                    setConn('ready');
                    // Fetch presets so the dev UI can let us pick one.
                    try {
                        const objs = await socket!.getObjectViewSystem('chart', 'echarts.', 'echarts.香');
                        const list: PresetEntry[] = Object.values(objs || {})
                            .filter((o: any) => o?._id && !String(o._id).endsWith('.'))
                            .map((o: any) => ({
                                id: o._id,
                                name:
                                    (typeof o.common?.name === 'object'
                                        ? o.common.name.en || o.common.name.de
                                        : o.common?.name) || o._id,
                            }));
                        setPresets(list);
                    } catch (e) {
                        console.warn('Cannot load echarts presets', e);
                    }
                },
                onError: (err: Error) => setConn({ error: String(err?.message || err) }),
            } as any);
        } catch (err) {
            setConn({ error: String(err) });
        }
        return () => {
            try {
                socket?.destroy?.();
            } catch {
                // ignore
            }
        };
    }, []);

    useEffect(() => {
        try {
            if (presetId) {
                window.localStorage.setItem(STORAGE_KEY, presetId);
            }
        } catch {
            // ignore
        }
    }, [presetId]);

    const widget = useMemo(
        () => ({
            id: 'dev-echart',
            type: 'widget' as const,
            name: presetId || 'Echarts',
            control: {
                states: [],
                type: 'unknown',
                storeId: '',
                parentId: '',
                deviceId: '',
                channelId: '',
            },
        }),
        [presetId],
    );

    const widgetSettings = useMemo<EchartsViewerSettings>(
        () => ({
            type: 'plugin',
            id: 'echart-dev',
            // dm-widgets v0.3.1 typings don't include '2x2' yet — cast for the dev harness so we
            // can still preview the larger size locally. Host runtime accepts whatever string is
            // passed and dispatches to renderCompact/renderWide/renderWideTall accordingly.
            size: size as unknown as EchartsViewerSettings['size'],
            name: presets.find(p => p.id === presetId)?.name || presetId || 'Echart',
            favorite: false,
            color: '',
            chartHours: 0,
            icon: '',
            iconActive: '',
            text: '',
            textActive: '',
            presetId,
            readOnly: true,
            noLoader: false,
            transparentBackground: false,
        }),
        [presetId, presets, size],
    );

    if (conn === 'connecting') {
        return <div style={overlayStyle}>Connecting to {`http://${IOB_HOST}:${IOB_PORT}`} …</div>;
    }
    if (typeof conn === 'object' && 'error' in conn) {
        return <div style={{ ...overlayStyle, color: '#ff6b6b' }}>Connection error: {conn.error}</div>;
    }
    if (!ctx) {
        return <div style={overlayStyle}>Initializing …</div>;
    }

    return (
        <div
            style={{ minHeight: '100vh', background: '#191c1d', color: '#d8dde0', fontFamily: 'system-ui, sans-serif' }}
        >
            <div style={toolbarStyle}>
                <label style={{ fontSize: 14, opacity: 0.8 }}>Preset:</label>
                <select
                    value={presetId}
                    onChange={e => setPresetId(e.target.value)}
                    style={{
                        padding: '6px 8px',
                        background: '#0b0f14',
                        color: '#d8dde0',
                        border: '1px solid #3a3f43',
                        borderRadius: 6,
                        fontSize: 14,
                        minWidth: 220,
                    }}
                >
                    <option value="">— pick a preset —</option>
                    {presets.map(p => (
                        <option
                            key={p.id}
                            value={p.id}
                        >
                            {p.name} ({p.id})
                        </option>
                    ))}
                </select>
                <span style={{ marginLeft: 12, fontSize: 14, opacity: 0.8 }}>Size:</span>
                {SIZES.map(s => (
                    <button
                        key={s}
                        type="button"
                        style={tabButtonStyle(size === s)}
                        onClick={() => setSize(s)}
                    >
                        {s}
                    </button>
                ))}
                <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: 13 }}>
                    connected to {IOB_HOST}:{IOB_PORT}
                </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
                <div
                    style={{
                        width: size === '1x1' ? 220 : size === '2x1' ? 440 : 480,
                        maxWidth: '90vw',
                    }}
                >
                    <DevEchart
                        key={`${presetId}-${size}`}
                        widget={widget as any}
                        stateContext={ctx}
                        settings={widgetSettings}
                        onHide={() => {}}
                    />
                </div>
            </div>
        </div>
    );
}
