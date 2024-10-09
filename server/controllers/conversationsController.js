const bcrypt = require("bcrypt");
const saltRounds = 10;
// const User2 = require("../models/User2.js");
const crypto = require("crypto");
const { Op } = require("sequelize");
const formidable = require("formidable");
const uuidv4 = require("uuid").v4;
const fse = require("fs-extra");
const sharp = require("sharp");
const jwt = require("jsonwebtoken");
const Conversation = require("../models/Conversation.js");
const User = require("../models/User.js");
const Message = require("../models/Message.js");
const mongoose = require("mongoose");

exports.create = async function create(req, res) {
  const io = require("../server.js").io();
  const { name, members } = req.body;

  const user = req.user;

  const formattedMembers = [...members.filter((member) => member !== user?.id)].map((member) => {
    return {
      user: member,
      accessId: 0,
    };
  });

  formattedMembers.push({
    user: user._id,
    accessId: 2,
  });

  const conversationData = {
    owner: user._id,
    name,
    members: formattedMembers,
    group: true,
  };

  try {
    const conversation = await Conversation.create(conversationData);
    // io.emit("conversation", conversation);
    io.to([...members, user.id]).emit("conversation", conversation);

    res.send(conversation);
  } catch (err) {
    res.status(400).send("error");
    console.log(err);
  }
};

exports.getAll = async function getAll(req, res) {
  const { limit, orderBy, order, search = "", role } = req.query;

  const options = {
    username: new RegExp(`.*${search}.*`, "i"),
  };

  if (Number(role) >= 1 && Number(role) <= 5) {
    // options.where.accessId = Number(role);
    options.accessId = Number(role);
  }
  const query = User.find(options, {
    password: 0,
  });

  if (Number(limit) >= 1) {
    query.limit(Number(limit));
  }

  try {
    // const result = await User2.findAll(options);
    const result = await query.exec();
    result.forEach((user) => {
      user._doc.id = user._id;
    });

    res.status(200).send(result);
  } catch (err) {
    res.status(400).send(err);
    console.log(err);
  }
};

exports.getById = async function getById(req, res) {
  const result = await User2.findByPk(req.query.id, { attributes: { exclude: ["password"] } });
  res.status(200).send(result);
};

exports.updateRole = async function updateRole(req, res) {
  if (!req.isAuthenticated()) {
    res.status(400).send("not authorized");
    return;
  }

  const user = req.user;

  try {
    const userToEdit = (await User2.findByPk(req.body.id)).toJSON();

    if (userToEdit.accessId >= user.accessId || user.accessId <= req.body.role) {
      res.status(400).send("not authorized");
      return;
    }

    const { id, role } = req.body;

    await User2.update(
      {
        accessId: role,
      },
      {
        where: {
          id: id,
        },
      }
    );

    const userData = (await User2.findByPk(id, { attributes: { exclude: ["password"] } })).toJSON();

    res.send(userData);
  } catch (err) {
    res.status(400).send(err);
    console.log(err);
  }
};

exports.rename = async function rename(req, res) {
  const io = require("../server.js").io();
  if (!req.isAuthenticated()) {
    res.status(400).send("not authorized");
    return;
  }

  const user = req.user;

  try {
    const { id, name } = req.body;

    console.log("-------------------- req.body --------------------");
    console.log(req.body);

    await Conversation.updateMany(
      {
        _id: id,
      },
      {
        $set: {
          name,
        },
      }
    );

    const conversationData = (await Conversation.findById(id)).toJSON();
    const lastMessage = await Message.findOne({
      conversationId: id,
    }).sort({ createdAt: -1 });
    conversationData.Messages = [lastMessage?.toJSON()];

    const members = conversationData.members.map((member) => member.user.toString());

    await User.populate(conversationData, { path: "members.user", select: { password: 0 } });

    io.to(members).emit("conversation", conversationData);
    res.send(conversationData);
  } catch (err) {
    res.status(400).send(err);
    console.log(err);
  }
};

exports.updatePicture = async function updatePicture(req, res) {
  if (!req.isAuthenticated()) {
    res.status(400).send("not authorized");
    return;
  }

  const user = req.user;

  var form = new formidable.IncomingForm({ multiples: true });

  form.parse(req, async function (err, fields, files) {
    if (err) {
      res.writeHead(err.httpCode || 400, { "Content-Type": "text/plain" });
      res.end(String(err));
      return;
    }
    try {
      const picture = Object.values(files)[0];

      if (user.picture) {
        await removeFile(user.picture);
      }

      var pictureName = picture ? await uploadFile(picture) : null;

      console.log("-------------------- pictureName --------------------");
      console.log(pictureName);

      await User2.update(
        { picture: pictureName },
        {
          where: {
            id: user.id,
          },
        }
      );

      const userData = (await User2.findByPk(user.id)).toJSON();

      req.logIn(userData, (err) => {
        if (err) {
          res.status(400).send(err);
          return;
        }
        delete userData.password;
        res.status(200).send(userData);
      });
    } catch (err) {
      res.status(400).send(err);
      console.log(err);
    }
  });
};

exports.deleteById = async function deleteById(req, res) {
  db.User.deleteOne(req.params.id, (data) => {
    res.status(200).json(data);
  });
};

exports.getWithMessages = async function getWithMessages(req, res) {
  const { id, limit = 30, skip = 0 } = req.query;
  const userId = req.user?.id;

  console.log("getwithmessages");
  console.log(id, limit, skip);

  if (userId === undefined || userId === null) {
    console.log("-------------------- userId --------------------");
    console.log(userId);
    return;
  }
  try {
    const user = await User.findById(id, "id username picture");
    var conversation = await Conversation.findOne({
      $or: [
        {
          group: true,
          _id: id,
        },
        {
          group: false,
          $or: [
            { "members.0.user": userId, "members.1.user": id },
            { "members.1.user": userId, "members.0.user": id },
          ],
        },
      ],
    }).populate("members.user", "-password");

    let messages = [];
    if (conversation) {
      messages = await Message.find({ conversationId: conversation.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("replyTo", "content senderId deleted")
        .populate("reactions");
    }
    res.send({ user, conversation, messages });
  } catch (err) {
    res.status(400).send(err);
  }
};
