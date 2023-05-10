const Markup = require('telegraf/markup')
const lauchWorker = require('../mail/lauchWorker')

module.exports = async (ctx) => {
  await ctx.answerCbQuery()
  await ctx.deleteMessage()

  const mail = await ctx.Mail.findByIdAndUpdate(ctx.state[0], {
    status: 'doing'
  })
  lauchWorker(mail._id)

  return ctx.replyWithHTML('Рассылка запущена', {
    reply_markup: Markup.inlineKeyboard([
      Markup.callbackButton('Просмотр', `admin_mail_id_${ctx.state[0]}`)
    ]),
    parse_mode: 'HTML'
  })
}
