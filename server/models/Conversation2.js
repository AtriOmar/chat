const { Model, DataTypes } = require("sequelize");

const db = require("../config/database");

const Conversation = db.define(
  "Conversation",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    seen: DataTypes.TEXT,
  },
  {
    tableName: "conversations",
  }
);

const User2 = require("./User2");

User2.hasMany(Conversation, { as: "Conversation1", foreignKey: "userId1" });
User2.hasMany(Conversation, { as: "Conversation2", foreignKey: "userId2" });

Conversation.belongsTo(User2, { as: "User1", foreignKey: "userId1" });
Conversation.belongsTo(User2, { as: "User2", foreignKey: "userId2" });

// Conversation.update(
//   {
//     seen: null,
//   },
//   {
//     where: {},
//   }
// );

// Conversation.sync({ alter: true });

module.exports = Conversation;
