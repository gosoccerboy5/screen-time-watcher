let myPort = browser.runtime.connect({name:"time-left"});
let timeEl = document.querySelector("#remaining");

function format(s) {
  let date = new Date(s * 1000), hours = date.getUTCHours(), minutes = date.getUTCMinutes(), seconds = date.getUTCSeconds(), 
    all = [hours, minutes, seconds].map(String).map(str => str.length >= 2 ? str : "0" + str);
  return all.join(":")
}

let ctx = document.querySelector("#canvas").getContext("2d");

function clock(ctx, x, y, radius, percentUsed) {
  ctx.fillStyle = window.getComputedStyle(document.body).backgroundColor;
  ctx.rect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fill();
  function toRadians(deg) {
  	return deg * Math.PI / 180;
	}
  ctx.beginPath();
  ctx.fillStyle = "black";
  ctx.arc(x, y, radius+1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.fillStyle = "lightgrey";
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "pink";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, radius, toRadians(270), toRadians(percentUsed*360/100 - 90));
  ctx.lineTo(x,y);
  ctx.fill();
  ctx.fillStyle = "black";
  ctx.stroke();
}

myPort.onMessage.addListener((message) => {
  update(message["left"], message["totalTime"]);
});

browser.storage.local.get(["timeLeft", "totalTime"]).then(res => {
  update(res["timeLeft"], res["totalTime"]);
});

function update(timeLeft, totalTime) {
  timeEl.innerText = format(timeLeft);
  clock(ctx, 50, 50, 30, ((totalTime-timeLeft)*100)/(totalTime) + 0.01);
}
