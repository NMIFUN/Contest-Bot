const Markup = require('telegraf/markup')
const convertChars = require('../../helpers/convertChars')

const final = (ctx, contest) => {
  const keyboard =
    contest.subscription?.map((channel) => [
      Markup.callbackButton(channel.title, `contest_sub_${ctx.state[0]}_title`),
      Markup.callbackButton(
        '🗑',
        `contest_sub_${ctx.state[0]}_del_${channel.id}`
      )
    ]) || []

  keyboard?.push(
    [
      Markup.callbackButton(
        `${(contest.config.unsubscribe && '✅') || '❌'} ${ctx.i18n.t(
          'subscription.unsubscribe.key'
        )}`,
        `contest_sub_${ctx.state[0]}_unsubscribe`
      )
    ],
    [
      Markup.urlButton(
        ctx.i18n.t('subscription.keys.addChannel'),
        `https://t.me/${ctx.botInfo.username}?startchannel&admin=invite_users+post_messages`
      ),
      Markup.urlButton(
        ctx.i18n.t('subscription.keys.addGroup'),
        `https://t.me/${ctx.botInfo.username}?startgroup=start&admin=invite_users+post_messages`
      )
    ],
    [Markup.callbackButton(ctx.i18n.t('back'), `contest_back_${ctx.state[0]}`)]
  )

  contest.subscription = contest.subscription?.map(
    (channel, index) =>
      `${index + 1}) <a href='${
        channel.link || `https://t.me/${channel.username}`
      }'>${channel.title}</a> (<code>${channel.id}</code>)`
  )

  return ctx[ctx.message ? 'reply' : 'editMessageText'](
    ctx.i18n.t('subscription.text', {
      channels: contest.subscription?.join('\n'),
      username: ctx.botInfo.username
    }),
    {
      reply_markup: Markup.inlineKeyboard(keyboard),
      parse_mode: 'HTML',
      disable_web_page_preview: true
    }
  )
}

module.exports = async (ctx) => {
  let contest = await ctx.Contest.findOne({ _id: ctx.state[0] })

  if (ctx.callbackQuery) {
    ctx.user.state = null

    if (ctx.state[1] === 'del') {
      const channel = contest.subscription.findIndex(
        (o) => o.id === Number(ctx.state[2])
      )
      contest.subscription.splice(channel, 1)

      const promises = await Promise.all([
        ctx.Contest.findByIdAndUpdate(
          ctx.state[0],
          {
            subscription: contest.subscription
          },
          { new: true }
        ),
        ctx.answerCbQuery(ctx.i18n.t('subscription.deleted'), true)
      ])
      contest = promises[0]
    } else if (ctx.state[1] === 'unsubscribe') {
      const promises = await Promise.all([
        ctx.Contest.findByIdAndUpdate(
          ctx.state[0],
          {
            'config.unsubscribe': !contest.config.unsubscribe
          },
          { new: true }
        ),
        ctx.answerCbQuery(
          ctx.i18n.t(
            `subscription.unsubscribe.text.${!contest.config.unsubscribe}`
          ),
          true
        )
      ])
      contest = promises[0]
    }
    await ctx.answerCbQuery().catch(() => {})

    ctx.user.state = `contest_sub_${ctx.state[0]}`

    return final(ctx, contest)
  } else {
    let channels = []
    const channelsLog = []

    if (ctx.message.forward_from_chat)
      channels.push(ctx.message.forward_from_chat.id)
    else if (ctx.message.text) {
      const splitEnter = ctx.message.text
        .replace(/((https?:\/\/)?t(elegram)?\.me\/|durov.t(elegram)?)/gim, '@')
        .split(`\n`)

      splitEnter.forEach((element) => {
        element.split(' ').forEach((elementInner) => {
          channels.push(elementInner)
        })
      })
    } else
      return ctx.replyWithHTML(ctx.i18n.t('subscription.onlyTextOrForward'))

    channels = await Promise.all(
      channels.map((channel) =>
        ctx.telegram
          .getChat(channel)
          .then((result) => ({
            channel,
            getChat: { ...result, title: convertChars(result.title) }
          }))
          .catch((error) => ({ channel, error }))
      )
    )
    channels = channels.filter((channel) => {
      if (channel.error)
        channelsLog.push(
          `${channelsLog.length + 1}) <b>${
            channel.channel
          }</b> ❌ (${ctx.i18n.t('subscription.missed')}) (<i>${
            channel.error?.description
          }</i>)`
        )

      return !channel.error
    })

    channels = channels.filter((channel) => {
      const find = contest.subscription.findIndex(
        (element) => channel.getChat.id === element.id
      )
      if (find !== -1) {
        channelsLog.push(
          `${channelsLog.length + 1}) <b>${channel.getChat.title}</b> 🗑`
        )
        contest.subscription.splice(find, 1)
      }

      return find === -1
    })

    channels = await Promise.all(
      channels.map((channel) =>
        ctx.telegram
          .getChatMember(channel.getChat.id, ctx.botInfo.id)
          .then((result) => ({ ...channel, getChatMember: result }))
          .catch((error) => ({ ...channel, error }))
      )
    )

    channels = channels.filter((channel) => {
      if (channel.error)
        channelsLog.push(
          `${channelsLog.length + 1}) <b>${
            channel.getChat.title
          }</b> ❌ (${ctx.i18n.t('subscription.notAdmin')}) (<i>${
            channel.error?.description
          }</i>)`
        )
      else if (
        channel.getChatMember.status !== 'administrator' ||
        !channel.getChatMember.can_invite_users
      )
        channelsLog.push(
          `${channelsLog.length + 1}) <b>${
            channel.getChat.title
          }</b> ❌ (${ctx.i18n.t('subscription.notAdmin')})`
        )
      else return true
      return false
    })

    channels = await Promise.all(
      channels.map((channel) =>
        ctx.telegram
          .createChatInviteLink(channel.getChat.id)
          .then((result) => ({ ...channel, chatInviteLink: result }))
          .catch((error) => ({ ...channel, error }))
      )
    )
    channels = channels.filter((channel) => {
      if (channel.error)
        channelsLog.push(
          `${channelsLog.length + 1}) <b>${
            channel.getChat.title
          }</b> ❌ (${ctx.i18n.t('subscription.failedInviteLink')}) (<i>${
            channel.error?.description
          }</i>)`
        )

      return !channel.error
    })
    channels = channels.map((channel) => ({
      id: channel.getChat.id,
      title: channel.getChat.title,
      username: channel.getChat.username,
      link: channel.chatInviteLink.invite_link
    }))

    channels.forEach((channel) =>
      channelsLog.push(`${channelsLog.length + 1}) <b>${channel.title}</b> ✅`)
    )

    contest = await ctx.Contest.findByIdAndUpdate(
      ctx.state[0],
      { subscription: contest.subscription.concat(channels) },
      { new: true }
    )

    await ctx.replyWithHTML(
      ctx.i18n.t('subscription.success', { list: channelsLog.join('\n') }),
      { disable_web_page_preview: true }
    )

    return final(ctx, contest)
  }
}
