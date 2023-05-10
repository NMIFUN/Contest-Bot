const dayjs = require('dayjs')
dayjs
  .extend(require('dayjs/plugin/localizedFormat'))
  .extend(require('dayjs/plugin/customParseFormat'))
  .extend(require('dayjs/plugin/relativeTime'))

const Markup = require('telegraf/markup')

module.exports = async (ctx) => {
  const contest = await ctx.Contest.findOne({
    _id: ctx.state[0]
  })

  if (ctx.callbackQuery) {
    await ctx.answerCbQuery()

    ctx.user.state = `contest_playAt_${ctx.state[0]}`

    return ctx.editMessageText(
      ctx.i18n.t('playAt.text', {
        time: dayjs(contest.config.playAt).format('D.M.YYYY H:mm')
      }),
      {
        reply_markup: Markup.inlineKeyboard([
          Markup.callbackButton(
            ctx.i18n.t('back'),
            `contest_back_${ctx.state[0]}`
          )
        ]),
        parse_mode: 'HTML'
      }
    )
  } else {
    const enterDate = dayjs(ctx.message.text, [
      'D.M.YYYY H:m',
      'D.M.YY H:m',
      'D.M H.m'
    ])

    if (!enterDate.isValid())
      return ctx.replyWithHTML(ctx.i18n.t('playAt.wrong.invalid'))
    else if (!enterDate.isAfter(Date.now()))
      return ctx.replyWithHTML(
        ctx.i18n.t('playAt.wrong.before', {
          time: dayjs().format('D.M.YYYY H:mm')
        })
      )
    else {
      ctx.user.state = null

      await ctx.Contest.updateOne(
        { _id: ctx.state[0] },
        { 'config.playAt': enterDate.valueOf() }
      )

      return ctx.replyWithHTML(
        ctx.i18n.t('playAt.success', {
          time: dayjs(enterDate).format('D.M.YYYY H:mm')
        }),
        Markup.inlineKeyboard([
          Markup.callbackButton(
            ctx.i18n.t('back'),
            `contest_back_${ctx.state[0]}`
          )
        ]).extra()
      )
    }
  }
}
