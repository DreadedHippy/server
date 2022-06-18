const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const userSchema = mongoose.Schema({
  username: {type: String, required: true, unique: true},
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true},
  friends: { type: Array},
  verifyToken: {type: String},
  password_token: {type: String},
  isVerified: {type: Boolean, default: false},
  wallets: {type: Array, default: [] }
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);
