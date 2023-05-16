const Contest = require('../../models/contest')
const Participant = require('../../models/participant')
const User = require('../../models/user')

const ObjectId = require('mongoose').Types.ObjectId

const config = require('../../config.json')
const { Markup } = require('telegraf')

module.exports = async (ctx) => {
  if (!config.admins.includes(ctx.from.id)) return

  let id
  if (ctx.message?.text) {
    const split = ctx.message.text.split(' ')
    const cmd = (split[1] && split[1].split('-')) || []

    id = cmd[1]
  } else id = ctx.state[0]

  const contest = await Contest.findOne({
    [`${ObjectId.isValid(id) ? '_id' : 'key'}`]: id
  })
  if (!contest) return

  const user = await User.findOne({ id: contest.creator })
  const participants = await Participant.countDocuments({
    contest: contest._id,
    status: { $nin: ['banned', 'unsubscribed'] }
  })

  const subsChannels = contest.subscription?.map(
    (channel) =>
      `<a href='${channel.link || `https://t.me/${channel.username}`}'>${
        channel.title
      }</a> (<code>${channel.id}</code>)`
  )
  const postChannels = contest.post.channels?.map(
    (channel) =>
      `<a href='${channel.link || `https://t.me/${channel.username}`}'>${
        channel.title
      }</a> (<code>${channel.id}</code>)`
  )
  const posts = contest.posts?.map(
    (post, index) =>
      `<a href='https://t.me/c/${post.chatId
        ?.toString()
        ?.replace('-100', '')}/${post.messageId}'>${index + 1}${
        post.chatId ? '✅' : '❌'
      }</a>`
  )

  return ctx[ctx.message ? 'reply' : 'editMessageText'](
    `<b>${contest.name}</b> от <a href='${
      user.username ? `t.me/${user.username}` : `tg://user?id=${user.id}`
    }'>${user.name}</a> (<code>${user.id}</code>)
<b>Ключ</b>: ${contest.key} <b>Id</b>: ${contest._id}
<b>Статус</b>: ${!contest.config.status ? 'Начат' : 'Завершен'}
<b>Кол-во участников</b>: ${participants}

<b>Обязательная подписка</b>: ${
      contest.subscription.length ? subsChannels.join(' ,') : 'не задано'
    }
<b>Для публикации</b>: ${
      contest.post.channels.length ? postChannels.join(' ,') : 'не задано'
    }
<b>Посты</b>: ${contest.posts.length ? posts.join(' ,') : 'отсутствуют'}
`,
    Markup.inlineKeyboard([
      [Markup.callbackButton(`🔄`, `admin_contest_${contest._id}`)],
      [Markup.callbackButton(`‹ Назад`, 'admin_contests')]
    ]).extra({ parse_mode: 'HTML', disable_web_page_preview: true })
  )
}
