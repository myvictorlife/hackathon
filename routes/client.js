const express = require('express'),
	router = express.Router(),
	Client = require('../models/client'),
	ObjectId = require('mongodb').ObjectID,
	randomID = require("random-id");

router.route('/save').post(function(req, res) {
	var clientSchema = new Client({
		protocol: randomID(10,"0"),
		name: req.body.name,
		email: req.body.email,
		phone: req.body.phone,
		cpf: req.body.cpf,
		category: req.body.category
	});

	clientSchema.save(function(err, result) {

		if (err) {
			res.json({
				status: false,
				message: err.message
			})
		} else {
			res.json({
				status: true,
				message: 'Protocolo gerado com sucesso'
			})
		}
	})
})

router.route('/findByCpf/:cpf').get(function(req, res) {

	Client.find({cpf: req.params.cpf}, function(err, protocols) {
		if (err) {
			res.json(err)
		} else if (protocols) {
			res.json(protocols);
		} else {
			res.json({
				'status': false,
				'message': 'Nenhum usuário encontrado'
			});
		}
	})
})

module.exports = router