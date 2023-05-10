const contestShow = require('../../helpers/contestShow')
const Contest = require('../../models/contest')
const create = require('../create')

module.exports = async (ctx) => {
  ctx.user.state = null

  const count = await Contest.countDocuments({
    creator: ctx.user.id,
    bot: ctx.botInfo.id,
    deleted: false
  })
  if (!count) return create(ctx)

  let shift = 0

  if (!isNaN(ctx.state[0])) shift = Number(ctx.state[0])
  else if (ctx.state[0] === 'start') shift = 0
  else if (ctx.state[0] === 'end') shift = count - 1

  if (shift < 0 || count <= shift)
    return ctx[ctx.message ? 'reply' : 'answerCbQuery'](
      ctx.i18n.t('contest.error')
    )

  if (ctx.callbackQuery) await ctx.answerCbQuery()

  const contest = await Contest.findOne({
    creator: ctx.user.id,
    bot: ctx.botInfo.id,
    deleted: false
  }).skip(shift)

  const { text, keyboard } = await contestShow(contest, ctx, shift)

  return ctx[ctx.message ? 'reply' : 'editMessageText'](
    text,
    keyboard.extra({ parse_mode: 'HTML' })
  )
}
