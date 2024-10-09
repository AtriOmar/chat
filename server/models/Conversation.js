let mongoose = require("mongoose");
let { Schema } = require("mongoose");

let ConversationSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    seen: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    members: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        accessId: { type: Number, default: 0 },
      },
    ],
    // members2: [
    //   {
    //     type: Schema.Types.ObjectId,
    //     ref: "User",
    //   },
    // ],
    group: Boolean,
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

ConversationSchema.virtual("id").get(function () {
  return this._id.toString();
});

module.exports = mongoose.model("Conversation", ConversationSchema);
