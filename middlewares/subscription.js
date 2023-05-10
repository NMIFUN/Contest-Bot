const config = require('../config')
const Markup = require('telegraf/markup')
const asyncFilter = async (arr, predicate) =>
  Promise.all(arr.map(predicate)).then((results) =>
    arr.filter((_v, index) => results[index])
  )
const start = require('../actions/start')
const { Telegraf } = require('telegraf')

module.exports = async (ctx, next) => {
  if (config.admins.includes(ctx.from.id) || ctx?.chat?.type !== 'private') {
    return next()
  }

  let notSubscribed = []
  const channels = config.subsChannels?.filter((channel) =>
    [undefined, ctx.user?.lang, 'all'].includes(channel.lang)
  )
  if (channels?.length) {
    notSubscribed = await asyncFilter(channels, async (channel) => {
      const check =
        (await ctx.telegram
          .getChatMember(channel.id, ctx.from.id)
          .catch(() => {})) || {}

      return ['left', 'kicked'].includes(check.status)
    })
  }

  const bots = config.subsBots?.filter((channel) =>
    [undefined, ctx.user?.lang, 'all'].includes(channel.lang)
  )
  if (bots?.length) {
    notSubscribed = notSubscribed.concat(
      await asyncFilter(bots, async (bot) => {
        const connectedBot = new Telegraf(bot.token)
        const check =
          (await connectedBot.telegram
            .sendChatAction(ctx.from.id, 'typing')
            .catch(() => {})) || false

        return !check
      })
    )
  }

  if (notSubscribed.length) {
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery(ctx.i18n.t('subscribe.notif'))
    }

    return ctx[
      ctx.message || !ctx.callbackQuery.message.text
        ? 'replyWithHTML'
        : 'editMessageText'
    ](ctx.i18n.t('subscribe.text'), {
      parse_mode: 'HTML',
      reply_markup: Markup.inlineKeyboard(
        [
          ...notSubscribed.map((channel, index) => {
            return Markup.urlButton(
              `${ctx.i18n.t(
                `subscribe.${channel.token ? 'bot' : 'channel'}`
              )} №${index + 1}`,
              channel.link
            )
          }),
          Markup.callbackButton(
            ctx.i18n.t('subscribe.key.check'),
            'subscription'
          )
        ],
        { columns: 1 }
      ),
      disable_web_page_preview: true
    })
  }

  if (ctx.callbackQuery?.data === 'subscription') {
    await ctx.answerCbQuery()
    await ctx.editMessageText(ctx.i18n.t('subscribe.success'))

    return start(ctx)
  }

  return next()
}
