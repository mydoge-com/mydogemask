chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tab.url && tab.url.includes("mydoge.com")) {
    if (changeInfo.status === 'complete') {
      const tabs = await chrome.tabs.query({ active: true });
      let url = tabs[0].url;

      chrome.tabs.sendMessage(tabId, {
          type: "dogecoin",
          url: url
      });
    }
  }
});