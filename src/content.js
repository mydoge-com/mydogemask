(() => {
  let headerRow;
  let userName;

  // chrome.runtime.onMessage.addListener((obj, sender, response) => {    
  //   const { type, value, url } = obj;
  //   userName = url.split("/").pop();

  //   if (type === "dogecoin") {
  //     loadSendTip();
  //   }
  // });
  

  const loadSendTipFloating = async () => {
    const sendTipFloatingBtnExists = document.getElementsByClassName("sendTipFloating-btn")[0];    

    if (!sendTipFloatingBtnExists) {
      const sendTipBtn = document.createElement("img");

      sendTipBtn.src = chrome.runtime.getURL("assets/sendtip.png");
      sendTipBtn.className = "sendTipFloating-btn";
      sendTipBtn.title = "Tip This Site";
      sendTipBtn.style = "bottom:0;right:0;position:absolute;z-index: 9999; padding: 10px;"
      document.body.appendChild(sendTipBtn);
      sendTipBtn.addEventListener("click", sendTipEventHandler);      
    }
  };

  const loadSendTip = async () => {
    const sendTipBtnExists = document.getElementsByClassName("sendTip-btn")[0];    

    if (!sendTipBtnExists) {
      const sendTipBtn = document.createElement("img");

      sendTipBtn.src = chrome.runtime.getURL("assets/sendtip.png");
      sendTipBtn.className = "sendTip-btn";
      sendTipBtn.title = "Tip This Site";

      headerRow = document.getElementsByClassName("r-1knelpx")[0];
      headerRow.appendChild(sendTipBtn);
      sendTipBtn.addEventListener("click", sendTipEventHandler);      
    }
  };

  const sendTipEventHandler = async () => {
    onRequestTransaction({});
  };

  // TODO: Inject tip button into body if website has dogecoin meta tag
  // Tip button should be floating (absolutely positioned, bottom right maybe?)  
  let metas = document.getElementsByTagName('meta'); 
  for (var i=0; i<metas.length; i++) { 
    let name = metas[i].getAttribute("name");
    if(name === 'dogecoin'){
      loadSendTipFloating();
      let content = metas[i].getAttribute("content");
      alert("Name: " + name + " content: " + content);
    }
  }

  // Inject doge API to all websites
  function injectScript(file_path, tag) {
    var node = document.getElementsByTagName(tag)[0];
    var script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', file_path);
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

  window.addEventListener('message', function (event) {
    // only accept messages from the current tab
    if (event.source != window) return;

    if (event.data.type && (event.data.type == 'FROM_PAGE')) {
        chrome.runtime.sendMessage(event.data);
    }
}, false);

})();