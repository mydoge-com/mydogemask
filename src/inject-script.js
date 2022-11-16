// API we expose to allow websites to detect & interact with extension
window.doge = {
  isMyDogeMask: true,
  getAddress: () => {
    // TODO
  },
  getBalance: () => {
    // TODO
  },
  requestTransaction: () => {
    window.postMessage({ type: "FROM_PAGE", message: "requestTransaction", data: {} });
  },
};
const initEvent = new Event("doge#initialized");
window.dispatchEvent(initEvent);