"use strict";
require("dotenv").config();
const express = require("express");
const app = express();
const routes = require("./routes");
const { createServer } = require("http");
const { Server } = require("socket.io");
const attachEvents = require("./controllers/socket");
require("./config/mongoConnect");

const passport = require("passport");
require("./config/passportConfig")(passport); // pass passport for configuration

// require("./config/firebase");

const cors = require("cors");
var corsOptions = {
  credentials: true,
  origin: ["http://localhost", "http://localhost:5173", process.env.FRONTEND_URL],
};

app.use(express.json());
app.use(express.static(__dirname + "/public"));
app.use(cors(corsOptions));
app.use(passport.initialize());
app.use(routes);

const httpServer = createServer(app);

var io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost", "http://localhost:5173", process.env.FRONTEND_URL],
    credentials: true,
  },
});
// const clients = new Set();

// const connectionsSocket = io.of("/connections");

// connectionsSocket.on("connection", (socket) => {
//   clients.add(socket.handshake.query.id);
//   socket.join(socket.handshake.query.id);
//   connectionsSocket.emit("clientsCount", clients.size);

//   socket.on("getClientsCount", () => {
//     connectionsSocket.emit("clientsCount", clients.size);
//   });

//   socket.on("disconnect", () => {
//     if (!connectionsSocket.adapter.rooms.has(socket.handshake.query.id)) clients.delete(socket.handshake.query.id);
//     connectionsSocket.emit("clientsCount", clients.size);
//   });
// });

const wrap = (middleware) => (socket, next) => middleware(socket.request, {}, next);

io.use(wrap(passport.initialize()));
// io.use(wrap(passport.session()));
// io.use(wrap(passport.authenticate(["jwt"], { session: false })));

io.use((socket, next) => {
  const token = socket.handshake.query.token;
  console.log("-------------------- token --------------------");
  console.log(token);

  console.log("-------------------- socket.hadshake.query --------------------");
  console.log(socket.handshake.query);

  if (socket.request.user) return next();

  socket.request.headers.authorization = token;

  console.log("-------------------- socket.request.headers --------------------");
  console.log(socket.request.headers);

  console.log("-------------------- authenticating --------------------");
  passport.authenticate("jwt", { session: false }, (err, user) => {
    if (err || !user) {
      console.log("-------------------- user --------------------");
      console.log(user);
      return next(new Error("Unauthorized"));
    }

    socket.request.user = user;
    return next();
  })(socket.request, socket.request.res, next);
});

attachEvents(io);
exports.io = function () {
  return io;
};

// app.listen(PORT, () => console.log(`React API server listening on http://localhost:${PORT}`));
exports.httpServer = function () {
  return httpServer;
};
