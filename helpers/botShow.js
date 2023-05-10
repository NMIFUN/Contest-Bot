const Markup = require('telegraf/markup')

const botShow = async (bot, ctx, shift) => {
  const keyboard = Markup.inlineKeyboard([
    [Markup.urlButton(bot.name, `https://t.me/${bot.username}`)],
    [
      Markup.callbackButton(
        ctx.i18n.t('bot.keys.updateToken'),
        `bot_updateToken_${bot._id}`
      ),
      Markup.callbackButton(
        ctx.i18n.t('bot.keys.delete'),
        `bot_delete_${bot._id}`
      )
    ],
    [
      Markup.callbackButton(`◀️`, `bot_navigation_${shift - 1}`),
      Markup.callbackButton(`🔄`, `bot_navigation_${shift}`),
      Markup.callbackButton(`▶️`, `bot_navigation_${shift + 1}`)
    ],
    [Markup.callbackButton(ctx.i18n.t('bot.keys.create'), `bot_create`)]
  ])

  const text = `@${bot.username}
  
${ctx.i18n.t('bot.description')}`

  return { text, keyboard }
}

module.exports = botShow
