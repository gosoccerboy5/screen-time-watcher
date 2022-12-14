const $ = document.querySelector.bind(document);

const urlList = $("#limited");
const whitelisted = $("#whitelisted");
const blacklisted = $("#blacklisted");

function optionEl(val = "") {
  let div = document.createElement("div");
  div.innerHTML = `<br><input class='url' placeholder='New url...' value=${val}></input> <button class='delete'>&#10006;</button>`;
  div.querySelector(".delete").addEventListener("click", function () {
    div.parentElement.removeChild(div);
  });
  return div;
}
const dialog = function(message) {
  let div = document.createElement("div");
  div.innerHTML = `<span style="font-size:150%;"><button class="ok">&#10006;</button><div>Alert</div></span><hr><span>${message}</span>`;
  div.className = "dialog";
  document.body.append(div);
  document.body.className = "has-modal";
  return new Promise(resolve => {
    div.querySelector(".ok").addEventListener("click", function () {
      div.parentElement.removeChild(div);
      document.body.className = document.body.className.replace(/\bhas-modal\b/, "");
      resolve();
    });
  });
};
const input = function (message, password=false) {
  let div = document.createElement("div");
  div.innerHTML = `<span>${message}</span><br><input${password ? ' type="password"' : ""}></input><button class="submit">Submit</button>`;
  div.className = "dialog";
  document.body.append(div);
  document.body.className = "has-modal";
  let input = div.querySelector("input"), submit = div.querySelector(".submit");
  input.focus();
  input.addEventListener("keypress", evt => {
    if (evt.key === "Enter") submit.click();
  });
  return new Promise(resolve => {
    submit.addEventListener("click", function () {
      div.parentElement.removeChild(div);
      document.body.className = document.body.className.replace(/\bhas-modal\b/, "");
      resolve(input.value);
    });
  });
};

browser.storage.local.get(["urls", "totalTime", "whitelistedUrls", "blacklistedUrls"], ({ urls, totalTime, whitelistedUrls, blacklistedUrls }) => {
  urls.forEach(url => {
    urlList.append(optionEl(url));
  });
  whitelistedUrls.forEach(url => {
    whitelisted.append(optionEl(url));
  });
  blacklistedUrls.forEach(url => {
    blacklisted.append(optionEl(url));
  });
  $("#hrs").value = new Date(totalTime * 1000).getUTCHours();
  $("#min").value = new Date(totalTime * 1000).getUTCMinutes();
});

$("#save").addEventListener("click", function() {
  input("Please enter your password to make changes", true).then(password => {
    browser.runtime.sendMessage({
      "urls": [...urlList.children].map(div => div.querySelector(".url").value).filter(url => url !== ""),
      "time": $("#hrs").value * 3600 + $("#min").value * 60,
      "blacklistedUrls": [...blacklisted.children].map(div => div.querySelector(".url").value).filter(url => url !== ""),
      "whitelistedUrls": [...whitelisted.children].map(div => div.querySelector(".url").value).filter(url => url !== ""),
      password,
    }).then(dialog);
  });
});

$("#addlimited").addEventListener("click", function() {
  let el = optionEl();
  urlList.append(el);
  el.querySelector("input").focus();
});

$("#addwhitelisted").addEventListener("click", function() {
  let el = optionEl();
  whitelisted.append(el);
  el.querySelector("input").focus();
});

$("#addblacklisted").addEventListener("click", function() {
  let el = optionEl();
  blacklisted.append(el);
  el.querySelector("input").focus();
});

browser.storage.local.get("password", ({password}) => {
  if (password === null) {
    input("Since this is your first time here, please make sure to make a password.", true).then(pw => {
      browser.runtime.sendMessage({
        password: pw,
      }).then(dialog);
    })
  }
});
