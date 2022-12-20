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
    default:
  }
});
