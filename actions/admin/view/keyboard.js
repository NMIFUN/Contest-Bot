const Markup = require('telegraf/markup')

module.exports = async (ctx) => {
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery()
    await ctx.deleteMessage()

    if (ctx.state[1]) {
      const view = await ctx.View.findByIdAndUpdate(ctx.state[0], {
        keyboard: []
      })
      return ctx.replyWithHTML('Клавиатура удалена', {
        reply_markup: Markup.inlineKeyboard([
          Markup.callbackButton(
            'Продолжить настройку',
            `admin_view_id_${view._id}`
          )
        ])
      })
    }
    ctx.user.state = `admin_view_keyboard_${ctx.state[0]}`

    return ctx.replyWithHTML(
      `Введите список кнопок в следующем формате:

<code>Кнопка 1 http://example1.com</code>

<i>Используйте разделитель "|", чтобы добавить кнопки в один ряд:</i>

<code>Кнопка 1 http://example1.com | Кнопка 2 http://example2.com
Кнопка 3 http://example3.com | Кнопка 4 http://example4.com</code>`,
      {
        reply_markup: Markup.inlineKeyboard([
          Markup.callbackButton('‹ Назад', `admin_view_id_${ctx.state[0]}`)
        ]),
        parse_mode: 'HTML'
      }
    )
  } else {
    const possibleUrls = [
      'http://',
      'https://',
      'tg://',
      'ton://',
      't.me/',
      'telegram.me/'
    ]

    const splitByEnter = ctx.message.text.split('\n')

    const keyboard = splitByEnter.map((enter) => {
      const splitByWand = enter.split('|')

      return splitByWand.map((wand) => {
        const indexOfUrl = wand.indexOf(
          possibleUrls.find((url) => wand.includes(url))
        )
        if (indexOfUrl === -1) return false

        const key = {
          text: wand.slice(0, indexOfUrl).replace(' - ', '').trim(),
          url: wand.slice(indexOfUrl).trim()
        }

        return key.text && key.url ? key : false
      })
    })

    if (
      keyboard.findIndex(
        (enterKeyboard) => enterKeyboard.findIndex((key) => !key) !== -1
      ) !== -1
    )
      return ctx.reply('Ошибка при построении клавиатуры')

    ctx.user.state = null

    const view = await ctx.View.findByIdAndUpdate(ctx.state[0], {
      keyboard
    })
    return ctx.replyWithHTML('Клавиатура сохранена', {
      reply_markup: Markup.inlineKeyboard([
        Markup.callbackButton(
          'Продолжить настройку',
          `admin_view_id_${view._id}`
        )
      ])
    })
  }
}
