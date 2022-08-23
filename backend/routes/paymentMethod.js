const Transaction = require('../models/transaction')
const User = require('../models/user')
const PaymentMethod = require('../models/paymentMethod')

exports.add = function(req, res, next){ //ADD PAYMENT METHOD
	const email = req.body.email
	const paymentMethod = new PaymentMethod({
		name: req.body.name,
		address: req.body.address,
		bank: req.body.bank,
		type: req.body.type
	})
	User.findOne({'email': email})
	.then(user => {
		console.log(user.paymentMethods);
		if(!user){
			res.status(404).json({
				message: 'User not found!'
			})
			return
		}
		if(user.paymentMethods.includes(paymentMethod.type)){
			res.status(200).json({
				message: 'Payment method already exists'
			})
			return
		}
		User.findByIdAndUpdate(user._id, {$push: {paymentMethods: paymentMethod}})
		.then(result => {
			console.log(result);
			res.status(200).json({
				message: 'Added payment method!'
			})
		})

	}).catch( err => {
			console.log('Error', err)
	})
}

exports.methods = function(req, res, next){ //GET PAYMENT METHODS
	const email = req.query.email;
	User.findOne({'email': email})
	.then(user => {
		res.status(200).json({
			message: 'Payment methods found',
			methods: user.paymentMethods
		})
	})
}