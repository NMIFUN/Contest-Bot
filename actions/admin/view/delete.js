const Markup = require('telegraf/markup')

module.exports = async (ctx) => {
  await ctx.answerCbQuery()
  await ctx.deleteMessage()

  await ctx.View.findByIdAndDelete(ctx.state[0])

  return ctx.replyWithHTML('Просмотры удалены', {
    reply_markup: Markup.inlineKeyboard([
      Markup.callbackButton('‹ Назад', 'admin_view')
    ]),
    parse_mode: 'HTML'
  })
}
