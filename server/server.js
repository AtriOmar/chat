"use strict";
require("dotenv").config();
const express = require("express");
const app = express();
const routes = require("./routes");
const { createServer } = require("http");
const { Server } = require("socket.io");
const attachEvents = require("./controllers/socket");
require("./config/mongoConnect");
// const fs = require("fs-extra");

const passport = require("passport");
require("./config/passportConfig")(passport); // pass passport for configuration

// require("./config/firebase");

const PORT = process.env.PORT;
const cors = require("cors");
var corsOptions = {
  credentials: true,
  origin: ["http://localhost:3000", "http://localhost:8081", "http://localhost", "http://localhost:5173", process.env.FRONTEND_URL],
};

app.use(express.json());
app.use(express.static(__dirname + "/public"));
app.use(cors(corsOptions));
app.use(passport.initialize());
app.use("/" + process.env.APP_VERSION, routes);

app.get(`/${process.env.APP_VERSION}/*`, (req, res) => {
  res.status(404).send("route not found");
});

app.all("/*", (req, res) => {
  // const { version } = require("./package.json");
  console.log("all");
  res.status(404).send({ message: "old version", apkUrl: process.env.APK_URL, version: process.env.npm_package_version });
});
// const httpsOptions = {
//   key: fs.readFileSync("./security/cert.key"),
//   cert: fs.readFileSync("./security/cert.pem"),
// };
const httpServer = createServer(app);

var io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:8081", "http://localhost", "http://localhost:5173", process.env.FRONTEND_URL],
    credentials: true,
  },
});

exports.io = function () {
  return io;
};

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

// app.listen(PORT, () => console.log(`React API server listening on http://localhost:${PORT}`));

httpServer.listen(PORT, () => console.log(`React API server listening on http://localhost:${PORT}`));
