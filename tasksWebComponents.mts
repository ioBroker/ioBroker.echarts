/**
 * Copyright 2026 bluefox <dogafox@gmail.com>
 *
 * MIT License
 *
 * Builds the web component `<iob-echarts-chart>` of `src-webcomponents/`: one ES module and its manifest, copied to
 * `admin/webcomponents/` (`common.webComponents` in io-package.json). vis-2, devices, Aura and admin read them from
 * `/adapter/echarts/webcomponents/`. The build writes the manifest and fails if it does not pass `checkManifest`.
 */
import { buildReact, copyFiles, deleteFoldersRecursive, npmInstall } from '@iobroker/build-tools';

const SRC = 'src-webcomponents/';
const src = `${import.meta.dirname}/${SRC}`;

deleteFoldersRecursive(`${import.meta.dirname}/admin/webcomponents`);
deleteFoldersRecursive(`${src}build`);

try {
    await npmInstall(src);
    await buildReact(src, { rootDir: src, vite: true });
    copyFiles([`${SRC}build/*.js`, `${SRC}build/*.json`], 'admin/webcomponents');
} catch (e) {
    console.error(`Cannot build the web components: ${e}`);
    process.exit(1);
}
