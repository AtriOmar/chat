const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const User2 = require("../models/User2");
const { Op, Sequelize } = require("sequelize");

function makeRoom(user1, user2) {
  return [user1, user2].sort((a, b) => a - b).join("-");
}

function parseRoom(room) {
  return room.split("-");
}

const OneSignal = require("onesignal-node");

// const client = new OneSignal.Client(process.env.ONESIGNAL_APP_ID, process.env.ONESIGNAL_API_KEY);

async function sendNotification(userId, title, body, data, picture) {
  console.log("-------------------- hhzfomdsfsqdm sendNotification --------------------");
  try {
    const user = await User2.findByPk(userId, {
      attributes: ["id", "regTokens"],
    });
    const regTokens = JSON.parse(user.regTokens);
    if (!regTokens?.length) return;

    const notification = {
      headings: { en: title },
      contents: {
        en: body,
      },
      // big_picture: "https://elcamba.net/logo_icon.png",
      large_icon: picture ? "https://back.elcamba.net/uploads/profile-pictures/" + picture : undefined,
      url: `elcamba://customer/chat/${data.receiver}`,
      // buttons: [
      //   { id: "id1", text: "first button", icon: "ic_menu_share" },
      //   { id: "id2", text: "second button", icon: "ic_menu_send" },
      // ],
      existing_android_channel_id: "1c08ee5c-a49f-4843-81d9-d2a1c36a865f",
      android_channel_id: "1c08ee5c-a49f-4843-81d9-d2a1c36a865f",
      android_group: "message",
      include_subscription_ids: regTokens,
    };

    client.createNotification(notification);

    // const message = {
    //   notification: {
    //     title: title,
    //     body: body,
    //   },
    //   data: data,
    //   tokens: regTokens,
    // };
    // const messages = [];
    // regTokens.forEach((token) => {
    //   messages.push({
    //     notification: {
    //       title: title,
    //       body: body,
    //     },
    //     data: data,
    //     token: token,
    //   });
    //   console.log("-------------------- token fjksmldf --------------------");
    //   console.log(token);
    // });
    // messages.forEach((message) => {
    //   getMessaging()
    //     .send(message)
    //     .then((response) => {
    //       console.log("Successfully sent message:", response);
    //     })
    //     .catch((error) => {
    //       console.log("-------------------- error sending message --------------------");
    //       console.log(error);
    //     });
    // });
  } catch (err) {
    console.log(err);
  }
}

async function sendTitles(io, userId) {
  try {
    const result = await Conversation.findAll({
      where: {
        [Op.or]: [
          {
            userId1: userId,
          },
          {
            userId2: userId,
          },
        ],
      },
      attributes: {
        include: [
          [
            Sequelize.literal("(SELECT `createdAt` FROM `messages` WHERE `messages`.`conversationId` = `Conversation`.`id` ORDER BY `createdAt` DESC LIMIT 1)"),
            "lastMessageCreatedAt",
          ],
        ],
      },
      order: [[Sequelize.literal("lastMessageCreatedAt"), "DESC"]],
      include: [
        { model: Message, attributes: ["id", "content", "createdAt", "senderId"], order: [["createdAt", "desc"]], limit: 1 },
        {
          model: User2,
          as: "User1",
          attributes: ["id", "username", "picture"],
        },
        {
          model: User2,
          as: "User2",
          attributes: ["id", "username", "picture"],
        },
      ],
    });
    if (userId === 0) {
      io.to(userId).emit(
        "supportConversations",
        result.map((curr) => curr.toJSON())
      );
    } else {
      io.to(userId).emit(
        "conversations",
        result.map((curr) => curr.toJSON())
      );
    }
    // console.log("-------------------- sendTitles result.toJSON() --------------------");
    // console.log(result.map((curr) => curr.toJSON()));
  } catch (err) {
    console.log("sendTitles", err);
  }
}

async function onWatchSingle(socket, userId, toWatch, io) {
  if (userId === undefined || userId === null) {
    console.log("-------------------- userId --------------------");
    console.log(userId);
    return;
  }

  try {
    const [user, conversation] = await Promise.all([
      User2.findByPk(toWatch, { attributes: ["id", "username", "picture"] }),
      Conversation.findOne({
        where: {
          [Op.or]: [
            {
              userId1: userId,
              userId2: toWatch,
            },
            {
              userId1: toWatch,
              userId2: userId,
            },
          ],
        },
        include: [
          {
            model: Message,
            order: [["createdAt", "DESC"]],
            limit: socket.data.limit,
          },
          {
            model: User2,
            as: "User1",
            attributes: ["id", "username", "picture"],
          },
          {
            model: User2,
            as: "User2",
            attributes: ["id", "username", "picture"],
          },
        ],
      }),
    ]);

    if (conversation && conversation.seen !== userId + "" && conversation.seen !== "both") {
      if (!conversation.seen) {
        conversation.set({
          seen: userId + "",
        });
      } else {
        conversation.set({
          seen: "both",
        });
      }
      // console.log("-------------------- conversation.toJSON() --------------------");
      // console.log(conversation.toJSON());
      await conversation.save();
    }
    if (conversation) {
      sendHeader(io, userId, conversation);
      sendHeader(io, toWatch, conversation);
    }

    // var rooms = socket.adapter.rooms;
    // const room = rooms.get(makeRoom(userId, toWatch));

    // console.log("-------------------- room --------------------");
    // console.log(rooms);

    socket.emit("messages", { user, conversation });

    if (!user) {
      return;
    }

    socket.join(makeRoom(userId, toWatch));

    console.log("-------------------- io.sockets.adapter.rooms --------------------");
    console.log(io.sockets.adapter.rooms);
  } catch (err) {
    console.log(err);
  }
}

async function onUnwatchSingle(socket, userId, toWatch, io) {
  if (userId === undefined || userId === null) {
    console.log("-------------------- userId --------------------");
    console.log(userId);
    return;
  }

  try {
    socket.leave(makeRoom(userId, toWatch));
    console.log("-------------------- io.sockets.adapter.rooms --------------------");
    console.log(io.sockets.adapter.rooms);
  } catch (err) {
    console.log(err);
  }
}

async function sendHeader(io, userId, conversation) {
  const conv = JSON.parse(JSON.stringify(conversation));

  if (conv?.Messages?.length) {
    conv.Messages = conv.Messages.slice(0, 1);
  }

  try {
    if (userId === 0) io.to(userId).emit("supportConversation", conv);
    else io.to(userId).emit("conversation", conv);
  } catch (err) {
    console.log("sendTitles", err);
  }
}

function haveCommon(set1, set2) {
  if (!set1 || !set2) return false;

  for (let elem of set1) {
    if (set2.has(elem)) {
      return true;
    }
  }
  return false;
}

async function sendMessage(io, userId, receiver, message) {
  console.log("-------------------- sending message --------------------");

  try {
    var [conversationRes, created] = await Conversation.findOrCreate({
      where: {
        [Op.or]: [
          {
            userId1: userId,
            userId2: receiver,
          },
          {
            userId1: receiver,
            userId2: userId,
          },
        ],
      },
      include: [
        // { model: Message, order: [["createdAt", "DESC"]], limit: 1 },
        {
          model: User2,
          as: "User1",
          attributes: ["id", "username", "picture"],
        },
        {
          model: User2,
          as: "User2",
          attributes: ["id", "username", "picture"],
        },
      ],
      defaults: {
        userId1: userId,
        userId2: receiver,
        seen: userId + "",
      },
    });

    if (created) {
      conversationRes = await Conversation.findOne({
        where: {
          [Op.or]: [
            {
              userId1: userId,
              userId2: receiver,
            },
            {
              userId1: receiver,
              userId2: userId,
            },
          ],
        },
        include: [
          // { model: Message, order: [["createdAt", "desc"]], limit: 1 },
          {
            model: User2,
            as: "User1",
            attributes: ["id", "username", "picture"],
          },
          {
            model: User2,
            as: "User2",
            attributes: ["id", "username", "picture"],
          },
        ],
      });
    }

    var rooms = io.sockets.adapter.rooms;
    const clients = rooms.get(makeRoom(userId, receiver));

    console.log("-------------------- room --------------------");
    console.log(clients);

    // Checking if the receiver is connected (there is a socket in the room with the receiver's id) and that socket
    // is connected to the current conversation (one of the sockets is in the room of the conversation)

    if (haveCommon(io.sockets.adapter.rooms.get(receiver), clients)) {
      console.log("yes", io.sockets.adapter.rooms.get(receiver), clients);
      conversationRes.set({
        seen: "both",
      });
    } else {
      conversationRes.set({
        seen: userId + "",
      });
    }

    console.log("-------------------- receiver --------------------");
    console.log(receiver);
    const username = conversationRes.toJSON().User1.id == userId ? conversationRes.toJSON().User1.username : conversationRes.toJSON().User2.username;
    const picture = conversationRes.toJSON().User1.id == userId ? conversationRes.toJSON().User1.picture : conversationRes.toJSON().User2.picture;
    // sendNotification(receiver, `Message de ${username}`, message, { receiver: userId.toString() }, picture);

    const conversation = conversationRes?.toJSON();

    const [result] = await Promise.all([
      Message.create({
        conversationId: conversation.id,
        senderId: userId,
        content: message,
      }),
      conversationRes.save(),
    ]);

    conversation.Messages = [];

    conversation.Messages.push(result.toJSON());

    // console.log("-------------------- client --------------------");
    // var rooms = io.sockets.adapter.rooms;
    // console.log(rooms.get(makeRoom(userId, receiver)));

    sendHeader(io, userId, conversation);
    sendHeader(io, receiver, conversation);
    if (created) {
      console.log("sending this conversation", conversation);
      io.to(makeRoom(userId, receiver)).emit("messages", { conversation });
    } else {
      io.to(makeRoom(userId, receiver)).emit("message", conversation.Messages?.at(-1));
    }
  } catch (err) {
    console.log("sendMessage", err);
  }
}

async function attachEvents(io) {
  io.on("connection", async (socket) => {
    console.log("--------------------socket.request.session.passport.user --------------------");
    const user = socket.request.user;
    const userId = socket.request.user?.id;
    console.log(userId);
    console.log("-------------------- connecting --------------------");

    const registrationToken = socket.handshake.query.registrationToken;
    const oldRegTokens = JSON.parse(user.regTokens);

    console.log("registration token", registrationToken);
    if (registrationToken && registrationToken !== "null" && !oldRegTokens.includes(registrationToken)) {
      const newRegTokens = [...oldRegTokens, socket.handshake.query.registrationToken];
      await User2.update(
        {
          regTokens: JSON.stringify(newRegTokens),
        },
        {
          where: {
            id: userId,
          },
        }
      );
      // regTokens[userId] = socket.handshake.query.registrationToken;
    }

    // console.log("-------------------- socket.request.user --------------------");
    // console.log(socket.request.user);

    socket.join(userId);

    sendTitles(io, userId);

    socket.on("watchSingle", (toWatch, limit) => {
      socket.data.limit = limit;
      onWatchSingle(socket, userId, toWatch, io);
    });

    socket.on("unwatchSingle", (toWatch) => {
      onUnwatchSingle(socket, userId, toWatch, io);
    });

    socket.on("message", ({ receiver, message }) => {
      console.log(receiver, message);
      sendMessage(io, userId, receiver, message);
    });

    // if (user.accessId >= 2) {
    //   socket.on("joinSupport", () => {
    //     console.log("-------------------- joining support --------------------");
    //     socket.join(0);
    //     sendTitles(io, 0);
    //   });
    //   socket.on("supportWatchSingle", (toWatch, limit) => {
    //     socket.data.limit = limit;
    //     onWatchSingle(socket, 0, toWatch, io);
    //   });
    //   socket.on("supportUnwatchSingle", (toWatch) => {
    //     onUnwatchSingle(socket, 0, toWatch, io);
    //   });
    //   socket.on("supportMessage", ({ receiver, message }) => {
    //     console.log(receiver, message);
    //     sendMessage(io, 0, receiver, message);
    //   });
    // }

    socket.on("disconnect", () => console.log("------------------------ disconnecting"));
  });
}

module.exports = attachEvents;
