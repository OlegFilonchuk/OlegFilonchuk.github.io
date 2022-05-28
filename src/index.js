const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const Filter = require("bad-words");
const { generateMessage } = require("./utils/messages");
const {
  addUser,
  getUser,
  removeUser,
  getUsersInRoom,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3001;

app.use(express.static(path.join(__dirname, "../public")));

// socket.emit - to one
// io.emit - to all
// socket.broadcast.emit - to all except himself

// io.to(room).emit - to all the room
// socket.broadcast.to(room).emit - to all the room except himself

io.on("connection", (socket) => {
  socket.on("join", ({ username, room }, cb) => {
    const { error, user } = addUser({ username, room, id: socket.id });

    if (error) {
      return cb(error);
    }

    socket.join(user.room);

    socket.emit("message", generateMessage("System", "Welcome"));
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        generateMessage(
          "System",
          `${user.username} has joined the room ${user.room}`
        )
      );

    io.to(user.room).emit("roomData", {
      users: getUsersInRoom(user.room),
      room: user.room,
    });

    cb();
  });

  socket.on("sendMessage", (message, cb) => {
    const filter = new Filter();
    if (filter.isProfane(message)) {
      return cb("Shut the fuck up!");
    }

    const user = getUser(socket.id);

    if (!user) return cb("Something went wrong");

    io.to(user.room).emit("message", generateMessage(user.username, message));
    cb("The message was delivered");
  });

  socket.on("disconnect", () => {
    const [user] = removeUser(socket.id);
    if (!user) {
      return;
    }
    io.emit("message", generateMessage("System", `${user?.username} has left`));
    io.to(user.room).emit("roomData", {
      users: getUsersInRoom(user.room),
      room: user.room,
    });
  });

  socket.on("sendLocation", ({ latitude, longitude }, cb) => {
    const user = getUser(socket.id);

    if (!user) return cb("Something went wrong");

    io.to(user.room).emit(
      "locationMessage",
      generateMessage(
        user.username,
        `https://www.google.com/maps?q=${latitude},${longitude}`
      )
    );
    cb();
  });
});

server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
