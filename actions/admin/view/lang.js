const Markup = require('telegraf/markup')

module.exports = async (ctx) => {
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery()
    await ctx.deleteMessage()

    if (ctx.state[1]) {
      const view = await ctx.View.findByIdAndUpdate(ctx.state[0], {
        lang: null
      })
      return ctx.replyWithHTML('Язык удален', {
        reply_markup: Markup.inlineKeyboard([
          Markup.callbackButton(
            'Продолжить настройку',
            `admin_view_id_${view._id}`
          )
        ])
      })
    }

    ctx.user.state = `admin_view_lang_${ctx.state[0]}`

    return ctx.replyWithHTML('Введите язык.\n\nПример: ru', {
      reply_markup: Markup.inlineKeyboard([
        Markup.callbackButton('‹ Назад', `admin_view_id_${ctx.state[0]}`)
      ]),
      parse_mode: 'HTML'
    })
  } else {
    const view = await ctx.View.findByIdAndUpdate(ctx.state[0], {
      lang: ctx.message.text
    })

    ctx.user.state = null

    return ctx.replyWithHTML('Язык сохранен', {
      reply_markup: Markup.inlineKeyboard([
        Markup.callbackButton(
          'Продолжить настройку',
          `admin_view_id_${view._id}`
        )
      ])
    })
  }
}
