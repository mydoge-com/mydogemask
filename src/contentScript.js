(() => {
  const loadSendTipFloating = async () => {
    const sendTipFloatingBtnExists = document.getElementsByClassName(
      'sendTipFloating-btn'
    )[0];

    if (!sendTipFloatingBtnExists) {
      const sendTipBtn = document.createElement('img');

      sendTipBtn.src = chrome.runtime.getURL('assets/sendtip.png');
      sendTipBtn.className = 'sendTipFloating-btn';
      sendTipBtn.title = 'Tip This Site';
      sendTipBtn.style =
        'bottom: 10px; right: 10px; position:fixed; z-index: 9999;';
      document.body.appendChild(sendTipBtn);
      sendTipBtn.addEventListener('click', sendTipEventHandler);
    }
  };

  const sendTipEventHandler = async () => {
    onRequestTransaction({});
  };

  // TODO: Inject tip button into body if website has dogecoin meta tag
  // Tip button should be floating (absolutely positioned, bottom right maybe?)
  const metas = document.getElementsByTagName('meta');
  for (let i = 0; i < metas.length; i++) {
    const name = metas[i].getAttribute('name');
    if (name === 'dogecoin') {
      loadSendTipFloating();
      const content = metas[i].getAttribute('content');
      alert(`Name: ${name} content: ${content}`);
    }
  }

  // Inject doge API to all websites
  function injectScript(filePath, tag) {
    const node = document.getElementsByTagName(tag)[0];
    const script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', filePath);
    node.appendChild(script);
  }

  injectScript(chrome.runtime.getURL('static/js/inject-script.js'), 'body');

  // Listen to messages from injected script
  function onRequestTransaction(data) {
    chrome.runtime.sendMessage(
      { message: 'requestTransaction', data },
      (response) => {
        console.log(response);
      }
    );
  }

  window.addEventListener(
    'message',
    (event) => {
      // only accept messages from the current tab
      if (event.source !== window) return;

      if (event.data.type && event.data.type === 'FROM_PAGE') {
        chrome.runtime.sendMessage(event.data);
      }
    },
    false
  );
})();
