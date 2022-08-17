const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const p2pSchema = mongoose.Schema({
  name: {type: String, required: true},
  timeLimit: {type: Number, required: true},
  type: {type: String, required: true},
  price: {type: Number, required: true},
  fiatCurr: {type: String, required: true}, //Bank Currency accepted by the Peer offering the crypto
  inStock: {type: Number, required: true}, //Amount of crypto left in stock
  cryptoCurr: {type: String, required: true}, //The Cryptocurrency being offered
  upperLimit: {type: Number, required: true}, //Maximum amount of crypto that can be bought at a time
  lowerLimit: {type: Number, required: true}, //Minimum amount of crypto that can be bought a time.
  paymentMethods: {type: Array, required: true},
}, { timestamps: true });

p2pSchema.plugin(uniqueValidator);

module.exports = mongoose.model("PeerOffer", p2pSchema);