const mongoose = require('mongoose')

let User = mongoose.Schema(
  {
    id: {
      type: Number,
      index: true,
      required: true
    },
    name: String,
    username: String,
    state: String,
    lang: String,
    ban: {
      type: Boolean,
      default: false
    },
    langCode: String,
    alive: {
      type: Boolean,
      default: true
    },
    from: String,
    lastMessage: Date,
    contests: {
      created: { type: Number, default: 0 },
      played: { type: Number, default: 0 },
      deleted: { type: Number, default: 0 }
    },
    bot: Number
  },
  {
    timestamps: true
  }
)
User.index({ id: 1, bot: 1 }, { unique: true })
User = mongoose.model('User', User)

module.exports = User
