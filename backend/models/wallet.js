const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const walletSchema = mongoose.Schema({
    name: {type: String, required: true, unique: true},
    address: { type: String, required: true, unique: true },
    currency: { type: String, required: true},
    iconSrc: {type: String},
    balance: {type: Number, required: true},
    transactions: { type: Array},
}, { timestamps: true });
  
walletSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Wallet", walletSchema);