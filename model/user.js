const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true},
  metamask_address: { type: String, required: true, unique: true }
},
{collection: 'users'})

const model = mongoose.model('UserSchema', UserSchema)

module.exports = model
