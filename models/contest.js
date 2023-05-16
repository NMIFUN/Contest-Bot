const mongoose = require('mongoose')

let Contest = mongoose.Schema({
  key: {
    type: String,
    index: true,
    unique: true,
    required: true
  },
  creator: {
    type: Number,
    index: true
  },
  createdAt: Date,
  name: String,
  subscription: Array,
  config: {
    status: { type: Boolean, default: false },
    maxMembers: {
      type: Number,
      default: 0
    },
    prize: {
      type: Number,
      default: 1
    },
    playAt: Date,
    unsubscribe: { type: Boolean, default: false },
    checkUsername: { type: Boolean, default: false }
  },
  post: {
    false: Object,
    true: Object,
    preview: { type: Boolean, default: false },
    time: Date,
    channels: Array
  },
  lastPostsUpdate: Object,
  posts: Array,
  deleted: { type: Boolean, default: false },
  language: String,
  bot: Number,
  participantsCount: {
    type: Number,
    default: 0
  }
})
Contest = mongoose.model('Contest', Contest)

module.exports = Contest
