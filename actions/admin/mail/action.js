const Markup = require('telegraf/markup')
const lauchWorker = require('../mail/lauchWorker')

module.exports = async (ctx) => {
  await ctx.answerCbQuery()
  await ctx.deleteMessage()

  const updateObject = {}
  if (ctx.state[1] === 'stop') updateObject.status = 'stopped'
  else if (ctx.state[1] === 'pause') updateObject.status = 'paused'
  else if (ctx.state[1] === 'continue') {
    updateObject.status = 'doing'
    lauchWorker(ctx.state[0])
  }

  await ctx.Mail.findByIdAndUpdate(ctx.state[0], updateObject)

  return ctx.replyWithHTML(
    `Рассылка ${
      ctx.state[1] === 'stop'
        ? 'остановлена'
        : ctx.state[1] === 'pause'
        ? 'приостановлена'
        : 'возобновлена'
    }`,
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
