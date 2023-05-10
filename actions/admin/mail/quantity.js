const Markup = require('telegraf/markup')

module.exports = async (ctx) => {
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery()
    await ctx.deleteMessage()

    if (ctx.state[1]) {
      const mail = await ctx.Mail.findByIdAndUpdate(ctx.state[0], {
        quantity: 0
      })
      return ctx.replyWithHTML('Кол-во пользоваталей удалено', {
        reply_markup: Markup.inlineKeyboard([
          Markup.callbackButton(
            'Продолжить настройку',
            `admin_mail_id_${mail._id}`
          )
        ])
      })
    }

    ctx.user.state = `admin_mail_quantity_${ctx.state[0]}`

    return ctx.replyWithHTML('Введите кол-во получателей', {
      reply_markup: Markup.inlineKeyboard([
        Markup.callbackButton('‹ Назад', `admin_mail_id_${ctx.state[0]}`)
      ]),
      parse_mode: 'HTML'
    })
  } else {
    const mail = await ctx.Mail.findByIdAndUpdate(ctx.state[0], {
      quantity: ctx.message.text
    })

    ctx.user.state = null

    return ctx.replyWithHTML('Кол-во получателей сохранено', {
      reply_markup: Markup.inlineKeyboard([
        Markup.callbackButton(
          'Продолжить настройку',
          `admin_mail_id_${mail._id}`
        )
      ])
    })
  }
}
