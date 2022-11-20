const mongoose = require('mongoose')

const TokenSchema = new mongoose.Schema({
  metamask_address: { type: String, required: true, unique: true },
  token_address: { type: String, required: true, unique: true },
  path_to_file: { type: String, required: true, unique: true }
},
{collection: 'tokens'})

const model = mongoose.model('TokenSchema', TokenSchema)

module.exports = model
