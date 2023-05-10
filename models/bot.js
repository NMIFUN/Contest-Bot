const mongoose = require('mongoose')

let Bot = mongoose.Schema({
  id: {
    type: Number,
    index: true,
    unique: true,
    required: true
  },
  name: String,
  username: String,
  token: {
    type: String,
    index: true
  },
  creator: Number,
  deleted: { type: Boolean, default: false }
})
Bot = mongoose.model('Bot', Bot)

module.exports = Bot
