// Build configuration for Rollup.js. Compiles dependencies of background.js, contentScript.js and inject-script.js into respective single files.

import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import injectProcessEnv from 'rollup-plugin-inject-process-env';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import { uglify } from "rollup-plugin-uglify";

export default [
  {
    input: 'background.js',
    output: {
      format: 'iife',
      dir: './compiled',
    },
    plugins: [
      commonjs(),
      json(),
      injectProcessEnv({
        NODE_ENV: 'production',
      }),
      nodePolyfills(),
      resolve({
        browser: true,
      }),
      uglify(),
    ],
  },
  {
    input: 'contentScript.js',
    output: {
      format: 'iife',
      dir: './compiled',
    },
    plugins: [
      commonjs(),
      json(),
      injectProcessEnv({
        NODE_ENV: 'production',
      }),
      nodePolyfills(),
      resolve({
        browser: true,
      }),
      uglify(),
    ],
  },
  {
    input: 'inject-script.js',
    output: {
      format: 'iife',
      dir: './compiled',
    },
    plugins: [
      commonjs(),
      json(),
      injectProcessEnv({
        NODE_ENV: 'production',
      }),
      nodePolyfills(),
      resolve({
        browser: true,
      }),
      uglify(),
    ],
  },
];
