let mongoose = require("mongoose");
let { Schema } = require("mongoose");

let MessageSchema = new mongoose.Schema(
  {
    content: String,
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
    },
    reactions: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        reaction: String,
      },
    ],
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

MessageSchema.virtual("id").get(function () {
  return this._id.toString();
});

module.exports = mongoose.model("Message", MessageSchema);
