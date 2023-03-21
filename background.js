// chrome.webNavigation.onCompleted.addListener(function(details) {
//     console.log('New URL loaded:', details.url);
// });

chrome.tabs.onUpdated.addListener(
    function(tabId, changeInfo, tab) {
      // read changeInfo data and do something with it
      // like send the new url to contentscripts.js
      if (changeInfo.url) {
        chrome.tabs.sendMessage( tabId, {
          message: 'hello!',
          url: changeInfo.url
        })
      }
    }
);

chrome.storage.onChanged.addListener((changes, namespace) => {
    let newToxicity = changes;
    console.log(newToxicity);

    let options = {
        active: true,
        currentWindow: true
    }

    chrome.tabs.query(options, function(tabs) {
        let activeTabId = tabs[0].id;
        console.log(activeTabId);
        let msg = {
            message: "new toxicity!"
        };
        chrome.tabs.sendMessage(activeTabId, msg);
    })

})
