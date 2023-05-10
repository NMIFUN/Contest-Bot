const contestShow = require('../../helpers/contestShow')
const Contest = require('../../models/contest')
const create = require('../create')

module.exports = async (ctx) => {
  ctx.user.state = null

  const contests = await Contest.find({
    creator: ctx.user.id,
    bot: ctx.botInfo.id,
    deleted: false
  })
  if (!contests.length) return create(ctx)

  let shift = contests.findIndex((contest) => {
    return `${contest._id}` === ctx.state[0]
  })
  let contest = contests[shift]

  if (shift === -1) {
    shift = 0

    contest = await Contest.findOne({ _id: ctx.state[0] })
    if (!contest) contest = contests[shift]
  }

  const { text, keyboard } = await contestShow(contest, ctx, shift)

  return ctx[ctx.message ? 'reply' : 'editMessageText'](
    text,
    keyboard.extra({ parse_mode: 'HTML' })
  )
}
