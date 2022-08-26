const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const paymentMethodSchema = mongoose.Schema({
  type: {type: String, required: false},
  name: {type: String, required: true, unique: true},
  address: { type: Number, required: true, unique: true },
  bank: {type: String, required: false}
});

paymentMethodSchema.plugin(uniqueValidator);

module.exports = mongoose.model("PaymentMethod", paymentMethodSchema);
