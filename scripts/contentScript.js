import { MESSAGE_TYPES } from './helpers/constants';

(() => {
  // window.addEventListener('message', (event) => {
  //   console.log('from inject-script.js', event);
  // });
  const initEvent = new Event('doge#initialized');
  window.dispatchEvent(initEvent);

  // const loadSendTipFloating = async () => {
  //   const sendTipFloatingBtnExists = document.getElementsByClassName(
  //     'sendTipFloating-btn'
  //   )[0];

  //   if (!sendTipFloatingBtnExists) {
  //     const sendTipBtn = document.createElement('img');

  //     sendTipBtn.src = chrome.runtime.getURL('assets/sendtip.png');
  //     sendTipBtn.className = 'sendTipFloating-btn';
  //     sendTipBtn.title = 'Tip This Site';
  //     sendTipBtn.style =
  //       'bottom: 10px; right: 10px; position:fixed; z-index: 9999;';
  //     document.body.appendChild(sendTipBtn);
  //     sendTipBtn.addEventListener('click', sendTipEventHandler);
  //   }
  // };

  // const sendTipEventHandler = async () => {
  //   onRequestTransaction({});
  // };

  // TODO: Inject tip button into body if website has dogecoin meta tag
  // Tip button should be floating (absolutely positioned, bottom right maybe?)
  // const metas = document.getElementsByTagName('meta');
  // for (let i = 0; i < metas.length; i++) {
  //   const name = metas[i].getAttribute('name');
  //   if (name === 'dogecoin') {
  //     loadSendTipFloating();
  //     const content = metas[i].getAttribute('content');
  //     alert(`Name: ${name} content: ${content}`);
  //   }
  // }

  // Inject doge API to all websites
  function injectScript(filePath, tag) {
    const node = document.getElementsByTagName(tag)[0];
    const script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', filePath);
    node.appendChild(script);
  }

  injectScript(chrome.runtime.getURL('scripts/inject-script.js'), 'body');

  // // Listen to messages from injected script
  // function onRequestTransaction(data) {
  //   chrome.runtime.sendMessage(
  //     { message: 'requestTransaction', data },
  //     (response) => {
  //       console.log(response);
  //     }
  //   );
  // }

  // Handle connection requests from injected script by sending a message to the background script. The background script will handle the connection request and send a response back to the content script.
  function onRequestConnection({ type, data }) {
    chrome.runtime.sendMessage(
      {
        message: type,
        data,
      },
      (response) => {
        if (!response) {
          window.postMessage({ type, error: true }, origin);
        }
      }
    );
  }

  // Listen to messages from injected script and pass to the respective handler functions tro forward to the background script
  window.addEventListener(
    'message',
    ({ source, data: { type, data } }) => {
      // only accept messages from the current tab
      if (source !== window) return;
      switch (type) {
        case MESSAGE_TYPES.CONNECTION_REQUEST:
          onRequestConnection({ type, data });
          break;
        default:
      }
    },
    false
  );

  // Listen to messages from the background script and pass to the injected script
  chrome.runtime.onMessage.addListener(({ type, data }, sender) => {
    // Confirm that message is coming from the extension
    if (sender.id !== chrome.runtime.id) return;
    // Pass message to injected script
    window.postMessage({ type, data }, origin);
  });
})();
