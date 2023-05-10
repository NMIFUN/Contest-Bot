const Markup = require('telegraf/markup')
const View = require('../../../models/view')

const dateConfig = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric'
}
const statuses = {
  notStarted: '🛠 Просмотры еще не начаты',
  doing: '🕒 Просмотры выполняются',
  // paused: `⏸ Просмотры приостановлены`,
  // stopped: `⏹ Просмотры остановлены`,
  ended: '📬 Просмотры завершены'
}

module.exports = async (ctx) => {
  await ctx.answerCbQuery()
  const view = await View.findById(ctx.state[0])

  const result = `${statuses[view.status]}

👁 Просмотров ${view.views}
  
🕓 Начало ${
    view.startDate
      ? new Date(view.startDate).toLocaleString('ru', dateConfig)
      : '❌'
  }
🕤 Окончание ${
    view.endDate
      ? new Date(view.endDate).toLocaleString('ru', dateConfig)
      : '❌'
  }
🫂 Макс кол-во ${view.quantity === 0 ? '♾️' : view.quantity}
🏳️ Язык ${view.lang === null ? 'все' : view.lang}
✉️ Уникальные ${view.unique ? '✅' : '❌'}`

  return ctx.editMessageText(result, {
    parse_mode: 'HTML',
    reply_markup: Markup.inlineKeyboard([
      Markup.callbackButton('🔄', `inlineUpdateView_${view._id}`)
    ])
  })
}
