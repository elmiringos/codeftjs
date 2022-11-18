const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
  metamask_address: { type: String, required: true, unique: true },
  token_address: { type: String, required: true, unique: true },
  path_to_file: { type: String, required: true, unique: true }
},
{collection: 'tokens'})

const model = mongoose.model('UserSchema', UserSchema)

module.exports = model
