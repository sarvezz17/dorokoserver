
const socket = io();
let joined = false;

function join() {
  if (joined) return;
  const name = document.getElementById("name").value || "Player";
  socket.emit("join", name);
  joined = true;
}

socket.on("users", users => {
  document.getElementById("users").innerText = users.length;
});

socket.on("bidUpdate", data => {
  document.getElementById("bid").innerText = data.amount;
  if (data.user && data.user !== "-") {
    document.getElementById("log").innerHTML += `<p><b>${data.user}</b> bid ₹${data.amount} Cr</p>`;
  }
});

socket.on("timer", t => {
  document.getElementById("timer").innerText = t;
});

socket.on("sold", data => {
  document.getElementById("log").innerHTML += `<p>🔨 SOLD to <b>${data.user}</b> for ₹${data.price} Cr</p>`;
  document.getElementById("timer").innerText = 15;
});

socket.on("full", () => {
  alert("Game room is full (14 players).");
});

function bid(step) {
  const current = parseInt(document.getElementById("bid").innerText);
  socket.emit("bid", current + step);
}
