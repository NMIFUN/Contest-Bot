const User = require('../models/user')

module.exports = async (ctx) => {
  console.log(
    `${new Date().toLocaleString('ru')} @${
      ctx.botInfo.username
    } ${ctx.updateType} | ${ctx.from?.id || 'noUserId'} | ${
      ctx.chat?.id || 'noChatId'
    }`
  )

  if (ctx.chat?.type !== 'private') return

  return User.updateOne(
    { id: ctx.from.id },
    {
      alive: ctx.myChatMember.new_chat_member.status !== 'kicked'
    }
  )
}
