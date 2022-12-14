const mongoose = require('mongoose')

const TokenSchema = new mongoose.Schema({
  username: { type: String, required: true },
  owner_address: { type: String },
  token_address: { type: String, required: true },
  path_to_file: { type: String, required: true, unique: true },
  total_number: { type: Number, required: true  },
  info: {type: String, required: true },
  project_name: {type: String, required: true, unique: true },
  price: {type: Number, required: true},
},
{collection: 'tokens'})

const model = mongoose.model('TokenSchema', TokenSchema);

module.exports = model;
