const Markup = require('telegraf/markup')

module.exports = async (ctx) => {
  await ctx.answerCbQuery()
  await ctx.deleteMessage()

  await ctx.Mail.findByIdAndDelete(ctx.state[0])

  return ctx.replyWithHTML('Рассылка удалена', {
    reply_markup: Markup.inlineKeyboard([
      Markup.callbackButton('‹ Назад', 'admin_mail')
    ]),
    parse_mode: 'HTML'
  })
}
