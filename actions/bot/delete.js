const Markup = require('telegraf/markup')

module.exports = async (ctx) => {
  await ctx.answerCbQuery()

  if (ctx.state[1]) {
    await ctx.Bot.updateOne({ _id: ctx.state[0] }, { deleted: true })

    return ctx.editMessageText(ctx.i18n.t(`bot.delete.success`))
  } else {
    return ctx.editMessageText(
      ctx.i18n.t(`bot.delete.text`),
      Markup.inlineKeyboard([
        [
          Markup.callbackButton(
            ctx.i18n.t(`bot.delete.yes`),
            `bot_delete_${ctx.state[0]}_yes`
          )
        ],
        [Markup.callbackButton(ctx.i18n.t('back'), `bot_back_${ctx.state[0]}`)]
      ]).extra()
    )
  }
}
