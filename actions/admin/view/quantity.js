const Markup = require('telegraf/markup')

module.exports = async (ctx) => {
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery()
    await ctx.deleteMessage()

    if (ctx.state[1]) {
      const view = await ctx.View.findByIdAndUpdate(ctx.state[0], {
        quantity: 0
      })
      return ctx.replyWithHTML('Кол-во пользоваталей удалено', {
        reply_markup: Markup.inlineKeyboard([
          Markup.callbackButton(
            'Продолжить настройку',
            `admin_view_id_${view._id}`
          )
        ])
      })
    }

    ctx.user.state = `admin_view_quantity_${ctx.state[0]}`

    return ctx.replyWithHTML('Введите максимальное кол-во получателей', {
      reply_markup: Markup.inlineKeyboard([
        Markup.callbackButton('‹ Назад', `admin_view_id_${ctx.state[0]}`)
      ]),
      parse_mode: 'HTML'
    })
  } else {
    const view = await ctx.View.findByIdAndUpdate(ctx.state[0], {
      quantity: ctx.message.text
    })

    ctx.user.state = null

    return ctx.replyWithHTML('Кол-во получателей сохранено', {
      reply_markup: Markup.inlineKeyboard([
        Markup.callbackButton(
          'Продолжить настройку',
          `admin_view_id_${view._id}`
        )
      ])
    })
  }
}
