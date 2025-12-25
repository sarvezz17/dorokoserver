
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static("client"));

const MAX_USERS = 14;
const BID_TIME = 15;

let game = {
  users: {},
  currentBid: 0,
  highestBidder: null,
  timer: null,
  timeLeft: BID_TIME
};

function resetTimer() {
  if (game.timer) clearInterval(game.timer);
  game.timeLeft = BID_TIME;
  game.timer = setInterval(() => {
    game.timeLeft--;
    io.emit("timer", game.timeLeft);
    if (game.timeLeft <= 0) {
      clearInterval(game.timer);
      io.emit("sold", {
        user: game.highestBidder || "No one",
        price: game.currentBid
      });
      game.currentBid = 0;
      game.highestBidder = null;
      io.emit("bidUpdate", { amount: 0, user: "-" });
    }
  }, 1000);
}

io.on("connection", socket => {
  if (Object.keys(game.users).length >= MAX_USERS) {
    socket.emit("full");
    socket.disconnect();
    return;
  }

  socket.on("join", name => {
    game.users[socket.id] = name || "Player";
    io.emit("users", Object.values(game.users));
  });

  socket.on("bid", amount => {
    if (amount <= game.currentBid) return;
    game.currentBid = amount;
    game.highestBidder = game.users[socket.id];
    io.emit("bidUpdate", { amount, user: game.highestBidder });
    resetTimer();
  });

  socket.on("disconnect", () => {
    delete game.users[socket.id];
    io.emit("users", Object.values(game.users));
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Auction server running on port", PORT);
});
