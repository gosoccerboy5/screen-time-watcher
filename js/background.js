browser.runtime.onInstalled.addListener(() => {
  let time = 3 * 60 * 60;
  browser.storage.local.set({
    urls: [
      "example.com",
    ], 
    password: null,
    totalTime: time,
    timeLeft: time,
  });
  browser.tabs.create({
    url:  `../web/options.html`
  }, null);
});

async function sha256(message) {
  // https://stackoverflow.com/a/48161723/15938577 😊
  const msgBuffer = new TextEncoder().encode(message);                    
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
let running = true;

browser.runtime.onMessage.addListener(function(message, sender, respond) {
  if (message["optionsPage"]) {
    browser.tabs.create({url: "../web/options.html"});
    return;
  }
  browser.storage.local.get(["timeLeft", "totalTime", "password"]).then(({timeLeft, totalTime, password}) => {
    if (password === null) {
      sha256(message["password"]).then(hash => {
        browser.storage.local.set({password: hash});
      });
      respond("Password successfully set!");
      return true;
    }
    sha256(message["password"]).then(hash => {
      if (hash !== password) {
        respond("Settings could not be updated: password incorrect");
        return true;
      }
      if (message["urls"] instanceof Array) {
        browser.storage.local.set({
          urls: message["urls"]
        });
      }
      if (typeof message["time"] === "number") {
        browser.storage.local.set({
          totalTime: message["time"],
          timeLeft: message["time"] + timeLeft - totalTime,
        });
        running = true;
      }
      respond("Settings successfully updated!");
    });
  });
  return true;
});

let ports = [];
browser.runtime.onConnect.addListener(function(p) {
  ports.push(p);
  p.onDisconnect.addListener(function() {
    ports.splice(ports.indexOf(p));
  });
});

function isMatch(urls, current) {
  return urls.some(url => (new RegExp("^https?://(www\.)?" + (url.replace(/[-\/\\^$+?.()|[\]{}]/g, '\\$&').replace("*", ".*?")))).test(current));
}

function update() {
  Promise.all([browser.tabs.query({active: true, currentWindow: true}), browser.storage.local.get(["urls", "timeLeft"])]).then(res => {
    let urls = res[1].urls;
    let timeLeft = res[1].timeLeft;
    if (timeLeft <= 0) { // We have run out of time for today!
      chrome.tabs.query({}, tabs => {
        tabs.forEach(tab => {
          if (isMatch(urls, tab.url)) {
            browser.tabs.sendMessage(tab.id, {end: true});
          }
        });
      });
      browser.notifications.create("", {
        type: "basic",
        title: "Alert",
        message: "Out of Screen Time!",
        iconUrl: "../images/icon128.png",
      });
      clearInterval(interval);
      running = false;
      return;
    }
    let currentTab = res[0][0];
    if (urls.length === 0 || currentTab === undefined) {
      return;
    }
    if (isMatch(urls, currentTab.url)) {
      timeLeft -= 1;
      browser.storage.local.set({timeLeft}).then(res => {
        ports.forEach(port => port?.postMessage({left: timeLeft}));
      });
    }
  });
}

let interval = setInterval(update, 1000);

let msTillMidnight = (new Date().setHours(24, 0, 0, 0) - Date.now());

function restart() {
  browser.storage.local.get("totalTime").then(res => {
    browser.storage.local.set({timeLeft: res["totalTime"]});
  });
  if (!running) {
    running = true;
    interval = setInterval(update, 1000);
  }
}

new Promise(resolve => setTimeout(resolve, msTillMidnight)).then(() => {
  restart();
  setInterval(restart, 1000 * 60 * 60 * 24);
});
