const User = require('../models/user')
const sleep = (millis) => new Promise((resolve) => setTimeout(resolve, millis))
const shift = 5000

module.exports = async (bot) => {
  let promises = []
  let died = []
  let alive = []
  const reportsCount = {}

  const usersCount = await User.countDocuments()
  for (let y = 0; y <= Math.ceil(usersCount / shift); y++) {
    const users = await User.find({}, { id: 1 })
      .limit(shift)
      .skip(y * shift)

    for (let i = 0; i < users.length; i++) {
      const user = users[i]

      promises.push(
        bot.telegram
          .sendChatAction(user.id, 'typing')
          .then(() => ({ id: user.id, i, result: true }))
          .catch((e) => ({
            id: user.id,
            i,
            result: e.description
          }))
      )

      if (i !== 0 && i % 10 === 0) {
        const results = await Promise.all(promises)

        const findIndex = results.findIndex(
          (result) =>
            typeof result.result === 'string' &&
            result.result.startsWith('Too Many Requests:')
        )
        const find = results[findIndex]
        if (find) {
          await sleep(parseInt(find.result.match(/\d+/)) * 1000)
          i = find.i - 1
        } else {
          const success = results.filter((result) => result.result).length
          await sleep(success * 8)
        }

        results
          .slice(0, find ? findIndex : results.length)
          .forEach((result) => {
            if (result.result === true) alive.push(result.id)
            else {
              Number.isInteger(reportsCount[result.result])
                ? reportsCount[result.result]++
                : (reportsCount[result.result] = 1)
              died.push(result.id)
            }
          })

        promises = []
      }

      if (i % 500 === 0) {
        await Promise.all([
          User.updateMany({ id: { $in: died } }, { alive: false }),
          User.updateMany({ id: { $in: alive } }, { alive: true })
        ])
        died = []
        alive = []
      }
    }
  }

  await Promise.all([
    ...promises,
    User.updateMany({ id: { $in: died } }, { alive: false }),
    User.updateMany({ id: { $in: alive } }, { alive: true })
  ])
}
