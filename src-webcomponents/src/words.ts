/**
 * The words the element shows, in every language of ioBroker. The build picks them out of `src/i18n/<lang>.json`
 * (`ELEMENT_WORDS` in `constants.ts`); the words of the settings stay in the manifest.
 */
declare const __ECHARTS_WORDS__: Record<string, Record<string, string>>;

/**
 * A word in a language, English if it has none
 *
 * @param lang the language of the ioBroker system
 * @param key the key in `src/i18n/<lang>.json`
 */
export function word(lang: string, key: string): string {
    return __ECHARTS_WORDS__[lang]?.[key] || __ECHARTS_WORDS__.en?.[key] || key;
}
