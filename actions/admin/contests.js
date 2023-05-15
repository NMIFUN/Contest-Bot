const Contest = require('../../models/contest')
const Participant = require('../../models/participant')

const config = require('../../config.json')
const { Markup } = require('telegraf')

const defaultShift = 20

module.exports = async (ctx) => {
  if (!config.admins.includes(ctx.from.id)) return

  if (!ctx.state[0]) ctx.state[0] = 0
  const shift = Number(ctx.state[0])
  const count = await Contest.countDocuments({ 'config.status': false })

  if (!count) return

  if (shift < 0 || shift >= count) return ctx.answerCbQuery('Нельзя', true)
  await ctx.answerCbQuery()

  const results = await Contest.find({ 'config.status': false })
    .skip(shift)
    .limit(defaultShift)
    .sort({ _id: -1 })

  const counts = await Promise.all(
    results.map((result) =>
      Participant.countDocuments({
        contest: result._id,
        status: { $nin: ['banned', 'unsubscribed'] }
      })
    )
  )

  const content = results.map(
    (result, index) =>
      `<b>${result.name}</b> от <a href='tg://user?id=${result.creator}'>${result.creator}</a> - ${counts[index]}👥 - <a href='https://t.me/${ctx.botInfo.username}?start=adminContest-${result._id}'>клик</a>`
  )

  return ctx.editMessageText(
    `<b>Список розыгрышей:</b>
${content.join('\n')}`,
    Markup.inlineKeyboard([Markup.callbackButton(`‹ Назад`, 'admin')]).extra({
      parse_mode: 'HTML',
      disable_web_page_preview: true
    })
  )
}
