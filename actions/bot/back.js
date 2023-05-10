const botShow = require('../../helpers/botShow')
const create = require('./create')

module.exports = async (ctx) => {
  ctx.user.state = null

  const bots = await ctx.Bot.find({ creator: ctx.user.id, deleted: false })
  if (!bots.length) return create(ctx)

  let shift = bots.findIndex((bot) => {
    return `${bot._id}` === ctx.state[0]
  })
  let bot = bots[shift]

  if (shift === -1) {
    shift = 0

    bot = await ctx.Bot.findOne({ _id: ctx.state[0] })
    if (!bot) bot = bots[shift]
  }

  const { text, keyboard } = await botShow(bot, ctx, shift)

  return ctx[ctx.message ? 'reply' : 'editMessageText'](
    text,
    keyboard.extra({ parse_mode: 'HTML' })
  )
}
