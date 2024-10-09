let mongoose = require("mongoose");

let UserSchema = new mongoose.Schema(
  {
    display: String,
    username: {
      type: String,
      unique: true,
      lowercase: true,
    },
    password: String,
    picture: String,
    accessId: Number,
    active: Number,
    createdAt: {
      type: Number,
      default: Date.now,
    },
    updatedAt: {
      type: Number,
      default: Date.now,
    },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

UserSchema.virtual("id").get(function () {
  return this._id.toString();
});

module.exports = mongoose.model("User", UserSchema);
