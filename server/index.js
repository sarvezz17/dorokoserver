const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const { evaluateTeam } = require("./evaluator");


const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ✅ Serve frontend files
app.use(express.static(path.join(__dirname, "../client")));

// ✅ Serve homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/index.html"));
});

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

// ===== ROOM SYSTEM (ADD-ON) =====
const rooms = {};

function createRoom() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

io.on("connection", socket => {
  socket.on("evaluate-room", roomCode => {
  const room = rooms[roomCode];
  if (!room) return;

  const results = {};

  for (let team in room.playersBought) {
    results[team] = evaluateTeam(
      room.playersBought[team],
      room.purse[team]
    );
  }

  io.to(roomCode).emit("evaluation-result", results);
});


  socket.on("create-room", () => {
    const code = createRoom();
    rooms[code] = {
      host: socket.id,
      teams: {},
      purse: {},
      playersBought: {},
      currentPlayer: null,
      status: "WAITING"
    };
    socket.join(code);
    socket.emit("room-created", code);
  });

  socket.on("join-room", ({ roomCode, teamName }) => {
    if (!rooms[roomCode]) return;

    rooms[roomCode].teams[socket.id] = teamName;
    rooms[roomCode].purse[teamName] = 120;
    rooms[roomCode].playersBought[teamName] = [];

    socket.join(roomCode);
    io.to(roomCode).emit("teams-update", rooms[roomCode]);
  });

});

