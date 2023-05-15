const contestCommand = require('../actions/admin/contest')
const Ref = require('../models/ref')

module.exports = async (ctx, next) => {
  if (ctx.chat.type !== 'private') return next()

  const split = ctx.message.text.split(' ')
  if (split[0] !== '/start') return next()

  const cmd = (split[1] && split[1].split('-')) || []

  if (cmd[0] === 'ref') {
    const date = Date.now()

    const ref = await Ref.findOne({ name: cmd[1] })

    if (ref)
      await Ref.updateOne(
        { name: cmd[1] },
        {
          $inc: {
            count: 1,
            newCount: Number(!!ctx.freshUser),
            uniqueCount: Number(ref.users.includes(ctx.from.id))
          },
          $addToSet: { users: ctx.from.id },
          $set: { last: date }
        }
      )
    else
      await Ref.create({
        name: cmd[1],
        first: date,
        last: date,
        count: 1,
        uniqueCount: 1,
        newCount: Number(!!ctx.freshUser),
        users: [ctx.from.id]
      })
  } else if (cmd[0] === 'adminContest') return contestCommand(ctx)

  return next()
}
