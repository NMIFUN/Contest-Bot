const config = require('../config')
const User = require('../models/user')
const convertChars = require('../helpers/convertChars')

module.exports = async (ctx) => {
  console.log(
    `${new Date().toLocaleString('ru')} @${
      ctx.botInfo.username
    } ${ctx.updateType} | ${ctx.from?.id || 'noUserId'} | ${
      ctx.chat?.id || 'noChatId'
    }`
  )

  const find = config.joinChannels?.find(
    (channel) => channel.id === ctx.chat.id
  )
  if (!find) return

  try {
    await ctx.telegram.approveChatJoinRequest(ctx.chat.id, ctx.from.id)

    await ctx.telegram.sendMessage(
      ctx.from.id,
      ctx.i18n.t('joinRequest.text'),
      {
        parse_mode: 'HTML'
      }
    )

    await User.create({
      id: ctx.from.id,
      name: convertChars(ctx.from.first_name),
      username: ctx.from.username,
      alive: true,
      from: `chatJoin-${ctx.chat.id}`
    }).catch(() => {})
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err)
  }
}
