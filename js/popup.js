let myPort = browser.runtime.connect({name:"time-left"});
let timeEl = document.querySelector("#remaining");

function format(s) {
  let date = new Date(s * 1000), hours = date.getUTCHours(), minutes = date.getUTCMinutes(), seconds = date.getUTCSeconds(), 
    all = [hours, minutes, seconds].map(String).map(str => str.length >= 2 ? str : "0" + str);
  return all.join(":")
}
myPort.onMessage.addListener((message) => {
  timeEl.innerText = format(message["left"]);
});

browser.storage.local.get("timeLeft").then(res => {
  timeEl.innerText = format(res["timeLeft"]);
});
