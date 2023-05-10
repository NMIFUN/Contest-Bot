const dayjs = require('dayjs')
dayjs
  .extend(require('dayjs/plugin/localizedFormat'))
  .extend(require('dayjs/plugin/customParseFormat'))
  .extend(require('dayjs/plugin/relativeTime'))

const Markup = require('telegraf/markup')

const postCreate = require('../../../helpers/postCreate')
const postPublish = require('../../../helpers/postPublish')
const convertChars = require('../../../helpers/convertChars')

const final = (ctx, contest) => {
  const keyboard =
    contest.post.channels?.map((channel) => [
      Markup.callbackButton(
        channel.title,
        `contest_pubPlan_${ctx.state[0]}_title`
      ),
      Markup.callbackButton(
        '🗑',
        `contest_pubPlan_${ctx.state[0]}_del_${channel.id}`
      )
    ]) || []

  keyboard?.push(
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
    [
      Markup.callbackButton(
        ctx.i18n.t('back'),
        `contest_pubPlan_${ctx.state[0]}`
      )
    ]
  )

  contest.post.channels = contest.post.channels?.map(
    (channel, index) =>
      `${index + 1}) <a href='${
        channel.link || `https://t.me/${channel.username}`
      }'>${channel.title}</a> (<code>${channel.id}</code>)`
  )

  return ctx[ctx.message ? 'reply' : 'editMessageText'](
    ctx.i18n.t('publish.plan.channels.text', {
      channels: contest.post?.channels?.join('\n'),
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
  let contest = await ctx.Contest.findOne({
    _id: ctx.state[0]
  })

  if (ctx.state[1] === 'time') {
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery()

      ctx.user.state = `contest_pubPlan_${ctx.state[0]}_time`

      return ctx.editMessageText(
        ctx.i18n.t('publish.plan.time.text', {
          time: dayjs(contest.post.time).format('D.M.YYYY H:mm')
        }),
        {
          reply_markup: Markup.inlineKeyboard([
            Markup.callbackButton(
              ctx.i18n.t('back'),
              `contest_pubPlan_${ctx.state[0]}`
            )
          ]),
          parse_mode: 'HTML'
        }
      )
    }

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
        { 'post.time': enterDate.valueOf() }
      )

      return ctx.replyWithHTML(
        ctx.i18n.t('publish.plan.time.success', {
          time: dayjs(enterDate).format('D.M.YYYY H:mm')
        }),
        Markup.inlineKeyboard([
          Markup.callbackButton(
            ctx.i18n.t('back'),
            `contest_pubPlan_${ctx.state[0]}_channels`
          )
        ]).extra()
      )
    }
  } else if (ctx.state[1] === 'immediately') {
    if (!contest.post.channels.length)
      return ctx.answerCbQuery(ctx.i18n.t('publish.plan.immediately.error'))
    await ctx.answerCbQuery(ctx.i18n.t('publish.plan.immediately.text'))

    const post = await postCreate(
      contest,
      contest.config.status,
      ctx.i18n.locale(),
      ctx.botInfo.username
    )

    const messages = await Promise.all(
      contest.post.channels.map((channel) =>
        postPublish(ctx.telegram, channel.id, post)
      )
    )
    await ctx.Contest.updateOne(
      { _id: contest._id },
      {
        $addToSet: {
          posts: {
            $each: messages.map((message) => ({
              messageId: message.message_id,
              chatId: message.chat.id,
              type: post.type
            }))
          }
        }
      }
    )
  } else if (ctx.state[1] === 'channel') {
    if (ctx.callbackQuery) {
      ctx.user.state = null

      if (ctx.state[2] === 'del') {
        const channel = contest.post.channels.findIndex(
          (o) => o.id === Number(ctx.state[2])
        )
        contest.post.channels.splice(channel, 1)

        const promises = await Promise.all([
          ctx.Contest.findByIdAndUpdate(ctx.state[0], {
            subscription: contest.post.channels
          }),
          ctx.answerCbQuery(ctx.i18n.t('subscription.deleted'), true)
        ])
        contest = promises[0]
      }
      await ctx.answerCbQuery().catch(() => {})

      ctx.user.state = `contest_pubPlan_${ctx.state[0]}_channel`

      return final(ctx, contest)
    } else {
      let channels = []
      const channelsLog = []

      if (ctx.message.forward_from_chat)
        channels.push(ctx.message.forward_from_chat.id)
      else if (ctx.message.text) {
        const splitEnter = ctx.message.text
          .replace(
            /((https?:\/\/)?t(elegram)?\.me\/|durov.t(elegram)?)/gim,
            '@'
          )
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
        const find = contest.post.channels.findIndex(
          (element) => channel.getChat.id === element.id
        )
        if (find !== -1) {
          channelsLog.push(
            `${channelsLog.length + 1}) <b>${channel.getChat.title}</b> 🗑`
          )
          contest.post.channels.splice(find, 1)
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
            }</b> ❌ (${ctx.i18n.t('publish.plan.channels.notAdmin')}) (<i>${
              channel.error?.description
            }</i>)`
          )
        else if (
          channel.getChatMember.status !== 'administrator' ||
          (channel.getChat.type === 'channel' &&
            !channel.getChatMember.can_post_messages)
        )
          channelsLog.push(
            `${channelsLog.length + 1}) <b>${
              channel.getChat.title
            }</b> ❌ (${ctx.i18n.t('publish.plan.channels.notAdmin')})`
          )
        else return true
        return false
      })

      channels = await Promise.all(
        channels.map((channel) =>
          ctx.telegram
            .getChatMember(channel.getChat.id, ctx.user.id)
            .then((result) => ({ ...channel, getChatMemberYou: result }))
            .catch((error) => ({ ...channel, error }))
        )
      )

      channels = channels.filter((channel) => {
        if (channel.error)
          channelsLog.push(
            `${channelsLog.length + 1}) <b>${
              channel.getChat.title
            }</b> ❌ (${ctx.i18n.t('publish.plan.channels.notYouAdmin')}) (<i>${
              channel.error?.description
            }</i>)`
          )
        else if (
          !['administrator', 'creator'].includes(
            channel.getChatMemberYou.status
          ) ||
          (channel.getChat.type === 'channel' &&
            channel.getChatMemberYou.status !== 'creator' &&
            !channel.getChatMemberYou.can_post_messages)
        )
          channelsLog.push(
            `${channelsLog.length + 1}) <b>${
              channel.getChat.title
            }</b> ❌ (${ctx.i18n.t('publish.plan.channels.notYouAdmin')})`
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
        channelsLog.push(
          `${channelsLog.length + 1}) <b>${channel.title}</b> ✅`
        )
      )

      contest = await ctx.Contest.findByIdAndUpdate(
        ctx.state[0],
        { 'post.channels': contest.post.channels.concat(channels) },
        { new: true }
      )

      await ctx.replyWithHTML(
        ctx.i18n.t('publish.plan.channels.success', {
          list: channelsLog.join('\n')
        }),
        { disable_web_page_preview: true }
      )

      return final(ctx, contest)
    }
  }

  return ctx.editMessageText(ctx.i18n.t('publish.plan.text'), {
    reply_markup: Markup.inlineKeyboard([
      [
        Markup.callbackButton(
          ctx.i18n.t('publish.plan.keys.immediately'),
          `contest_pubPlan_${ctx.state[0]}_immediately`
        ),
        Markup.callbackButton(
          ctx.i18n.t('publish.plan.keys.time'),
          `contest_pubPlan_${ctx.state[0]}_time`
        )
      ],
      [
        Markup.callbackButton(
          ctx.i18n.t('publish.plan.keys.channel'),
          `contest_pubPlan_${ctx.state[0]}_channel`
        )
      ],
      [Markup.callbackButton(ctx.i18n.t('back'), `contest_pub_${ctx.state[0]}`)]
    ]),
    parse_mode: 'HTML'
  })
}
