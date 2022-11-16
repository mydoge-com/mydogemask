(() => {
  let headerRow;
  let userName;

  chrome.runtime.onMessage.addListener((obj, sender, response) => {    
    const { type, value, url } = obj;
    userName = url.split("/").pop();

    if (type === "dogecoin") {
      loadSendTip();
    }
  });
  
  const loadSendTip = async () => {
    const sendTipBtnExists = document.getElementsByClassName("sendTip-btn")[0];    

    if (!sendTipBtnExists) {
      const sendTipBtn = document.createElement("img");

      sendTipBtn.src = chrome.runtime.getURL("assets/sendtip.png");
      sendTipBtn.className = "sendTip-btn";
      sendTipBtn.title = "Send Tip";

      headerRow = document.getElementsByClassName("r-1knelpx")[0];
      headerRow.appendChild(sendTipBtn);
      sendTipBtn.addEventListener("click", sendTipEventHandler);      
    }
  };

  const sendTipEventHandler = async () => {
    alert("Send Tip Pressed for User " + userName);
  };

})();