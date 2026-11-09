import type { SeriesData } from '@echarts-chart/ChartModel';

/** How the time is written into the CSV file: ISO, the format of the browser, or milliseconds */
export type TimeFormat = 'iso' | 'locale' | 'ts';

/** The chart page keeps the choice under this key; in the same origin both share it */
const TIME_FORMAT_KEY = 'Chart.timeFormat';

/** The time format of the last export, `locale` if there was none or the storage cannot be read */
export function readTimeFormat(): TimeFormat {
    try {
        const format = window.localStorage.getItem(TIME_FORMAT_KEY);
        if (format === 'iso' || format === 'locale' || format === 'ts') {
            return format;
        }
    } catch {
        // private mode or blocked storage: the default
    }
    return 'locale';
}

/**
 * Remember the time format for the next export
 *
 * @param format the format
 */
export function storeTimeFormat(format: TimeFormat): void {
    try {
        window.localStorage.setItem(TIME_FORMAT_KEY, format);
    } catch {
        // nothing to remember it in
    }
}

/**
 * The name of a saved file as the chart page builds it: `YYYY_MM_DD_HH_mm_<name>.<extension>`
 *
 * @param date the time in the name
 * @param name the name of the line, or `chart`
 * @param extension e.g. `svg`
 */
export function fileName(date: Date, name: string, extension: string): string {
    const pad = (value: number): string => value.toString().padStart(2, '0');
    return `${date.getFullYear()}_${pad(date.getMonth() + 1)}_${pad(date.getDate())}_${pad(date.getHours())}_${pad(date.getMinutes())}_${name}.${extension}`;
}

/**
 * The raw values as CSV, as the chart page writes them: a column per line, a row per time stamp, values of the same
 * time stamp in one row
 *
 * @param data the values by the ID of the line
 * @param timeFormat how the time is written
 */
export function toCsv(data: Record<string, SeriesData[]>, timeFormat: TimeFormat): string {
    const header = ['time'];
    const table: (number | ioBroker.StateValue | undefined)[][] = [];
    Object.keys(data).forEach((id, i) => {
        header.push(id);
        data[id].forEach(value => {
            // the first column is always the time stamp
            const row: (number | ioBroker.StateValue | undefined)[] = [value.ts];
            row[i + 1] = value.val;
            table.push(row);
        });
    });
    table.sort((a, b) => (a[0] as number) - (b[0] as number));

    // values of the same time go into one row
    for (let i = 0; i < table.length - 1; i++) {
        if (table[i][0] === table[i + 1][0]) {
            for (let j = 1; j < table[i + 1].length; j++) {
                if (table[i + 1][j] !== undefined) {
                    table[i][j] = table[i + 1][j];
                }
            }
            table.splice(i + 1, 1);
            i--;
        }
    }

    const lines = table.map(row => {
        const ts = row.shift() as number;
        let time: string;
        if (timeFormat === 'iso') {
            time = new Date(ts).toISOString();
        } else if (timeFormat === 'locale') {
            const date = new Date(ts);
            time = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}.${date.getMilliseconds().toString().padStart(3, '0')}`;
        } else {
            time = ts.toString();
        }
        // `join` writes an empty column for a line without a value at this time
        return `${time};${row.join(';')}`;
    });

    return `${header.join(';')}\n${lines.join('\n')}`;
}

/**
 * Let the browser save a URL as a file
 *
 * @param container where the link is put for the click; it is removed again at once
 * @param url a `data:` or `blob:` URL
 * @param name the name of the file
 * @returns false if the browser cannot
 */
export function saveUrl(container: Node, url: string, name: string): boolean {
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.target = '_self';
    link.style.display = 'none';
    container.appendChild(link);
    try {
        link.click();
        return true;
    } catch (e) {
        console.error(`Cannot save ${name}: ${String(e)}`);
        return false;
    } finally {
        link.remove();
    }
}

/**
 * Let the browser save a text as a file. A blob and not a `data:` URL: that one would have to be encoded, and is
 * limited in length
 *
 * @param container where the link is put for the click
 * @param text the content
 * @param name the name of the file
 * @param type the media type
 * @returns false if the browser cannot
 */
export function saveText(container: Node, text: string, name: string, type: string): boolean {
    let url: string;
    try {
        url = URL.createObjectURL(new Blob([text], { type }));
    } catch (e) {
        console.error(`Cannot save ${name}: ${String(e)}`);
        return false;
    }
    const saved = saveUrl(container, url, name);
    // the browser reads the blob after the click, not during it
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    return saved;
}
