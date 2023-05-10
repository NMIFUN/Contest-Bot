const create = require('./create')

const Bot = require('../../models/bot')

const botShow = require('../../helpers/botShow')

module.exports = async (ctx) => {
  ctx.user.state = null

  const count = await Bot.countDocuments({
    creator: ctx.user.id,
    deleted: false
  })
  if (!count) return create(ctx)

  let shift = 0

  if (!isNaN(ctx.state[0])) shift = Number(ctx.state[0])

  if (shift < 0 || count <= shift)
    return ctx[ctx.message ? 'reply' : 'answerCbQuery'](ctx.i18n.t('bot.error'))

  if (ctx.callbackQuery) await ctx.answerCbQuery()

  const bot = await Bot.findOne({
    creator: ctx.user.id,
    deleted: false
  }).skip(shift)

  const { text, keyboard } = await botShow(bot, ctx, shift)

  return ctx[ctx.message ? 'reply' : 'editMessageText'](
    text,
    keyboard.extra({ parse_mode: 'HTML' })
  )
}
