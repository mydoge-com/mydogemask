module.exports = function babelConfig(api) {
  api.cache(true);
  return {
    presets: [
      [
        '@babel/preset-react',
        {
          // Use React 17 automatic JSX runtime.
          jsxRuntime: 'automatic',
        },
      ],
    ],
    plugins: ['@babel/plugin-proposal-optional-chaining'],
  };
};
