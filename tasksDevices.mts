/**
 * Copyright 2023-2025 bluefox <dogafox@gmail.com>
 *
 * MIT License
 *
 * Builds the src-devices module-federation bundle that ioBroker.devices loads
 * to render an Echarts preset as a widget. Output ends up in `admin/dm-widgets/`,
 * which gets shipped with the adapter (see `files` in package.json).
 **/
import { deleteFoldersRecursive, npmInstall, copyFiles, buildReact } from '@iobroker/build-tools';

const SRC = 'src-devices/';
const src = `${import.meta.dirname}/${SRC}`;

deleteFoldersRecursive(`${import.meta.dirname}/admin/dm-widgets`);
deleteFoldersRecursive(`${src}build`);

try {
    await npmInstall(src);
    await buildReact(src, { rootDir: src, vite: true });
    copyFiles([`${SRC}build/customDevices.js`], 'admin/dm-widgets');
    copyFiles([`${SRC}build/assets/*.*`], 'admin/dm-widgets/assets');
    copyFiles([`${SRC}img/*.*`], 'admin/dm-widgets');
} catch (e) {
    console.error(`Cannot build devices widget: ${e}`);
    process.exit(1);
}
