import type { ChartConfigMore } from '../../src/types';
import type { ChartInfo, ChartViewOption } from '@echarts-chart/ChartOption';
import type { ECharts } from './echarts';

/** A pointer event of zrender: the position in the chart and the event of the browser */
interface ZrEvent {
    offsetX: number;
    offsetY: number;
    event?: Event;
}

/** What the pan and the zoom need of the chart they move */
export interface PanZoomHost {
    /** The echarts instance */
    chart(): ECharts | null;
    /** What `ChartOption` knows of the drawn chart: the visible range and the paddings */
    info(): ChartInfo | null;
    /** The option the chart was drawn with */
    option(): ChartViewOption | null;
    config(): ChartConfigMore | null;
    /** Read another window (`{ start, end }`), stop the live update while dragging, or go back to the range */
    setRange(options?: { stopLive?: boolean; start?: number; end?: number }): void;
    /** Show or hide the button that goes back to the range */
    showReset(show: boolean): void;
}

/**
 * Pan with the mouse, zoom with the wheel, pinch and swipe on a touch device - as the chart page does it
 * (`ChartView.tsx`). The window moves at once; the history of the new window is read when the user lets go.
 */
export class PanZoom {
    readonly #host: PanZoomHost;

    #mouseDown = false;

    /** The zrender the mouse handlers are on */
    #zr: ReturnType<ECharts['getZr']> | null = null;

    #moveOn = false;

    /** The element the touch handlers are on */
    #touch: HTMLElement | null = null;

    #wheelTimer: ReturnType<typeof setTimeout> | null = null;

    #resetTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(host: PanZoomHost) {
        this.#host = host;
    }

    /**
     * Switch the handlers on or off for the chart as it is drawn now
     *
     * @param enabled whether the chart can be panned: a time axis and `zoom` in the preset
     * @param useCanvas a touch device: touch handlers instead of the mouse
     * @param element the element the chart is drawn into
     */
    install(enabled: boolean, useCanvas: boolean, element: HTMLElement): void {
        const zr = enabled && !useCanvas ? this.#host.chart()?.getZr() || null : null;
        if (zr !== this.#zr) {
            this.#offMouse();
            if (zr) {
                zr.on('mousedown', this.#onMouseDown);
                zr.on('mouseup', this.#onMouseUp);
                zr.on('mousewheel', this.#onMouseWheel);
                this.#zr = zr;
            }
        }
        const touch = enabled && useCanvas ? element : null;
        if (touch !== this.#touch) {
            this.#offTouch();
            if (touch) {
                touch.addEventListener('touchstart', this.#onTouchStart, { passive: false });
                touch.addEventListener('touchend', this.#onTouchEnd, { passive: false });
                touch.addEventListener('touchmove', this.#onTouchMove, { passive: false });
                this.#touch = touch;
            }
        }
    }

    /** Remove the handlers and stop the timers, e.g. before the chart is disposed */
    destroy(): void {
        this.#offMouse();
        this.#offTouch();
        this.#mouseDown = false;
        if (this.#wheelTimer) {
            clearTimeout(this.#wheelTimer);
            this.#wheelTimer = null;
        }
        if (this.#resetTimer) {
            clearTimeout(this.#resetTimer);
            this.#resetTimer = null;
        }
    }

    #offMouse(): void {
        if (this.#zr) {
            this.#zr.off('mousedown', this.#onMouseDown);
            this.#zr.off('mouseup', this.#onMouseUp);
            this.#zr.off('mousewheel', this.#onMouseWheel);
            if (this.#moveOn) {
                this.#zr.off('mousemove', this.#onMouseMove);
                this.#moveOn = false;
            }
            this.#zr = null;
        }
    }

    #offTouch(): void {
        if (this.#touch) {
            this.#touch.removeEventListener('touchstart', this.#onTouchStart);
            this.#touch.removeEventListener('touchend', this.#onTouchEnd);
            this.#touch.removeEventListener('touchmove', this.#onTouchMove);
            this.#touch = null;
        }
    }

    /** The width of the plot area in px */
    #plotWidth(info: ChartInfo): number {
        return (this.#host.chart()?.getWidth() || 0) - info.padRight - info.padLeft || 1;
    }

    /**
     * Stop the zoom and the pan at the end of the time range, unless the preset allows the future. The width of the
     * window is kept, so a pan runs against a wall instead of being stretched.
     */
    #limitRange(info: ChartInfo): void {
        const config = this.#host.config();
        const limit = config?.zoomLimitEnd;
        if (config?.noZoomLimit || !limit) {
            return;
        }
        if (info.xMax > limit) {
            const diff = info.xMax - info.xMin;
            info.xMax = limit;
            info.xMin = limit - diff;
        }
    }

    /**
     * Show the new window: at once on the axis, and with its data when `read` is set
     *
     * @param read read the history of the window
     */
    #setNewRange(read?: boolean): void {
        const info = this.#host.info();
        if (!info) {
            return;
        }
        this.#limitRange(info);
        info.diff = info.xMax - info.xMin;
        info.withTime = info.diff < 3600000 * 24 * 7;
        info.withSeconds = info.diff < 60000 * 30;

        if (read) {
            if (this.#wheelTimer) {
                clearTimeout(this.#wheelTimer);
                this.#wheelTimer = null;
            }
            this.#host.setRange({ start: info.xMin, end: info.xMax });

            const resetZoom = Number(this.#host.config()?.resetZoom) || 0;
            if (resetZoom) {
                if (this.#resetTimer) {
                    clearTimeout(this.#resetTimer);
                }
                this.#resetTimer = setTimeout(() => {
                    this.#resetTimer = null;
                    this.#host.showReset(false);
                    this.#host.setRange();
                }, 1000 * resetZoom);
            }
            return;
        }
        const option = this.#host.option();
        const xAxis = option?.xAxis as { min?: number; max?: number }[] | undefined;
        if (xAxis?.[0]) {
            xAxis[0].min = info.xMin;
            xAxis[0].max = info.xMax;
        }
        try {
            this.#host.chart()?.setOption({ xAxis: { min: info.xMin, max: info.xMax } });
        } catch (e) {
            console.error(`Cannot move the chart: ${String(e)}`);
        }
    }

    #onMouseDown = (e: ZrEvent): void => {
        const info = this.#host.info();
        if (!info) {
            return;
        }
        this.#mouseDown = true;
        info.lastX = e.offsetX - info.padLeft;
        info.xMoved = false;
        if (this.#zr && !this.#moveOn) {
            this.#moveOn = true;
            this.#zr.on('mousemove', this.#onMouseMove);
        }
        // no live update while the user drags, or it would pull the window back
        if (this.#host.config()?.live) {
            this.#host.setRange({ stopLive: true });
        }
    };

    #onMouseMove = (e: ZrEvent): void => {
        const info = this.#host.info();
        if (!this.#mouseDown || !info) {
            return;
        }
        this.#host.showReset(true);
        info.xMoved = true;
        const x = e.offsetX - info.padLeft;
        const moved = (info.lastX ?? x) - x;
        info.lastX = x;
        const shift = Math.round((moved * (info.xMax - info.xMin)) / this.#plotWidth(info));
        info.xMin += shift;
        info.xMax += shift;
        this.#setNewRange();
    };

    #onMouseUp = (): void => {
        this.#mouseDown = false;
        if (this.#host.info()?.xMoved) {
            this.#setNewRange(true);
        }
        if (this.#zr && this.#moveOn) {
            this.#moveOn = false;
            this.#zr.off('mousemove', this.#onMouseMove);
        }
    };

    /** The wheel zooms the time axis, with Shift the Y axes */
    #onMouseWheel = (e: ZrEvent): void => {
        const info = this.#host.info();
        const wheel = e.event as WheelEvent | undefined;
        if (!info || !wheel) {
            return;
        }
        const amount = wheel.deltaY > 0 || wheel.deltaX > 0 ? 1.1 : 0.9;

        if (wheel.shiftKey) {
            const height = (this.#host.chart()?.getHeight() || 0) - info.padBottom - info.padTop || 1;
            const pos = (e.offsetY - info.padTop) / height;
            const yAxis = info.yAxis.filter(axis => typeof axis.min === 'number' && typeof axis.max === 'number');
            if (!yAxis.length) {
                return;
            }
            yAxis.forEach(axis => {
                const diff = (axis.max as number) - (axis.min as number);
                const move = diff - diff * amount;
                (axis.max as number) += move * (1 - pos);
                (axis.min as number) -= move * pos;
            });
            try {
                this.#host.chart()?.setOption({ yAxis: info.yAxis });
            } catch (err) {
                console.error(`Cannot zoom the chart: ${String(err)}`);
            }
            return;
        }

        this.#host.showReset(true);
        const pos = (e.offsetX - info.padLeft) / this.#plotWidth(info);
        const diff = info.xMax - info.xMin;
        const move = diff - diff * amount;
        info.xMax += move * (1 - pos);
        info.xMin -= move * pos;
        this.#setNewRange();
        if (this.#wheelTimer) {
            clearTimeout(this.#wheelTimer);
        }
        this.#wheelTimer = setTimeout(() => this.#setNewRange(true), 1000);
    };

    #onTouchStart = (e: TouchEvent): void => {
        const info = this.#host.info();
        if (!info || !e.touches?.length) {
            return;
        }
        this.#mouseDown = true;
        e.preventDefault();
        e.stopImmediatePropagation();
        const touches = e.touches;
        info.lastX = touches[touches.length - 1].pageX - info.padLeft;
        info.lastWidth = touches.length > 1 ? Math.round(Math.abs(touches[0].pageX - touches[1].pageX)) : null;
    };

    #onTouchEnd = (e: TouchEvent): void => {
        if (this.#mouseDown) {
            e.stopImmediatePropagation();
            e.preventDefault();
            this.#mouseDown = false;
            this.#setNewRange(true);
        }
    };

    /** One finger moves the window, two fingers zoom it */
    #onTouchMove = (e: TouchEvent): void => {
        const info = this.#host.info();
        const touches = e.touches;
        if (!info || !touches?.length) {
            return;
        }
        const pageX = touches[touches.length - 1].pageX - info.padLeft;
        if (this.#mouseDown) {
            e.preventDefault();
            e.stopImmediatePropagation();
            this.#host.showReset(true);

            if (touches.length > 1) {
                const fingerWidth = Math.round(Math.abs(touches[0].pageX - touches[1].pageX));
                if (info.lastWidth !== null && info.lastWidth !== undefined && fingerWidth !== info.lastWidth) {
                    const diff = info.xMax - info.xMin;
                    const amount = fingerWidth > info.lastWidth ? 1.05 : 0.95;
                    const left = Math.min(touches[0].pageX, touches[1].pageX);
                    const pos = (left - info.padLeft + fingerWidth / 2) / this.#plotWidth(info);
                    const move = diff - diff * amount;
                    info.xMax = Math.round(info.xMax + move * (1 - pos));
                    info.xMin = Math.round(info.xMin - move * pos);
                    this.#setNewRange();
                }
                info.lastWidth = fingerWidth;
            } else {
                const moved = (info.lastX ?? pageX) - pageX;
                const shift = Math.round((moved * (info.xMax - info.xMin)) / this.#plotWidth(info));
                info.xMin += shift;
                info.xMax += shift;
                this.#setNewRange();
            }
        }
        info.lastX = pageX;
    };
}
