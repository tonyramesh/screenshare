const express = require("express");
const app = express();

let broadcasters = {};
const port = 4000;

const http = require("http");
const server = http.createServer(app);

const io = require("socket.io")(server);

app.use(express.static(__dirname + "/public"));

io.sockets.on("error", e => console.log(e));
io.sockets.on("connection", socket => {
  socket.on("broadcaster", (broadcasterId) => {
    broadcasters[broadcasterId] = socket.id;
    socket.broadcast.emit("broadcaster");
    socket.join(broadcasterId);
  });
  socket.on("watcher", (broadcasterId) => {
    socket.to(broadcasters[broadcasterId]).emit("watcher", socket.id);
    socket.join(broadcasterId);
  });
  socket.on("offer", (id, message) => {
    socket.to(id).emit("offer", socket.id, message);
  });
  socket.on("answer", (id, message) => {
    socket.to(id).emit("answer", socket.id, message);
  });
  socket.on("candidate", (id, message) => {
    socket.to(id).emit("candidate", socket.id, message);
  });
  socket.on('mouse', (txt, data) => {
    io.in(txt).emit('mouse', data);
  });
  socket.on('checkIsBroadcasterIdUnique', (newBroadcasterId) => {
    console.log('broadcasters', broadcasters)
    io.to(socket.id).emit('broadcasterUniqueCheckResponse', broadcasters[newBroadcasterId] ? false : true);
  });
  socket.on("disconnect", () => {
    console.log('disconnect',)
    for (var key in broadcasters) {
      if (broadcasters.hasOwnProperty(key) && broadcasters[key] == socket.id) {
        socket.to(broadcasters[key]).emit("disconnectPeer", socket.id);
      }
    }
  });
});

server.listen(port, () => console.log(`Server is running on port ${port}`));
