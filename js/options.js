const $ = document.querySelector.bind(document);

const urlList = $("#whitelisted");

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
  div.innerHTML = `<div><button class="ok">&#10006;</button><div>Alert</div><hr><span>${message}</span><div>`;
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
const input = function (message) {
  let div = document.createElement("div");
  div.innerHTML = `<span>${message}</span><br><input></input><button class="submit">Submit</button>`;
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

browser.storage.local.get(["urls", "totalTime"], ({ urls, totalTime }) => {
  urls.forEach(url => {
    urlList.append(optionEl(url));
  });
  $("#hrs").value = new Date(totalTime * 1000).getUTCHours();
  $("#min").value = new Date(totalTime * 1000).getUTCMinutes();
});

$("#save").addEventListener("click", function() {
  input("Please enter your password to make changes").then(password => {
    browser.runtime.sendMessage({
      "urls": [...urlList.children].map(div => div.querySelector(".url").value).filter(url => url !== ""),
      "time": $("#hrs").value * 3600 + $("#min").value * 60,
      password,
    }).then(dialog);
  });
});

$("#add").addEventListener("click", function() {
  let el = optionEl();
  urlList.append(el);
  el.querySelector("input").focus();
});

browser.storage.local.get("password", ({password}) => {
  if (password === null) {
    input("Since this is your first time here, please make sure to make a password.").then(pw => {
      browser.runtime.sendMessage({
        password: pw,
      }).then(res => {
        console.log(res);
        dialog(res);
      });
    })
  }
});
