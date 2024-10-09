const { Model, DataTypes } = require("sequelize");

const db = require("../config/database");

const Message = db.define(
  "Message",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    content: DataTypes.TEXT,
  },

  {
    tableName: "messages",
  }
);

const Conversation2 = require("./Conversation2");
const User2 = require("./User2");

Conversation2.hasMany(Message, { foreignKey: "conversationId", onDelete: "CASCADE" });
Message.belongsTo(Conversation2, { foreignKey: "conversationId", onDelete: "CASCADE" });

User2.hasMany(Message, { foreignKey: "senderId", onDelete: "CASCADE" });
Message.belongsTo(User2, { foreignKey: "senderId", onDelete: "CASCADE" });

// Message.sync({ alter: true });

module.exports = Message;
