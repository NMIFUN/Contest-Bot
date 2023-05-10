const Markup = require('telegraf/markup')

const postsUpdate = require('../../../helpers/postsUpdate')

module.exports = async (ctx) => {
  let contest = await ctx.Contest.findOne({ _id: ctx.state[0] })

  if (ctx.message || !ctx.callbackQuery?.message?.text)
    await ctx.deleteMessage()

  if (ctx.state[1] === 'preview') {
    await ctx.answerCbQuery(
      ctx.i18n.t(`publish.preview.${!contest.post.preview}`),
      true
    )

    contest = await ctx.Contest.findByIdAndUpdate(
      contest._id,
      { 'post.preview': !contest.post.preview },
      { new: true }
    )
  } else if (ctx.state[1] === 'postsUpdate') {
    if (!contest.posts.length)
      await ctx.answerCbQuery(ctx.i18n.t('publish.postsUpdate.error'), true)

    await ctx.answerCbQuery(ctx.i18n.t('publish.postsUpdate.text'), true)

    await postsUpdate(contest, ctx, true)
  } else await ctx.answerCbQuery()

  return ctx[ctx.callbackQuery?.message?.text ? 'editMessageText' : 'reply'](
    ctx.i18n.t('publish.text'),
    Markup.inlineKeyboard([
      [
        Markup.callbackButton(
          ctx.i18n.t(`publish.keys.postsTypes`),
          `contest_pub_${ctx.state[0]}`
        )
      ],
      [
        Markup.callbackButton(
          ctx.i18n.t(`contest.status.false`),
          `contest_pubPost_${ctx.state[0]}_false`
        ),
        Markup.callbackButton(
          ctx.i18n.t(`contest.status.true`),
          `contest_pubPost_${ctx.state[0]}_true`
        )
      ],
      [
        Markup.callbackButton(
          `${ctx.i18n.t(`publish.keys.preview`)} ${
            contest.post.preview ? '✅' : '❌'
          }`,
          `contest_pub_${ctx.state[0]}_preview`
        )
      ],
      [
        Markup.callbackButton(
          ctx.i18n.t(`publish.keys.publishTypes`),
          `contest_pub_${ctx.state[0]}`
        )
      ],
      [
        Markup.switchToChatButton(
          ctx.i18n.t(`publish.keys.immediately`),
          contest.key
        ),
        Markup.callbackButton(
          ctx.i18n.t(`publish.keys.plan`),
          `contest_pubPlan_${ctx.state[0]}`
        )
      ],
      [
        Markup.callbackButton(
          ctx.i18n.t(`publish.keys.postsUpdate`),
          `contest_pub_${ctx.state[0]}_postsUpdate`
        )
      ],
      [
        Markup.callbackButton(
          ctx.i18n.t('back'),
          `contest_back_${ctx.state[0]}`
        )
      ]
    ]).extra({
      parse_mode: 'HTML',
      disable_web_page_preview: true
    })
  )
}
