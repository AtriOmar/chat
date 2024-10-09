const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
// const User2 = require("../models/User2");
const { Op, Sequelize } = require("sequelize");
const mongoose = require("mongoose");

function makeRoom(user1, user2) {
  return [user1, user2].sort((a, b) => a - b).join("-");
}

function parseRoom(room) {
  return room.split("-");
}

const OneSignal = require("onesignal-node");
const User = require("../models/User");

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
    const conversations = await Conversation.aggregate([
      {
        $lookup: {
          from: "messages",
          localField: "_id",
          foreignField: "conversationId",
          as: "messages",
        },
      },
      {
        $match: {
          "members.user": new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $unwind: { path: "$messages", preserveNullAndEmptyArrays: true }, // Optional, see explanation below
      },
      {
        $sort: { "messages.createdAt": -1 }, // Sort messages by updatedAt descending
      },
      {
        $group: {
          _id: "$_id",
          seen: { $first: "$seen" }, // Get the first seen value (optional)
          members: { $first: "$members" },
          lastMessage: {
            $first: "$messages", // Get the first message (last due to sort)
          },
          group: { $first: "$group" },
          name: { $first: "$name" },
          createdAt: { $first: "$createdAt" },
        },
      },
      {
        $addFields: {
          sortField: {
            $cond: {
              if: {
                $ne: ["$lastMessage", null],
              },
              then: "$lastMessage.createdAt",
              else: "$createdAt",
            },
          },
        },
      },
      {
        $sort: { sortField: -1 }, // Sort conversations by lastMessage.createdAt descending
      },
    ]);

    await User.populate(conversations, "members.user");

    conversations.forEach((conv) => {
      conv.Messages = [conv.lastMessage];
      conv.id = conv._id.toString();
      delete conv.lastMessage;
    });

    if (userId === 0) {
      io.to(userId).emit("supportConversations", conversations);
    } else {
      io.to(userId).emit("conversations", conversations);
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

  console.log("-------------------- userId, toWatch --------------------");
  console.log(userId, toWatch);

  try {
    const user = await User.findById(new mongoose.Types.ObjectId(toWatch), "id username picture");
    var conversation = await Conversation.findOne({
      $or: [
        {
          group: true,
          _id: toWatch,
        },
        {
          group: false,
          $or: [
            { "members.0.user": userId, "members.1.user": toWatch },
            { "members.1.user": userId, "members.0.user": toWatch },
          ],
        },
      ],
    });

    if (conversation) {
      await User.populate(conversation, "members.user");
      conversation = conversation.toJSON();
      const messages = await Message.find({ conversationId: conversation.id })
        .sort({ createdAt: -1 })
        .limit(socket.data.limit)
        .populate("replyTo", "content senderId deleted");
      conversation.Messages = messages;
    }

    // console.log("-------------------- conversation --------------------");
    // console.log(conversation);

    // if (conversation && conversation.seen !== userId + "" && conversation.seen !== "both") {
    //   if (!conversation.seen) {
    //     conversation.set({
    //       seen: userId + "",
    //     });
    //   } else {
    //     conversation.set({
    //       seen: "both",
    //     });
    //   }
    //   // console.log("-------------------- conversation.toJSON() --------------------");
    //   // console.log(conversation.toJSON());
    //   await conversation.save();
    // }
    if (conversation) {
      sendHeader(io, userId, conversation);
      sendHeader(io, toWatch, conversation);
    }

    // var rooms = socket.adapter.rooms;
    // const room = rooms.get(makeRoom(userId, toWatch));

    // console.log("-------------------- room --------------------");
    // console.log(rooms);

    socket.emit("messages", { user, conversation });

    if (!conversation) {
      return;
    }

    // socket.join(makeRoom(userId, toWatch));
    socket.join(conversation?.id);

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

  var conversation = await Conversation.findOne({
    $or: [
      {
        group: true,
        _id: toWatch,
      },
      {
        group: false,
        $or: [
          { "members.0.user": userId, "members.1.user": toWatch },
          { "members.1.user": userId, "members.0.user": toWatch },
        ],
      },
    ],
  });

  try {
    socket.leave(conversation?.id);

    console.log("-------------------- io.sockets.adapter.rooms --------------------");
    console.log(io.sockets.adapter.rooms);
  } catch (err) {
    console.log(err);
  }
}

async function sendHeader(io, ids, conversation) {
  const conv = JSON.parse(JSON.stringify(conversation));

  console.log("-------------------- conv --------------------");
  console.log(conv);

  if (conv?.Messages?.length) {
    conv.Messages = conv.Messages.slice(0, 1);
  }

  try {
    io.to(ids).emit("conversation", conv);
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

async function sendMessage(io, userId, receiver, message, replyTo, socket) {
  console.log("-------------------- sending message --------------------");

  var created = false;
  try {
    var conversation = await Conversation.findOne({
      $or: [
        {
          group: true,
          _id: receiver,
        },
        {
          group: false,
          $or: [
            { "members.0.user": userId, "members.1.user": receiver },
            { "members.1.user": userId, "members.0.user": receiver },
          ],
        },
      ],
    });

    console.log("-------------------- conversation from send message --------------------");
    console.log(conversation);

    if (!conversation) {
      created = true;
      conversation = await Conversation.create({
        members: [
          { user: userId, accessId: 2 },
          { user: receiver, accessId: 0 },
        ],
        seen: [userId],
        group: false,
      });
    }

    await User.populate(conversation, "members.user");

    conversation = conversation.toJSON();

    var rooms = io.sockets.adapter.rooms;
    // const clients = rooms.get(makeRoom(userId, receiver));
    const clients = rooms.get(conversation?.id);

    console.log("-------------------- room --------------------");
    console.log(clients);

    // Checking if the receiver is connected (there is a socket in the room with the receiver's id) and that socket
    // is connected to the current conversation (one of the sockets is in the room of the conversation)

    // if (haveCommon(io.sockets.adapter.rooms.get(receiver), clients)) {
    //   console.log("yes", io.sockets.adapter.rooms.get(receiver), clients);
    //   conversationRes.set({
    //     seen: "both",
    //   });
    // } else {
    //   conversationRes.set({
    //     seen: userId + "",
    //   });
    // }

    console.log("-------------------- receiver --------------------");
    console.log(receiver);
    // const username = conversation.toJSON().User1.id == userId ? conversation.toJSON().User1.username : conversationRes.toJSON().User2.username;
    // const picture = conversation.toJSON().User1.id == userId ? conversation.toJSON().User1.picture : conversationRes.toJSON().User2.picture;
    // sendNotification(receiver, `Message de ${username}`, message, { receiver: userId.toString() }, picture);

    const result = await Message.create({
      conversationId: conversation.id,
      senderId: userId,
      content: message,
      replyTo: replyTo,
    });

    await Message.populate(result, { path: "replyTo", select: "content senderId deleted" });
    // const [result] = await Promise.all([
    //   Message.create({
    //     conversationId: conversation.id,
    //     senderId: userId,
    //     content: message,
    //   }),
    //   conversationRes.save(),
    // ]);

    console.log("-------------------- result --------------------");
    console.log(result);

    conversation.Messages = [];
    conversation.Messages.push(result);

    // console.log("-------------------- conversation hello --------------------");
    // console.log(conversation);

    // console.log("-------------------- client --------------------");
    // var rooms = io.sockets.adapter.rooms;
    // console.log(rooms.get(makeRoom(userId, receiver)));

    sendHeader(
      io,
      conversation.members.map((member) => member.user.id),
      conversation
    );
    if (created) {
      console.log("sending this conversation", conversation);
      // io.to(makeRoom(userId, receiver)).emit("messages", { conversation });
      socket.emit("createdConversation", { conversation, messages: [result] });
      socket.join(conversation?.id);
      io.to(conversation?.id).emit("messages", { conversation });
    } else {
      // io.to(makeRoom(userId, receiver)).emit("message", conversation.Messages?.at(-1));
      io.to(conversation?.id).emit("message", conversation.Messages?.at(-1));
    }
  } catch (err) {
    console.log("sendMessage", err);
  }
}

async function onReaction(io, userId, messageId, reaction) {
  console.log("-------------------- onMessage --------------------");
  console.log(userId, messageId, reaction);

  try {
    const message = await Message.findById(messageId);

    if (message.reactions) {
      message.reactions = message?.reactions?.filter((r) => r.user.toString() !== userId);
      if (reaction) message.reactions.push({ user: userId, reaction });
    }

    await message.save();

    io.to(message?.conversationId?.toString()).emit("reaction", { messageId, reaction: { user: userId, reaction } });
  } catch (err) {
    console.log("err from onReaction", err);
  }
}

async function onDeleteMessage(io, userId, messageId) {
  console.log("-------------------- onDeleteMessage --------------------");
  console.log(userId, messageId);

  try {
    const message = await Message.findById(messageId, "senderId conversationId");

    console.log("deleting message", message);

    if (message?.senderId?.toString() !== userId) {
      return;
    }

    await Message.updateOne(
      {
        _id: messageId,
      },
      {
        $set: {
          deleted: true,
        },
      }
    );

    io.to(message?.conversationId?.toString()).emit("deleteMessage", { messageId });
  } catch (err) {
    console.log(err);
  }
}
async function attachEvents(io) {
  io.on("connection", async (socket) => {
    console.log("--------------------socket.request.session.passport.user --------------------");
    const user = socket.request.user;
    const userId = socket.request.user?.id;
    console.log(userId);
    console.log("-------------------- connecting --------------------");

    // const registrationToken = socket.handshake.query.registrationToken;
    // const oldRegTokens = JSON.parse(user.regTokens);

    // console.log("registration token", registrationToken);
    // if (registrationToken && registrationToken !== "null" && !oldRegTokens.includes(registrationToken)) {
    //   const newRegTokens = [...oldRegTokens, socket.handshake.query.registrationToken];
    //   await User2.update(
    //     {
    //       regTokens: JSON.stringify(newRegTokens),
    //     },
    //     {
    //       where: {
    //         id: userId,
    //       },
    //     }
    //   );
    //   // regTokens[userId] = socket.handshake.query.registrationToken;
    // }

    // console.log("-------------------- socket.request.user --------------------");
    // console.log(socket.request.user);

    socket.join(userId);

    sendTitles(io, userId);

    socket.on("watchSingle", (toWatch, limit) => {
      socket.data.limit = limit;
      console.log("-------------------- toWatch, limit fsmlfjdmsq --------------------");
      console.log(toWatch, limit);
      onWatchSingle(socket, userId, toWatch, io);
    });

    socket.on("unwatchSingle", (toWatch) => {
      onUnwatchSingle(socket, userId, toWatch, io);
    });

    socket.on("reaction", ({ messageId, reaction }) => {
      onReaction(io, userId, messageId, reaction);
    });

    socket.on("deleteMessage", ({ messageId }) => {
      onDeleteMessage(io, userId, messageId);
    });

    socket.on("message", ({ receiver, message, replyTo }) => {
      console.log(receiver, message);
      sendMessage(io, userId, receiver, message, replyTo, socket);
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
