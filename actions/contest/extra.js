const Markup = require('telegraf/markup')

module.exports = async (ctx) => {
  let contest = await ctx.Contest.findOne({
    _id: ctx.state[0]
  })

  if (['prize', 'maxMembers'].includes(ctx.state[1])) {
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery()

      ctx.user.state = `contest_extra_${ctx.state[0]}_${ctx.state[1]}`

      return ctx.editMessageText(
        ctx.i18n.t(`extra.enter.${ctx.state[1]}`),
        Markup.inlineKeyboard([
          Markup.callbackButton(
            ctx.i18n.t('back'),
            `contest_extra_${ctx.state[0]}`
          )
        ]).extra({ parse_mode: 'HTML' })
      )
    }

    if (
      !ctx.message.text ||
      isNaN(ctx.message.text) ||
      Number(ctx.message.text) < 0
    )
      return ctx.replyWithHTML(ctx.i18n.t(`extra.set.wrong`))

    contest = await ctx.Contest.findByIdAndUpdate(
      contest._id,
      {
        [`config.${ctx.state[1]}`]: ctx.message.text
      },
      { new: true }
    )
  } else if (['checkUsername'].includes(ctx.state[1])) {
    await ctx.answerCbQuery(
      ctx.i18n.t(
        `extra.answer.${ctx.state[1]}.${!contest.config[ctx.state[1]]}`
      ),
      true
    )

    contest = await ctx.Contest.findByIdAndUpdate(
      contest._id,
      {
        [`config.${ctx.state[1]}`]: !contest.config[ctx.state[1]]
      },
      { new: true }
    )
  } else if (ctx.state[1] === 'info')
    await ctx.answerCbQuery(
      ctx.i18n.t(`extra.answer.${ctx.state[2]}.info`),
      true
    )
  else await ctx.answerCbQuery()

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.callbackButton(
        ctx.i18n.t('extra.keys.checkUsername'),
        `contest_extra_${ctx.state[0]}_info_checkUsername`
      ),
      Markup.callbackButton(
        (contest.config.checkUsername && `✅`) || `❌`,
        `contest_extra_${ctx.state[0]}_checkUsername`
      )
    ],
    [
      Markup.callbackButton(
        ctx.i18n.t('extra.keys.prize'),
        `contest_extra_${ctx.state[0]}_info_prize`
      ),
      Markup.callbackButton(
        `${contest.config.prize} ▶️`,
        `contest_extra_${ctx.state[0]}_prize`
      )
    ],
    [
      Markup.callbackButton(
        ctx.i18n.t('extra.keys.maxMembers'),
        `contest_extra_${ctx.state[0]}_info_maxMembers`
      ),
      Markup.callbackButton(
        `${!contest.config.maxMembers ? `∞` : contest.config.maxMembers} ▶️`,
        `contest_extra_${ctx.state[0]}_maxMembers`
      )
    ],
    [Markup.callbackButton(ctx.i18n.t('back'), `contest_back_${ctx.state[0]}`)]
  ]).extra({ parse_mode: 'HTML' })

  return ctx[ctx.message ? 'reply' : 'editMessageText'](
    ctx.i18n.t('extra.text'),
    keyboard
  )
}
