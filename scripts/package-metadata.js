'use strict';

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const root = path.resolve(__dirname, '..');
const directory = path.join(root, 'dist');
fs.mkdirSync(directory, { recursive: true });
const destination = path.join(directory, 'product-reviews-metadata.zip');
const output = fs.createWriteStream(destination);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', function () {
    console.log('Created dist/product-reviews-metadata.zip (' + archive.pointer() + ' bytes).');
});
output.on('error', function (error) { throw error; });
archive.on('error', function (error) { throw error; });
archive.on('warning', function (error) { throw error; });
archive.pipe(output);
archive.file(path.join(root, 'metadata/product-reviews/meta/custom-objecttype-definitions.xml'), {
    name: 'product-reviews/meta/custom-objecttype-definitions.xml'
});
archive.file(path.join(root, 'metadata/product-reviews/meta/system-objecttype-extensions.xml'), {
    name: 'product-reviews/meta/system-objecttype-extensions.xml'
});
archive.finalize();
