# MyDogeMask

## 🚀 Quick start

- Use Node.js version 18
- Use Yarn installed by NPM only: `npm install --global yarn`
- Install packages with `yarn install`.
- Create a file named .env at the root of the project and add the following line to the .env file, replacing "YOUR_API_KEY" with your actual NowNodes API key: <br/>
  `NEXT_PUBLIC_NOWNODES_API_KEY=YOUR_API_KEY`
- Run `yarn start` to start the development server
- Open [http://localhost:3000](http://localhost:3000) to view the development build in your browser

## Building the extension

- Run `yarn build` to build the app for production to the `build` folder.<br />
  It correctly bundles React in production mode and optimizes the build for the best performance.

- Install [Extensions Reloader](https://chrome.google.com/webstore/detail/extensions-reloader/fimgfedafeadlieiabdeeaodndnlbhid?hl=en) Chrome extension to enable automatic extension reload after every build.

- Run `yarn watch` to build and reload the extension with every file change.

## Integration

- See our [ingegration example](https://github.com/mydoge-com/mydogemask-next-example) for instrunctions on how to use MyDogeMask to accept Dogecoin payments on your own website.
