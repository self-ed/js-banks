let utils = require('./utils');

module.exports = {
    read(file, url, encoding) {
        file = '../../data/html/' + file + '.html';
        if (utils.fileExists(file)) {
            return read('READ', file, utils.readFile);
        }
        const html = read('GET', url, url => utils.readURL(url, encoding));
        utils.writeFile(file, html);
        return html;
    },

    download(file, url) {
        file = '../../data/binary/' + file;
        if (utils.fileExists(file)) {
            return read('READ', file, file => utils.readFile(file, 'binary'));
        }

        const content = read('GET', url, utils.downloadURL);
        utils.writeFile(file, content, 'binary');
        return content;
    }
};

function read(operation, source, reader) {
    const startTime = new Date();
    const result = reader(source);
    console.log(operation, source, (new Date() - startTime) + 'ms');
    return result;
}