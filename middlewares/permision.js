const express = require('express')

var permision = function(req, res, next){
	// check header or url parameters or post parameters for token
	var token = req.body.token || req.query.token || req.headers['x-access-token'];
	// decode token
    if (token) {

	    if(token === 'S8H6YDmqZwS59TX0W3p7K79g4lv94Bp0'){
        	next()
	    }else{
	        return res.status(200).send({ success: true, message: 'Token invalido.' });

	    }

  	} else {
	    // return an error
	    // return res.status(200).send({ 
	    //     success: false, 
	    //     message: 'Token não foi inserido.' 
	    // });
	    next()
  	}
};

module.exports = permision;