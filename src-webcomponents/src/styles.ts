/**
 * The styles of the shadow root. The element fills the box of the host, has a transparent background and inherits
 * `color` and `font`; the buttons, the hints and the progress take the theme of the host (`--iob-*`). The chart
 * itself takes its colors from the preset and the light or dark theme of echarts.
 */
export const STYLES = `
:host {
    display: block;
    width: 100%;
    height: 100%;
}
.box {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    /* the size of the box does not depend on what is in it */
    container-type: size;
}
.box.edit {
    pointer-events: none;
}
.title {
    flex: none;
    padding: 2px 4px 4px;
    font-weight: 600;
    font-size: clamp(12px, 6cqmin, 16px);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.title:empty {
    display: none;
}
.frame {
    flex: 1;
    min-height: 0;
    position: relative;
    box-sizing: border-box;
    overflow: hidden;
}
/* out of the flow: echarts reads the size of this box, and must never add to it */
.canvas {
    position: absolute;
    inset: 0;
}
.message {
    position: absolute;
    inset: 0;
    z-index: 3;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px;
    box-sizing: border-box;
    text-align: center;
    overflow-wrap: anywhere;
    color: var(--iob-text-secondary);
    font-size: clamp(11px, 5cqmin, 15px);
}
.message[hidden] {
    display: none;
}
.message.error {
    color: var(--iob-error);
}
.message svg {
    width: clamp(20px, 12cqmin, 40px);
    height: clamp(20px, 12cqmin, 40px);
    fill: currentColor;
    opacity: 0.6;
}
.progress {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    height: 2px;
    z-index: 3;
    overflow: hidden;
    pointer-events: none;
}
.progress[hidden] {
    display: none;
}
.progress::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    width: 30%;
    background: var(--iob-primary);
    animation: slide 1.2s ease-in-out infinite;
}
@keyframes slide {
    from {
        left: -30%;
    }
    to {
        left: 100%;
    }
}
button {
    position: absolute;
    z-index: 2;
    box-sizing: border-box;
    margin: 0;
    font: inherit;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}
button[hidden] {
    display: none;
}
button svg {
    width: 100%;
    height: 100%;
    fill: currentColor;
}
/* the buttons the preset switches on: an icon on the right edge, as in the chart page */
button.icon {
    right: 5px;
    width: 20px;
    height: 20px;
    padding: 0;
    border: none;
    background: none;
    color: inherit;
    opacity: 0.7;
}
button.icon:hover,
button.icon:focus-visible {
    opacity: 1;
}
button.icon.busy {
    opacity: 0.4;
    cursor: progress;
}
/* reset and lines: flat, outlined surfaces */
button.surface {
    top: 10px;
    width: 30px;
    height: 30px;
    padding: 6px;
    border: 1px solid var(--iob-divider);
    border-radius: 8px;
    background: var(--iob-paper);
    color: var(--iob-text-secondary);
}
button.surface:hover,
button.surface:focus-visible {
    color: var(--iob-primary);
}
button:focus-visible {
    outline: 2px solid var(--iob-primary);
    outline-offset: 1px;
}
.reset {
    right: 25px;
}
`;
