const mongoose = require('mongoose')

let Mail = mongoose.Schema({
  uid: Number,
  message: Object,
  keyboard: { type: Array, default: [] },
  status: { type: String, default: '' },
  quantity: { type: Number, default: 0 },
  lang: { type: String, default: null },
  preview: { type: Boolean, default: true },
  success: { type: Number, default: 0 },
  unsuccess: { type: Number, default: 0 },
  all: { type: Number, default: 0 },
  startDate: Date,
  endDate: Date,
  errorsCount: { type: Object, default: {} }
})
Mail = mongoose.model('Mail', Mail)

module.exports = Mail
