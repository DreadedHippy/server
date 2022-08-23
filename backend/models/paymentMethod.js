const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const paymentMethodSchema = mongoose.Schema({
  type: {type: String, required: false},
  name: {type: String, required: true, unique: true},
  number: { type: Number, required: true, unique: true },
  bank: {type: String, required: false}
});

paymentMethodSchema.plugin(uniqueValidator);

module.exports = mongoose.model("PaymentMethods", paymentMethodSchema);
