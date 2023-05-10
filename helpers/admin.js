const Markup = require('telegraf/markup')

const backKeyboard = Markup.inlineKeyboard(
  [Markup.callbackButton('‹ Назад', 'admin_back')],
  { columns: 2 }
).extra()

module.exports = { backKeyboard }
