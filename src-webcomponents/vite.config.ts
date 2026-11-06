import { checkManifest, type WebComponentText } from '@iobroker/web-components';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

// with the extension: Vite may load its config natively, without a bundler that would add it
import { buildManifest, ELEMENT_WORDS, MANIFEST_FILE, MODULE_FILE } from './src/manifest.ts';

/**
 * The web component `<iob-echarts-chart>`: one ES module, `admin/webcomponents/echarts-chart.js`, and its manifest
 * `echarts-chart.json` next to it (`common.webComponents`). Every host - vis-2, devices, Aura, admin - reads them from
 * `/adapter/echarts/webcomponents/`. No module federation: the host shares nothing but the socket.
 *
 * Everything is bundled into the one file: echarts (only the parts the option of a preset can contain, see
 * `src/echarts.ts`), moment and the model and the option of `src-chart`. No React: the element is plain DOM.
 */

const LANGUAGES: ioBroker.Languages[] = ['en', 'de', 'ru', 'pt', 'nl', 'fr', 'it', 'es', 'pl', 'uk', 'zh-cn'];

function readJson<T>(path: string): T {
    return JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8')) as T;
}

/** The words of `src/i18n/`, by language */
const WORDS = Object.fromEntries(
    LANGUAGES.map(lang => [lang, readJson<Record<string, string>>(`./src/i18n/${lang}.json`)]),
) as Record<ioBroker.Languages, Record<string, string>>;

/**
 * A word in every language; the build fails if one is missing
 *
 * @param key the key in `src/i18n/<lang>.json`
 */
function word(key: string): WebComponentText {
    const text: Partial<Record<ioBroker.Languages, string>> = {};
    for (const lang of LANGUAGES) {
        if (!WORDS[lang][key]) {
            throw new Error(`src/i18n/${lang}.json has no "${key}"`);
        }
        text[lang] = WORDS[lang][key];
    }
    return text as WebComponentText;
}

/** The words the element shows, in every language - not the ones of the settings, those are in the manifest */
function elementWords(): Record<string, Record<string, string>> {
    const words: Record<string, Record<string, string>> = {};
    for (const lang of LANGUAGES) {
        words[lang] = {};
    }
    for (const key of ELEMENT_WORDS) {
        const text = word(key) as Record<string, string>;
        for (const lang of LANGUAGES) {
            words[lang][key] = text[lang];
        }
    }
    return words;
}

/** Writes `echarts-chart.json` next to the module, checked like a host checks it */
function manifestFile(): Plugin {
    return {
        name: 'echarts-web-component-manifest',
        generateBundle() {
            let manifest;
            try {
                manifest = buildManifest(word);
            } catch (e) {
                this.error(`${MANIFEST_FILE}: ${(e as Error).message}`);
            }
            const problem = checkManifest(manifest);
            if (problem) {
                this.error(`${MANIFEST_FILE}: ${problem}`);
            }
            this.emitFile({
                type: 'asset',
                fileName: MANIFEST_FILE,
                source: `${JSON.stringify(manifest, null, 4)}\n`,
            });
        },
    };
}

export default {
    plugins: [manifestFile()],
    resolve: {
        alias: [
            // the model and the option of the chart page, compiled in instead of written anew
            {
                find: '@echarts-chart',
                replacement: fileURLToPath(new URL('../src-chart/src/Components', import.meta.url)),
            },
            // the themes need `registerTheme` only, not the full API of echarts
            {
                find: /^echarts\/lib\/echarts(\.js)?$/,
                replacement: fileURLToPath(new URL('./src/echartsForThemes.ts', import.meta.url)),
            },
        ],
    },
    define: {
        'process.env.NODE_ENV': JSON.stringify('production'),
        __ECHARTS_WORDS__: JSON.stringify(elementWords()),
    },
    build: {
        target: 'es2022',
        outDir: './build',
        emptyOutDir: true,
        lib: {
            entry: './src/index.ts',
            formats: ['es'],
            fileName: (): string => MODULE_FILE,
        },
        rollupOptions: {
            output: {
                // one file: a host imports exactly one URL
                codeSplitting: false,
                // library mode keeps whitespace for the bundler of a consumer; this module is loaded as it is
                minify: true,
            },
        },
    },
};
