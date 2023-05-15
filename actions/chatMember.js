const Participant = require('../models/participant')

module.exports = async (ctx) => {
  console.log(
    `${new Date().toLocaleString('ru')} @${ctx.botInfo.username} ${
      ctx.updateType
    } | ${ctx.from?.id || 'noUserId'} | ${ctx.chat?.id || 'noChatId'}`
  )

  if (
    ['creator', 'administrator'].includes(ctx.chatMember.new_chat_member.status)
  )
    return

  if (['left', 'kicked'].includes(ctx.chatMember.new_chat_member.status)) {
    let participants = await Participant.find({
      id: ctx.chatMember.new_chat_member.user.id,
      status: 'active'
    }).populate('contest')

    participants.filter(
      (participant) =>
        participant.contest.subscription.findIndex(
          (channel) =>
            channel.id === ctx.chat.id &&
            participant.contest.config.status === false
        ) !== -1
    )
    participants = participants.map((participant) => participant.id)

    return participants.length > 0
      ? Participant.updateMany(
          { id: { $in: participants } },
          { status: 'unsubscribed' }
        )
      : undefined
  }
}
