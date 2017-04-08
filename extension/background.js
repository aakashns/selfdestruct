var tabsInfo = {};

var DEBUG = false;

function log() {
  DEBUG && console.log.apply(console, arguments);
}

// How to long to wait before closing inactive tabs.
var THRESHOLD = 60 * 60 * 1000;
// var THRESHOLD = 25 * 1000;

// How often to check whether any tabs need to be closed.
var INTERVAL = 60 * 1000;
// var INTERVAL = 10 * 1000;

function checkAndCloseTabs() {
  log("Will check if any tabs need to be closed now");
  var keys = [];
  for (var id in tabsInfo) {
    keys.push(id);
  }
  keys.forEach(function(idStr) {
    var tabId = parseInt(idStr);
    log(
      "Checking for tab with id " + idStr,
      new Date(tabsInfo[idStr].lastActive).toString()
    );
    chrome.tabs.get(tabId, function(tab) {
      if (!tab) {
        log("Tab with ID " + tabId + " went missing!");
        delete tabsInfo[idStr];
      } else if (tab.active) {
        log(
          "Tab with ID" + tabId + " is currently active. Updating lastActive"
        );
        tabsInfo[idStr].lastActive = now();
      } else if (!tabsInfo[idStr].lastActive) {
        log(
          "Can't find the last active time for tab with ID " +
            tabId +
            ". Setting it to now"
        );
        tabsInfo[idStr].lastActive = now();
      } else if (tabsInfo[idStr].pin) {
        log(
          "The tab with id " +
            idStr +
            " is currently pinned and will not be removed."
        );
      } else if (now() > tabsInfo[idStr].lastActive + THRESHOLD) {
        log(
          "Tab with ID " +
            tabId +
            " has been inactive for " +
            Math.round((now() - tabsInfo[idStr].lastActive) / 1000) +
            " seconds. Closing it!"
        );
        chrome.tabs.remove([tabId]);
      } else {
        const minutesLeft = Math.floor(
          (tabsInfo[idStr].lastActive + THRESHOLD - now()) / 60000
        );
        log(
          "Tab with ID " +
            idStr +
            " will be closed in " +
            minutesLeft +
            " minutes."
        );
      }
    });
  });
}

var interval = setInterval(checkAndCloseTabs, INTERVAL);

function now() {
  return new Date().getTime();
}

chrome.tabs.query({}, function(tabs) {
  log("Getting the list of tabs..");
  tabs.forEach(function(tab) {
    tabsInfo[tab.id] = {
      lastActive: now()
    };
  });
});

chrome.tabs.onCreated.addListener(function(tab) {
  log("Adding a new tab with ID ", tab.id);
  tabsInfo["" + tab.id] = {
    lastActive: now()
  };
});

chrome.tabs.onRemoved.addListener(function(tabId) {
  log("Removing the tab with ID ", tabId);
  delete tabsInfo[tabId];
});

chrome.tabs.onActivated.addListener(function(activeInfo) {
  var tabId = "" + activeInfo.tabId;
  log("Tab with ID " + tabId + " was activated.");
  if (!tabsInfo[tabId]) {
    tabsInfo[tabId] = {};
  }
  tabsInfo[tabId].lastActive = now();
});

chrome.browserAction.onClicked.addListener(function(tab) {
  var idStr = "" + tab.id;
  if (tabsInfo[idStr].pin) {
    log("Unpinning tab " + idStr);
    tabsInfo[idStr].pin = false;
    chrome.browserAction.setIcon({ path: "images/bomb.png", tabId: tab.id });
  } else {
    log("Pinning tab " + idStr);
    tabsInfo[idStr].pin = true;
    chrome.browserAction.setIcon({ path: "images/pin.png", tabId: tab.id });
  }
});
