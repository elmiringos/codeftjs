const mongoose = require('mongoose')

const TokenOwnerSchema = new mongoose.Schema({
  username: { type: String, required: true },
  owner_address: { type: String, required: true },
  token_address: { type: String, required: true },
  path_to_file: { type: String, required: true, unique: true },
  project_name: {type: String, required: true, unique: true },
  count: {type: Number, required: true},
},
{collection: 'TokenOwner'})

const model = mongoose.model('TokenOwnerSchema', TokenOwnerSchema);

module.exports = model;