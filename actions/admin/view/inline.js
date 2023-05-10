const View = require('../../../models/view')
const Markup = require('telegraf/markup')

module.exports = async (ctx) => {
  if (!ctx.state[1]) return
  const view = await View.findById(ctx.state[1])

  if (view) {
    return ctx.answerInlineQuery([
      {
        type: 'article',
        id: '0',
        title: 'Просмотры',
        input_message_content: {
          message_text: 'Для получения информации нажмите на кнопку',
          parse_mode: 'HTML'
        },
        reply_markup: Markup.inlineKeyboard([
          Markup.callbackButton('🔄', `inlineUpdateView_${view._id}`)
        ])
      }
    ])
  }
}
