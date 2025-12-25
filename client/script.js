let currentRoom = null;

const socket = io();
let joined = false;


function evaluateAuction() {
  if (!currentRoom) {
    alert("Room code not found");
    return;
  }
  socket.emit("evaluate-room", currentRoom);
}
console.log("Current Room:", currentRoom);

function join() {
  if (joined) return;

  const name = document.getElementById("name").value || "Player";
  const roomInput = document.getElementById("roomCode");

  if (roomInput && roomInput.value) {
    currentRoom = roomInput.value.trim().toUpperCase();
  }

  socket.emit("join", name);
  joined = true;
}



socket.on("room-created", code => {
  currentRoom = code;

  const badge = document.getElementById("roomBadge");
  badge.innerText = "Room Code: " + code;
  badge.style.display = "block";
});



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

socket.on("teams-update", data => {
  const panel = document.getElementById("teamPanel");
  panel.innerHTML = "";

  Object.values(data.purse).forEach((purse, i) => {
    const div = document.createElement("div");
    div.innerHTML = `<span>Team ${i+1}</span><span>₹${purse} Cr</span>`;
    panel.appendChild(div);
// ===== AUCTION EVALUATION RESULT =====
socket.on("evaluation-result", results => {
  const winner = Object.entries(results)
    .sort((a, b) => b[1] - a[1])[0];

  alert(`🏆 Predicted Winner: ${winner[0]} (Score: ${winner[1]})`);
});

  });
});
