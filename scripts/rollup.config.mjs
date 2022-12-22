import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import injectProcessEnv from 'rollup-plugin-inject-process-env';
import nodePolyfills from 'rollup-plugin-polyfill-node';

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
    ],
  },
];
