const router = require("express").Router();

const usersRoute = require("./users");
const loginRoute = require("./login");
const conversationsRoute = require("./conversations");
// const logoutRoute = require("./logout");
// const conversationRoute = require("./conversations");

// // login route for Users
router.use("/login", loginRoute);

// // // logout route for Users
// router.use("/logout", logoutRoute);

router.use("/users", usersRoute);

router.use("/conversations", conversationsRoute);

const User = require("../models/User");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const mongoose = require("mongoose");

router.use("/test", async (req, res) => {
  var conversation = await Conversation.findOne({
    $or: [
      {
        group: true,
        _id: "65fea76bfeddee622e094efe",
      },
      {
        group: false,
        "members.user": {
          $all: ["65eab2661b18bbb9db2e0cbf", "65eab2661b18bbb9db2e0cc2"],
        },
      },
    ],
  });

  res.send(conversation);
});

// =========== SEND REACT PRODUCTION BUILD ====================
router.get("*", (req, res) => {
  res.status(404).send("Route not found");
});

module.exports = router;
