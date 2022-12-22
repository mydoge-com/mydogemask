import resolve from '@rollup/plugin-node-resolve';

export default [
  {
    input: 'background.js',
    output: {
      format: 'iife',
      dir: './compiled',
    },
    plugins: [resolve()],
  },
  {
    input: 'contentScript.js',
    output: {
      format: 'module',
      dir: './compiled',
    },
    plugins: [resolve()],
  },
  {
    input: 'inject-script.js',
    output: {
      format: 'module',
      dir: './compiled',
    },
    plugins: [resolve()],
  },
];
