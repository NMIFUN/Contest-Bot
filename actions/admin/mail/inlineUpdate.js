const Markup = require('telegraf/markup')
const Mail = require('../../../models/mail')

const dateConfig = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric'
}
const statuses = {
  stopped: '⏹ Рассылка остановлена',
  paused: '⏸ Рассылка приостановлена',
  ended: '📬 Рассылка завершена',
  doing: '🕒 Рассылка выполняется',
  notStarted: '🛠 Рассылка еще не начата'
}

const parts = [
  '▓▓▓▓▓▓▓▓▓▓',
  '█▓▓▓▓▓▓▓▓▓',
  '██▓▓▓▓▓▓▓▓',
  '███▓▓▓▓▓▓▓',
  '████▓▓▓▓▓▓',
  '█████▓▓▓▓▓',
  '██████▓▓▓▓',
  '███████▓▓▓',
  '████████▓▓',
  '█████████▓',
  '██████████'
]

module.exports = async (ctx) => {
  await ctx.answerCbQuery()
  const mail = await Mail.findById(ctx.state[0])

  const procent = (mail.success + mail.unsuccess) / mail.all
  const time = new Date()
  time.setSeconds(
    time.getSeconds() + (mail.all - mail.success - mail.unsuccess) * 0.016
  )

  const result = `${statuses[mail.status]}

${
  mail.status === 'notStarted'
    ? mail.startDate
      ? `Запланирована на ${new Date(mail.startDate).toLocaleString(
          'ru',
          dateConfig
        )}`
      : 'Не запланирована'
    : `${
        mail.status !== 'completed'
          ? `🏃 Прогресс выполнения: [${parts[Math.round(procent * 10)]}] - ${(
              mail.success + mail.unsuccess
            ).format(0)}/${mail.all.format(0)} - ${Math.floor(procent * 100)}%`
          : ''
      }

📊 Статистика:
📬 Успешно: ${mail.success.format(0)}
📭 Неуспешно: ${mail.unsuccess.format(0)}

${
  ctx.from.id === Number(process.env.DEV_ID)
    ? `⚠️ Ошибки: ${Object.entries(mail.errorsCount)
        .map(([key, value]) => `${key} - ${value}`)
        .join(', ')}`
    : ''
}

${
  mail.status === 'doing'
    ? `⌚️ Окончание через ≈${Math.round(
        (time - new Date()) / (1000 * 60)
      )} мин.`
    : mail.status !== 'notStarted'
    ? `🕰 Длительность ${Math.round(
        ((mail.endDate ? new Date(mail.endDate) : new Date()) -
          new Date(mail.startDate)) /
          (1000 * 60)
      )} мин.`
    : ''
}
`
}`

  return ctx.editMessageText(result, {
    parse_mode: 'HTML',
    reply_markup: Markup.inlineKeyboard([
      Markup.callbackButton('🔄', `inlineUpdateMail_${mail._id}`)
    ])
  })
}
