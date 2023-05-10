const Markup = require('telegraf/markup')

module.exports = async (ctx) => {
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery()
    ctx.user.state = `admin_mail_editPost_${ctx.state[0]}`
    await ctx.deleteMessage()

    return ctx.replyWithHTML('Отправьте любой пост в готовом виде.', {
      reply_markup: Markup.inlineKeyboard([
        Markup.callbackButton('‹ Назад', `admin_mail_id_${ctx.state[0]}`)
      ]),
      parse_mode: 'HTML'
    })
  } else {
    const mail = await ctx.Mail.findByIdAndUpdate(ctx.state[0], {
      keyboard: ctx.message?.reply_markup?.inline_keyboard,
      message: ctx.message
    })
    ctx.user.state = null

    return ctx.replyWithHTML('Пост сохранен', {
      reply_markup: Markup.inlineKeyboard([
        Markup.callbackButton(
          'Продолжить настройку',
          `admin_mail_id_${mail._id}`
        )
      ])
    })
  }
}
