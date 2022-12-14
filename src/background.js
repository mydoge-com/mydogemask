import { getStorage } from './hooks/useEncryptedStorage';
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

// On first install, open onboarding screen in new tab
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('onboarding.html') });
  }
});

chrome.runtime.addListener(({ reason }) => {
  console.log({ reason });
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
        top: w.top,
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
    case 'createWallet':
      console.log('message data', message.data);
      break;
    default:
  }
});
