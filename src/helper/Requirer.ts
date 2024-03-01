import * as path from 'path';
import * as glob from 'glob';
import _ from 'lodash';

export function requirer(pattern): any[] {
    let files = glob.sync(pattern);
    files = files.map(function (currentFile) {
        var fileName = path.basename(currentFile);
        fileName = fileName.slice(0, -3);
        const getFile = require(path.relative(__dirname, currentFile));
        return getFile[fileName];
    });

    return files;
}
