const Markup = require('telegraf/markup')

const Participant = require('../../models/participant')

const play = require('../../helpers/play')
const back = require('./back')

const final = (ctx, winners) => {
  let keyboard = Markup.inlineKeyboard(
    winners.map((winner) =>
      Markup.callbackButton(
        winner.name,
        `contest_play_${ctx.state[0]}_winner_${winner.id}`
      )
    ),
    { columns: 2 }
  )

  const mainKeyboard = [
    [
      Markup.callbackButton(
        ctx.i18n.t('play.again'),
        `contest_play_${ctx.state[0]}_again`
      )
    ],
    [Markup.callbackButton(ctx.i18n.t('back'), `contest_back_${ctx.state[0]}`)]
  ]

  if (keyboard.inline_keyboard) keyboard.inline_keyboard.push(...mainKeyboard)
  else keyboard = Markup.inlineKeyboard(mainKeyboard)

  return ctx.editMessageText(
    ctx.i18n.t('play.alreadyPlayed'),
    keyboard.extra({ parse_mode: 'HTML' })
  )
}

module.exports = async (ctx) => {
  let [contest, members, winners] = await Promise.all([
    ctx.Contest.findOne({
      _id: ctx.state[0]
    }),
    Participant.countDocuments({
      contest: ctx.state[0],
      status: { $nin: ['banned', 'unsubscribed'] }
    }),
    Participant.find({ contest: ctx.state[0], status: 'win' })
  ])

  if (ctx.state[1] === 'winner') {
    const result = await play(contest, ctx.telegram, Number(ctx.state[2]))
    if (!result) return ctx.answerCbQuery(ctx.i18n.t('play.notEnough'), true)
    await ctx.answerCbQuery()

    winners = await Participant.find({ contest: ctx.state[0], status: 'win' })
    return final(ctx, winners)
  }
  if (contest.config.status && !ctx.state[1]) return final(ctx, winners)

  if (!members || members < contest.config.prize || members === 1)
    return ctx.answerCbQuery(ctx.i18n.t('play.notEnough'), true)

  const result = await play(contest, ctx.telegram)
  if (!result) return ctx.answerCbQuery(ctx.i18n.t('play.notEnough'), true)

  await ctx.answerCbQuery(ctx.i18n.t('play.inProcess'), true)

  ctx.user.contests.played = ctx.user.contests.played + 1

  await ctx.Contest.updateOne(
    { _id: ctx.state[0] },
    { 'config.status': true, 'config.playAt': undefined }
  )

  return back(ctx)
}
