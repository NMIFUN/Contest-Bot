const Markup = require('telegraf/markup')

module.exports = async (ctx) => {
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery()
    await ctx.deleteMessage()

    if (ctx.state[1]) {
      const view = await ctx.View.findByIdAndUpdate(ctx.state[0], {
        $unset: { endDate: 1 }
      })
      return ctx.replyWithHTML('Дата и время удалены', {
        reply_markup: Markup.inlineKeyboard([
          Markup.callbackButton(
            'Продолжить настройку',
            `admin_view_id_${view._id}`
          )
        ])
      })
    }

    ctx.user.state = `admin_view_endDate_${ctx.state[0]}`

    return ctx.replyWithHTML(
      'Введите дату и время конца показа просмотров.\n\nПример: 2022.09.26 12:30',
      {
        reply_markup: Markup.inlineKeyboard([
          Markup.callbackButton('‹ Назад', `admin_view_id_${ctx.state[0]}`)
        ]),
        parse_mode: 'HTML'
      }
    )
  } else {
    const view = await ctx.View.findByIdAndUpdate(ctx.state[0], {
      endDate: new Date(ctx.message.text)
    })

    ctx.user.state = null

    return ctx.replyWithHTML('Дата и время конца показа просмотров сохранено', {
      reply_markup: Markup.inlineKeyboard([
        Markup.callbackButton(
          'Продолжить настройку',
          `admin_view_id_${view._id}`
        )
      ])
    })
  }
}
