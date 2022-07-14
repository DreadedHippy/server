const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const transactionSchema = mongoose.Schema({
    fromId: {type: String, required: true},
    fromAddress: { type: String, required: true},
    toAddress: { type: String, required: true},
    amount: { type: String, required: true},
    currency: { type: String, required: true},
    date: {type: String, required: true},
    status: {type: String, required: true},
    remark: {type: String},
    type: {type: String, required: true}
}, { timestamps: true });

transactionSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Transaction", transactionSchema);