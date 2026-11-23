"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pictureAnswer = pictureAnswer;
/**
 * The answer of `send` with the fields of rule 7 of the shared catalog of ioBroker.assistant (pictures and files):
 * `contentType`, and `file` when the picture was stored with `fileName`. `data` stays a data URL as before, so
 * that scripts which put it into an <img> keep working.
 *
 * @param data the picture as a data URL
 * @param namespace e.g. echarts.0
 * @param fileName the path in the files of the instance the picture was stored under
 */
function pictureAnswer(data, namespace, fileName) {
    const contentType = /^data:([^;,]+)/.exec(data)?.[1] || 'application/octet-stream';
    const answer = { data, contentType };
    if (fileName) {
        answer.file = `${namespace}/${fileName.replace(/^\/+/, '')}`;
    }
    return answer;
}
//# sourceMappingURL=picture.js.map