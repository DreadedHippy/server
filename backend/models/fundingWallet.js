const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const fundingWalletSchema = mongoose.Schema({
    name: {type: String, required: true, unique: true},
    currency: { type: String, required: true},
    iconSrc: {type: String},
    address: { type: String, required: true, unique: true },
    balance: {type: Number, required: true},
    transactions: { type: Array},
    type: {type: String},
}, { timestamps: true });
  
fundingWalletSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Funding wallet", fundingWalletSchema);