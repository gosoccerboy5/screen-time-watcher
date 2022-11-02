function endAll() {
    document.body.innerHTML = `<style>
    center {
        margin-top: 10%;
        font-size: 1.5rem;
    }
    a {
        color: blue;
    }
    a:active {
        color: red;
    }
    body {
        font-family: sans-serif;
    }
    </style>
    <center>This page was blocked by the "Screen Time Watcher" extension.
    <br>
    <a href="${browser.runtime.getURL("web/options.html")}" target="_blank">Options page</a></center>`;
    document.querySelector("a").addEventListener("click", e => {
        e.preventDefault();
        browser.runtime.sendMessage({optionsPage: true});
    });
    document.close();
}

function isMatch(urls) {
    return urls.some(url => (new RegExp("^(https?://(www\.)?)?" + (url.replace(/[-\/\\^$+?.()|[\]{}]/g, '\\$&').replace("*", ".*?")))).test(location.href));
}

browser.storage.local.get(["urls", "timeLeft", "blacklistedUrls"]).then(res => {
    if ((res["timeLeft"] <= 0 && isMatch(res["urls"])) || isMatch(res["blacklistedUrls"])) {
        endAll();
    }
});

browser.runtime.onMessage.addListener(function(message, sender, respond) {
    if (message["end"] === true) {
        endAll();
    }
});
