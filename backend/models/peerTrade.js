const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const peerTradeSchema = mongoose.Schema({
    offerID: {type: String, required: true}, //ID of the offer selected
    advertType: {type: String, required: true}, //Type of advertisement
    advertiser: {type: String, required: true}, //email of advertiser
    customer: {type: String, required: true}, //email of customer
    cryptoCurr: {type: String, required: true}, //cryptocurrency to be traded
    cryptoAmt: {type: Number, required: true}, //amount of cryptocurrency
    fiatCurr: {type: String, required: true}, // fiat currency to be traded
    fiatAmt: { type: Number, required: true}, //amount of fiat currency
    paymentMethod: { type: String, required: true}, //method of payment selected by customer
    status: { type: String, required: true}, //current status of the order
    timeLimit: {type: Number, required: true}
}, { timestamps: true });

peerTradeSchema.plugin(uniqueValidator);

module.exports = mongoose.model("PeerTrade", peerTradeSchema);