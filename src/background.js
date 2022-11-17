// // Add a Send Tip button on mydoge.com
// chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
//   if (tab.url && tab.url.includes("mydoge.com")) {
//     if (changeInfo.status === "complete") {
//       const tabs = await chrome.tabs.query({ active: true });
//       let url = tabs[0].url;

//       chrome.tabs.sendMessage(tabId, {
//         type: "dogecoin",
//         url: url,
//       });
//     }
//   }
// });

// Listen to taskbar click - if onBoarding not complete the show onBoarding
chrome.action.onClicked.addListener(() => {
  chrome.storage.local.get('onBoardingComplete', function(result) {
    if(result.onBoardingComplete !== true){
      chrome.tabs.create({ url: chrome.runtime.getURL('home.html') });
    }
  });
});

// function to call once onBoarding is completed
function onBoardingComplete(){    
  chrome.storage.local.set({onBoardingComplete: true}, function() {
    console.log('onBoardingComplete is set to true');
  });
  chrome.action.setPopup({
      popup: 'popup.html'
  });
}

// On first install, open home screen in new tab
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('home.html') });
  }
});

// onRequestTransaction: Launch notification popup
function onRequestTransaction({ data = {}, sendResponse } = {}) {
  chrome.windows.getCurrent((w) => {
    const width = 360;
    const height = 540;

    chrome.windows.create(
      {
        url: `notification.html?amount=${data.amount}`,
        type: 'popup',
        width,
        height,
        left: w.width + w.left - width,
        top: 0,
      },
      (newWindow) => {
        console.log(
          `can use ${newWindow.id} to set up listener for transaction success/fail maybe?`
        );
        if (sendResponse) sendResponse('success');
      }
    );
  });
}

// Listen to messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message?.message) return;
  switch (message.message) {
    case 'requestTransaction':
      onRequestTransaction({ data: message.data, sendResponse });
      break;
    default:
  }
});
