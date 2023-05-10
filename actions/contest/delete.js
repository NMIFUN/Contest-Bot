const Markup = require('telegraf/markup')

const back = require('./back')

module.exports = async (ctx) => {
  await ctx.answerCbQuery()

  if (ctx.state[1]) {
    ctx.user.contests.deleted = ctx.user.contests.deleted + 1
    await ctx.Contest.updateOne({ _id: ctx.state[0] }, { deleted: true })

    await ctx.editMessageText(ctx.i18n.t(`delete.success`))

    return back({ ...ctx, message: {}, state: [] })
  } else {
    return ctx.editMessageText(
      ctx.i18n.t(`delete.text`),
      Markup.inlineKeyboard([
        [
          Markup.callbackButton(
            ctx.i18n.t(`delete.yes`),
            `contest_delete_${ctx.state[0]}_yes`
          )
        ],
        [
          Markup.callbackButton(
            ctx.i18n.t('back'),
            `contest_back_${ctx.state[0]}`
          )
        ]
      ]).extra()
    )
  }
}
