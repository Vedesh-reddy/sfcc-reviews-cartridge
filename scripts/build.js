'use strict';

const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const sass = require('sass');

const root = path.resolve(__dirname, '..');
const cartridge = path.join(root, 'cartridges/plugin_productreviews/cartridge');
const output = path.join(cartridge, 'static/default');

// The storefront provides jQuery globally; this bundle contains only review behavior.
const compiler = webpack({
    mode: 'production',
    entry: path.join(cartridge, 'client/default/js/productReviews.js'),
    output: { path: path.join(output, 'js'), filename: 'productReviews.js' }
});

compiler.run(function (error, stats) {
    compiler.close(function (closeError) {
        if (error || closeError || stats.hasErrors()) {
            console.error(error || closeError || stats.toString({ all: false, errors: true }));
            process.exitCode = 1;
            return;
        }
        try {
            const css = sass.compile(path.join(cartridge, 'client/default/scss/productReviews.scss'), {
                style: 'compressed'
            });
            fs.mkdirSync(path.join(output, 'css'), { recursive: true });
            fs.writeFileSync(path.join(output, 'css/productReviews.css'), css.css + '\n');
            console.log('Built productReviews.js and productReviews.css in cartridge/static/default.');
        } catch (buildError) {
            console.error(buildError.message);
            process.exitCode = 1;
        }
    });
});
