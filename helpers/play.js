const Participant = require('../models/participant')
const { randomInt } = require('crypto')

module.exports = async (contest, bot, winner = undefined) => {
  const members = await Participant.find({
    contest: contest._id,
    status: { $nin: ['banned', 'unsubscribed'] }
  })

  /* if (contest.subscription?.length && contest.config.unsubscribe)
    members = await Promise.all(
      members.map(async (member) => {
        let subscription = await Promise.all(
          contest.subscription.map((channel) =>
            bot
              .getChatMember(channel.id, member.id)
              .then((result) => ({ channel, result }))
              .catch((error) => ({ channel, error }))
          )
        )

        subscription = subscription.filter(
          (channel) =>
            !(
              !channel.result ||
              channel.error ||
              channel.result.status === 'left' ||
              channel.result.status === 'kicked' ||
              (channel.channel.type === 'supergroup' &&
                channel.result.status === 'restricted' &&
                !channel.result.is_member)
            )
        )

        return subscription.length ? member : undefined
      })
    )
  members = members.filter((member) => member) */

  const winners = []
  const prize = winner ? 1 : contest.config.prize

  if (winner)
    members.splice(
      members.findIndex((member) => member.id === winner),
      1
    )

  while (winners.length !== prize) {
    try {
      const random = randomInt(0, members.length)

      winners.push(members[random].id)
      members.splice(random, 1)
    } catch (error) {
      break
    }
  }
  if (!winners.length) return false

  await Promise.all([
    Participant.updateMany(
      { id: { $in: winners }, contest: contest._id },
      { status: 'win' }
    ),
    Participant.updateMany(
      {
        id: winner || { $in: members.map((member) => member.id) },
        contest: contest._id
      },
      { status: 'lose' }
    )
  ])

  return true
}
