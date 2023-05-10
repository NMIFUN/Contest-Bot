const Contest = require('../../models/contest')
const ObjectId = require('mongoose').Types.ObjectId

const contestShow = require('../../helpers/contestShow')

const config = require('../../config.json')

module.exports = async (ctx) => {
  if (!config.admins.includes(ctx.from.id)) return

  const id = ctx.message.text.split(' ')
  if (!id[1]) return ctx.replyWithHTML('<code>/contest </code>id/key')

  const contest = await Contest.findOne({
    [`${ObjectId.isValid(id[1]) ? '_id' : 'key'}`]: id[1]
  })

  const { text, keyboard } = await contestShow(contest, ctx, 0)

  return ctx.reply(text, keyboard.extra({ parse_mode: 'HTML' }))
}
