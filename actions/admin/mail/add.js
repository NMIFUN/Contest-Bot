const Markup = require('telegraf/markup')

module.exports = async (ctx) => {
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery()
    await ctx.deleteMessage()

    ctx.user.state = 'admin_mail_add'
    return ctx.replyWithHTML('Отправьте любой пост в готовом виде.', {
      reply_markup: Markup.inlineKeyboard([
        Markup.callbackButton('‹ Назад', 'admin_mail')
      ]),
      parse_mode: 'HTML'
    })
  } else {
    const mail = ctx.Mail({
      uid: ctx.from.id,
      message: ctx.message,
      keyboard: ctx.message?.reply_markup?.inline_keyboard,
      status: 'notStarted'
    })
    await mail.save()
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
