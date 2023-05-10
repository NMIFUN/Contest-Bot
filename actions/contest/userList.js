const XlsxStreamWriter = require('xlsx-stream-writer')

const Participant = require('../../models/participant')

const back = require('./back')

module.exports = async (ctx) => {
  await ctx.answerCbQuery(ctx.i18n.t('userList.export'), true)

  const [contest, members] = await Promise.all([
    ctx.Contest.findOne({
      _id: ctx.state[0]
    }),
    Participant.find({ contest: ctx.state[0] }),
    ctx.deleteMessage()
  ])

  const rows = []

  rows.push(['ID', 'NAME', 'USERNAME', 'STATUS', 'REGISTER_DATE'])
  members
    .sort((a, b) => {
      if (contest.config.status)
        return a.status === 'win' ? -1 : a.status === 'lose' ? 0 : 1
      else return a.status.localeCompare(b.status)
    })
    .forEach((member) =>
      rows.push([
        member.id,
        member.name,
        member.username,
        member.status,
        member.registerDate || ''
      ])
    )

  const xlsx = new XlsxStreamWriter()
  xlsx.addRows(rows)

  await xlsx.getFile().then((buffer) =>
    ctx.replyWithDocument({
      source: buffer,
      filename: `${contest.key}_users.xlsx`
    })
  )

  return back({ ...ctx, message: {}, state: ctx.state })
}
