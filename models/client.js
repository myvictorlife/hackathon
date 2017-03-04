// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema

mongoose.connect( 'mongodb://localhost:27017/algarchat' );

// create a schema
var clientSchema = new Schema({
  protocol: String,
  name: String,
  email: String,
  phone: String,
  cpf: String,
  category: String,
  created_at:  { type: Date, default: Date.now }
});

var ClientSchema = mongoose.model('client', clientSchema);
module.exports = ClientSchema;