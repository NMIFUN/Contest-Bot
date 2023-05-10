const Markup = require('telegraf/markup')

module.exports = (ctx) => {
  const keyboard = [
    ctx.i18n.t('start.keys.create'),
    ctx.i18n.t('start.keys.contests')
  ]

  // if (ctx.botInfo.creator) keyboard.push(ctx.i18n.t('start.keys.myBot'))
  // else keyboard.push(ctx.i18n.t('start.keys.bots'))

  return Markup.keyboard(keyboard, { columns: 2 }).resize()
}
