const mongoose = require('mongoose')

let View = mongoose.Schema({
  message: Object,
  keyboard: { type: Array, default: [] },
  status: { type: String, default: 'notStarted', index: true },
  quantity: { type: Number, default: 0 },
  lang: { type: String, default: null },
  preview: { type: Boolean, default: true },
  unique: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
  users: Array,
  startDate: { type: Date, index: true },
  endDate: { type: Date, index: true }
})
View = mongoose.model('View', View)

module.exports = View
