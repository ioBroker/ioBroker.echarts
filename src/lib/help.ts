/**
 * The answer of the message `help`: what the instance answers, written for AI agents (e.g. ioBroker.pi-agent, or
 * the MCP server with `send_to`) and script authors. Keep it in sync with the message handler in main.ts and
 * with `EchartsOptions` in types.d.ts.
 */

/** Every command the message handler answers; `write` = the command changes something */
export const COMMANDS: { command: string; write: boolean }[] = [
    { command: 'help', write: false },
    { command: 'send', write: true },
];

export const HELP = `ioBroker.echarts: charts (Apache ECharts) of the history of states, configured as presets in its admin tab and
shown in vis, Aura, admin and other dashboards. A preset is an object of type "chart" below echarts.0 (e.g.
echarts.0.Temperatures; folders group them): it holds the states (lines), the time range and the look. An agent can
render a preset on the server to an image (PNG, JPG, SVG) or a PDF and send it, e.g. with telegram or email.
Presets are made and changed in the editor of the admin tab "Charts", not by messages.

Commands (sendTo echarts.0):
- send {preset, renderer?, width?, height?, background?, theme?, title?, quality?, compressionLevel?, filters?,
  fileOnDisk?, fileName?, cache?, forceRefresh?}: renders the preset with its current data:
  {data: "data:image/png;base64,..."} (a data URL of the file) or {error}.
  - preset (required): the ID of the preset object; without "echarts." in front, "echarts.0." is added
    (so "Temperatures" = echarts.0.Temperatures). It may also be a chart config object as in native.data of a
    preset (e.g. a copy with another time range); then do not use cache. An unknown preset is answered with
    {error: "Unknown preset ..."}: look the ID up first (objects of type chart below echarts.0).
  - renderer: svg (default), png, jpg or pdf. png, jpg and pdf need the module canvas on the host; without it
    they fail and only svg works (the log of echarts.0 says so at its start).
  - width (default 1024), height (default 300): size in pixels.
  - background: a CSS color, e.g. "#ffffff". Without it the chart is transparent: a PNG shows the background of
    the viewer, a JPG turns black. For a picture to send give a background, white for theme light.
  - theme: light (default) or dark (the colors of texts and axes; svg with dark and no background: black).
    themeType is the old name of theme.
  - title: title of a PDF document (default "ioBroker Chart"). quality: of a JPG, 0-1 (default 0.8).
    compressionLevel: of a PNG, 0-9 (default 3). filters: PNG filters of node-canvas (bit mask).
  - fileOnDisk: also write the file to this path on the ioBroker host (e.g. /tmp/chart.png), for adapters that
    send a file from the disk.
  - fileName: also write the file into the files of echarts.0 (e.g. "charts/temp.png"), reachable with the web
    adapter as http(s)://<host>:<port of web>/echarts.0/charts/temp.png.
  - cache: seconds to keep the picture of this preset; a send with cache for the same preset within that time
    gets the kept one, whatever its other options (default 0 = render every time). forceRefresh true: render
    anyway.
  The same message twice within 0.3 s is answered only once. On a failure the answer is {error} with the reason
  as text (e.g. the module canvas is missing: try renderer svg).

How to talk to the user:
- Ask which chart, if not clear, and name it by the name of its preset (common.name), not by its ID.
- Ask where to send it (which messenger, which chat or recipient) before sending; a picture of the house's data
  goes only to the people the user names.
- To change what a chart shows (states, time range), the user edits the preset in the admin tab "Charts".`;
