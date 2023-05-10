const Markup = require('telegraf/markup')

module.exports = async (ctx) => {
  await ctx.answerCbQuery()
  await ctx.deleteMessage()

  const mail = await ctx.Mail.findById(ctx.state[0])
  mail.preview = !mail.preview
  await mail.save()

  return ctx.replyWithHTML(
    `Превью ${mail.preview ? 'включено' : 'выключено'}.`,
    {
      reply_markup: Markup.inlineKeyboard([
        Markup.callbackButton(
          'Продолжить настройку',
          `admin_mail_id_${ctx.state[0]}`
        )
      ]),
      parse_mode: 'HTML'
    }
  )
}
