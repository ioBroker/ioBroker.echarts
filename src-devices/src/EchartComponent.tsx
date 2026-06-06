// echarts viewer widget for ioBroker.devices.
//
// Shows a saved echarts preset inside an iframe. The widget itself does no chart rendering —
// it delegates entirely to the echarts adapter's chart renderer (`/adapter/echarts/chart/index.html`
// when running inside admin, otherwise `/echarts/index.html`) by appending `?preset=<presetId>`.
//
// Settings: the user picks an echarts preset object (objectType=chart). The "size" base setting
// from the Devices host (1x1 / 2x1 / 2x2) controls how the tile is laid out — the same iframe
// is reused at every size; only the wrapper aspect-ratio changes.

import WidgetGeneric, {
    React,
    MuiMaterial,
    MuiIcons,
    getTileStyles,
    isNeumorphicTheme,
    type WidgetGenericProps,
    type WidgetGenericState,
    type CustomWidgetPlugin,
} from '@iobroker/dm-widgets';
import type { BoxProps, TypographyProps, DialogProps, IconButtonProps, DialogContentProps } from '@mui/material';
import type { ConfigItemPanel, ConfigItemTabs } from '@iobroker/json-config';

const Box: React.ComponentType<BoxProps> = MuiMaterial?.Box;
const Typography: React.ComponentType<TypographyProps> = MuiMaterial?.Typography;
const Dialog: React.ComponentType<DialogProps> = MuiMaterial?.Dialog;
const DialogContent: React.ComponentType<DialogContentProps> = MuiMaterial?.DialogContent;
const IconButton: React.ComponentType<IconButtonProps> = MuiMaterial?.IconButton;
const CloseIcon: React.ComponentType<any> = MuiIcons?.Close;

export interface EchartsViewerSettings extends CustomWidgetPlugin {
    /** Full ioBroker object ID of the echarts preset (e.g. `echarts.0.MyChart`). */
    presetId?: string;
    /** Hide the chart toolbar/zoom UI inside the iframe (uses ?noedit). */
    readOnly?: boolean;
    /** Hide the loader spinner inside the iframe (uses ?noLoader). */
    noLoader?: boolean;
    /** Make the iframe transparent (uses ?noBG=true). */
    transparentBackground?: boolean;
    /**
     * Theme to use for the embedded chart.
     *  - `auto` (default): chart inherits the host's theme via shared localStorage
     *  - `light` / `dark` / `blue`: force a specific theme via the `?theme=` URL parameter
     */
    chartTheme?: 'auto' | 'light' | 'dark' | 'blue';
}

interface EchartsViewerState extends WidgetGenericState {
    dialogOpen: boolean;
}

/**
 * Build the chart URL relative to the current location.
 *
 * Two flavours, picked by where the devices admin is being served from:
 *   - Inside admin (`localhost:8081/...`): the echarts adapter exposes its renderer at
 *     `/adapter/echarts/chart/index.html`.
 *   - Standalone web (`localhost:8082/...` or behind a web instance): the renderer is at
 *     `/echarts/index.html`.
 *
 * We pick the admin path whenever the current host serves on the admin port pattern; otherwise
 * fall back to the web path. The host can override this by setting the absolute URL itself.
 */
function buildChartUrl(
    presetId: string,
    settings: EchartsViewerSettings,
    isAdmin: boolean,
    hostTheme: 'light' | 'dark',
): string {
    if (!presetId) {
        return '';
    }
    const params = new URLSearchParams();
    params.set('preset', presetId);
    if (settings.noLoader) {
        params.set('noLoader', 'true');
    }
    if (settings.transparentBackground) {
        params.set('noBG', 'true');
    }
    if (settings.readOnly) {
        params.set('noedit', 'true');
    }
    // Resolve the chart theme:
    //   - chartTheme=='auto' (default): mirror the host's current theme palette so the iframe
    //     re-renders with the matching look whenever the user toggles the admin theme. The
    //     caller passes the current MUI palette.mode for this.
    //   - explicit value: forward that to the chart unchanged.
    const resolvedTheme = !settings.chartTheme || settings.chartTheme === 'auto' ? hostTheme : settings.chartTheme;
    params.set('theme', resolvedTheme);
    const query = params.toString();

    // Devices admin and the echarts adapter live as siblings under `/adapter/`. We always
    // resolve relative to the current page: from admin (`/adapter/devices/...`) → the chart
    // is at `../echarts/chart/index.html`; from web/vis (`/devices/...`) → `../echarts/index.html`.
    if (isAdmin) {
        return `../echarts/chart/index.html?${query}`;
    }
    return `../echarts/index.html?${query}`;
}

export class EchartComponent extends WidgetGeneric<EchartsViewerState, EchartsViewerSettings> {
    constructor(props: WidgetGenericProps<EchartsViewerSettings>) {
        super(props);
        this.state = {
            ...this.state,
            dialogOpen: false,
        };
    }

    static override getConfigSchema(): { name: string; schema: ConfigItemPanel | ConfigItemTabs } {
        return {
            name: 'EchartsViewer',
            schema: {
                type: 'panel',
                items: {
                    // Override the base `size` dropdown to also offer 2×2 (the host base only
                    // exposes 1×1 / 2×0.5 / 2×1). Same pattern as the host's iframe widget.
                    size: {
                        type: 'select',
                        label: 'wm_Size',
                        options: [
                            { value: '1x1', label: '1×1' },
                            { value: '2x1', label: '2×1' },
                            { value: '2x2', label: '2×2' },
                        ],
                        default: '1x1',
                        format: 'radio',
                        horizontal: true,
                        noTranslation: true,
                    },
                    presetId: {
                        type: 'objectId',
                        label: 'echarts_presetId',
                        help: 'echarts_presetId_help',
                        // The picker defaults to type:state — we want chart objects.
                        types: ['chart'],
                        // Restrict to the echarts adapter's namespace so users don't accidentally
                        // pick chart objects from other adapters (e.g. flot).
                        root: 'echarts',
                        expertMode: true,
                        sm: 12,
                    },
                    noLoader: {
                        type: 'checkbox',
                        label: 'echarts_noLoader',
                        default: true,
                        sm: 12,
                        md: 4,
                    },
                    transparentBackground: {
                        type: 'checkbox',
                        label: 'echarts_transparentBackground',
                        default: true,
                        sm: 12,
                        md: 4,
                    },
                    chartTheme: {
                        type: 'select',
                        label: 'echarts_chartTheme',
                        help: 'echarts_chartTheme_help',
                        options: [
                            { value: 'auto', label: 'echarts_chartTheme_auto' },
                            { value: 'light', label: 'echarts_chartTheme_light' },
                            { value: 'dark', label: 'echarts_chartTheme_dark' },
                            { value: 'blue', label: 'echarts_chartTheme_blue' },
                        ],
                        default: 'auto',
                        sm: 12,
                        md: 4,
                    },
                },
            },
        };
    }

    protected isTileActive(): boolean {
        return !!this.props.settings.presetId;
    }

    /**
     * Renders the iframe itself (no chrome). Used by all size variants and by the fullscreen
     * dialog. Pointer events are disabled in the smaller tile variants — see renderCompact —
     * so the wrapper's onClick (which opens the dialog) wins over iframe interaction.
     *
     * The iframe's URL is built inside a functional sub-component that uses `useTheme()`, so
     * the chart re-loads with the matching theme whenever the host's MUI ThemeProvider value
     * changes (i.e. user toggles light/dark in admin) — no page reload required.
     */
    private renderIframe(interactive: boolean): React.JSX.Element {
        if (!this.props.settings.presetId) {
            return (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                        color: 'text.secondary',
                        fontStyle: 'italic',
                        textAlign: 'center',
                        p: 1,
                    }}
                >
                    <Typography variant="body2">No preset selected</Typography>
                </Box>
            );
        }
        const url = buildChartUrl(
            this.props.settings.presetId || '',
            this.props.settings,
            this.props.stateContext.admin,
            this.props.stateContext.themeType,
        );
        return (
            <iframe
                src={url}
                title={this.props.settings.presetId}
                style={{
                    width: '100%',
                    height: '100%',
                    border: 0,
                    background: this.props.settings.transparentBackground ? 'transparent' : undefined,
                    pointerEvents: interactive ? 'auto' : 'none',
                }}
                allow="fullscreen"
            />
        );
    }

    /** 1x1 — square tile with a label header and the chart underneath. */
    override renderCompact(): React.JSX.Element {
        const isActive = this.isTileActive();
        const accent = this.getAccentColor();
        const settingsButton = this.renderSettingsButton();
        const indicators = this.renderIndicators(settingsButton);
        const label = this.props.settings.name || '';
        return (
            <Box
                id={String(this.props.widget.id)}
                className={this.getWidgetClass()}
                sx={theme => WidgetGeneric.getStyleCompact(theme)}
            >
                <Box
                    onClick={() => this.setState({ dialogOpen: true })}
                    sx={theme => ({
                        display: 'flex',
                        flexDirection: 'column',
                        width: '100%',
                        aspectRatio: '1',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        ...(getTileStyles(theme, isActive, accent) as any),
                        padding: isNeumorphicTheme(theme) ? '4px' : '6px',
                    })}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{ display: 'contents' }}
                    >
                        {indicators}
                    </div>
                    {label ? (
                        <Typography
                            variant="caption"
                            sx={{
                                fontWeight: 700,
                                color: 'text.secondary',
                                px: 0.5,
                                pb: 0.25,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {label}
                        </Typography>
                    ) : null}
                    <Box sx={{ flex: 1, minHeight: 0, width: '100%' }}>{this.renderIframe(false)}</Box>
                </Box>
            </Box>
        );
    }

    /** 2x0.5 — short, wide strip. Forces a small fixed height. */
    override renderWide(): React.JSX.Element {
        return this.renderWideTile(WidgetGeneric.getStyleWide, { aspectRatio: '4 / 1' });
    }

    /** 2x1 — wide-tall tile, 2:1 aspect (matches the grid cell shape). */
    override renderWideTall(): React.JSX.Element {
        return this.renderWideTile(WidgetGeneric.getStyleWideTall, { aspectRatio: '2 / 1' });
    }

    /**
     * 2x2 — square big tile. The Devices host's `render()` dispatches `settings.size === '2x2'`
     * to this method (see Generic.tsx renderHuge); without an override the base class falls back
     * to renderWideTall, and the iframe ends up shorter than the 2x2 grid cell. Forcing a 1:1
     * aspect makes the iframe fill the full square cell.
     */
    renderHuge(): React.JSX.Element {
        // `WidgetGeneric.getStyleHuge` is provided by the host at runtime but isn't in the
        // dm-widgets stub typings — fall back to getStyleWideTall (which is also `gridColumn:
        // span 2` and works at compile time). The host's wrapper adds `gridRow: span 2` based
        // on `settings.size`, so the cell ends up correctly sized either way.
        const styleFn =
            (WidgetGeneric as unknown as { getStyleHuge?: (t: any) => any }).getStyleHuge ||
            WidgetGeneric.getStyleWideTall;
        return this.renderWideTile(styleFn, { aspectRatio: '1 / 1' });
    }

    private renderWideTile(
        outerStyleFn: (t: any) => any,
        opts: { aspectRatio?: string; fillContainer?: boolean },
    ): React.JSX.Element {
        const isActive = this.isTileActive();
        const accent = this.getAccentColor();
        const settingsButton = this.renderSettingsButton();
        const indicators = this.renderIndicators(settingsButton);
        const label = this.props.settings.name || '';
        return (
            <Box
                id={String(this.props.widget.id)}
                className={this.getWidgetClass()}
                sx={(theme: any) => outerStyleFn(theme)}
            >
                <Box
                    onClick={() => this.setState({ dialogOpen: true })}
                    sx={(theme: any) => ({
                        display: 'flex',
                        flexDirection: 'column',
                        width: '100%',
                        height: opts.fillContainer ? '100%' : undefined,
                        aspectRatio: opts.aspectRatio,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        ...(getTileStyles(theme, isActive, accent) as any),
                        padding: isNeumorphicTheme(theme) ? '4px' : '6px',
                        containerType: 'inline-size',
                    })}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{ display: 'contents' }}
                    >
                        {indicators}
                    </div>
                    {label ? (
                        <Typography
                            sx={{
                                fontWeight: 700,
                                color: 'text.secondary',
                                fontSize: 'clamp(12px, 2.5cqw, 18px)',
                                px: 0.5,
                                pb: 0.25,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {label}
                        </Typography>
                    ) : null}
                    <Box sx={{ flex: 1, minHeight: 0, width: '100%' }}>{this.renderIframe(false)}</Box>
                </Box>
            </Box>
        );
    }

    private renderDialog(): React.JSX.Element | null {
        if (!this.state.dialogOpen) {
            return null;
        }
        return (
            <Dialog
                open
                onClose={() => this.setState({ dialogOpen: false })}
                maxWidth={false}
                fullWidth
                slotProps={{
                    paper: {
                        sx: {
                            width: '95vw',
                            height: '90vh',
                            maxWidth: '95vw',
                            maxHeight: '90vh',
                            m: 1,
                        },
                    },
                }}
            >
                <IconButton
                    onClick={() => this.setState({ dialogOpen: false })}
                    sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
                >
                    <CloseIcon />
                </IconButton>
                <DialogContent
                    sx={{
                        display: 'flex',
                        alignItems: 'stretch',
                        justifyContent: 'stretch',
                        p: 1,
                        overflow: 'hidden',
                    }}
                >
                    <Box sx={{ width: '100%', height: '100%' }}>{this.renderIframe(true)}</Box>
                </DialogContent>
            </Dialog>
        );
    }

    override render(): React.JSX.Element {
        const widget = super.render();
        const dialog = this.renderDialog();
        if (dialog) {
            return (
                <>
                    {widget}
                    {dialog}
                </>
            );
        }
        return widget;
    }
}

export default EchartComponent;
