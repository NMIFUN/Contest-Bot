const Markup = require('telegraf/markup')

module.exports = async (ctx) => {
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery()
    await ctx.deleteMessage()

    if (ctx.state[1]) {
      const mail = await ctx.Mail.findByIdAndUpdate(ctx.state[0], {
        lang: null
      })
      return ctx.replyWithHTML('Язык удален', {
        reply_markup: Markup.inlineKeyboard([
          Markup.callbackButton(
            'Продолжить настройку',
            `admin_mail_id_${mail._id}`
          )
        ])
      })
    }

    ctx.user.state = `admin_mail_lang_${ctx.state[0]}`

    return ctx.replyWithHTML('Введите язык.\n\nПример: ru', {
      reply_markup: Markup.inlineKeyboard([
        Markup.callbackButton('‹ Назад', `admin_mail_id_${ctx.state[0]}`)
      ]),
      parse_mode: 'HTML'
    })
  } else {
    const mail = await ctx.Mail.findByIdAndUpdate(ctx.state[0], {
      lang: ctx.message.text
    })

    ctx.user.state = null

    return ctx.replyWithHTML('Язык сохранен', {
      reply_markup: Markup.inlineKeyboard([
        Markup.callbackButton(
          'Продолжить настройку',
          `admin_mail_id_${mail._id}`
        )
      ])
    })
  }
}
