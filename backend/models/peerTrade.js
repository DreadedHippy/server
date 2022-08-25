const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const peerTradeSchema = mongoose.Schema({
    fromUser: {type: String, required: true},
    toUser: {type: String, required: true},
    type: {type: String, required: true},
    cryptoAmt: {type: Number, required: true},
    fiatAmt: { type: Number, required: true},
    paymentMethod: { type: String, required: true},
    status: { type: String, required: true}
}, { timestamps: true });

peerTradeSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Transaction", peerTradeSchema);