// Build configuration for Rollup.js. Compiles dependencies of background.js, contentScript.js and inject-script.js into respective single files.

import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import injectEnv from 'rollup-plugin-inject-env';
import injectProcessEnv from 'rollup-plugin-inject-process-env';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import { uglify } from 'rollup-plugin-uglify';

const common = {
  output: {
    format: 'iife',
    dir: './compiled',
  },
  moduleContext: {
    'node_modules/@mydogeofficial/dogecoin-js/dist/index.js': 'globalThis',
  },
  plugins: [
    resolve({
      browser: true,
      jsnext: true,
      preferBuiltins: true,
    }),
    commonjs(),
    json(),
    injectProcessEnv({
      NODE_ENV: 'production',
    }),
    injectEnv({ envFilePath: '../.env' }),
    nodePolyfills(),
    uglify(),
  ],
};

export default [
  {
    input: 'background.js',
    ...common,
  },
  {
    input: 'contentScript.js',
    ...common,
  },
  {
    input: 'inject-script.js',
    ...common,
  },
];
