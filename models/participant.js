const mongoose = require('mongoose')

let Participant = mongoose.Schema({
  id: {
    type: Number,
    index: true
  },
  username: String,
  name: String,
  contest: { type: mongoose.Schema.Types.ObjectId, ref: 'Contest' },
  status: {
    type: String,
    enum: ['active', 'banned', 'unsubscribed', 'win', 'lose']
  },
  registerDate: Date
})
Participant.index({ id: 1, contest: 1 }, { unique: true })
Participant = mongoose.model('Participant', Participant)

module.exports = Participant
