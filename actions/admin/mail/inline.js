const Mail = require('../../../models/mail')
const Markup = require('telegraf/markup')

module.exports = async (ctx) => {
  if (!ctx.state[1]) return
  const mail = await Mail.findById(ctx.state[1])

  if (mail) {
    return ctx.answerInlineQuery([
      {
        type: 'article',
        id: '0',
        title: 'Рассылка',
        input_message_content: {
          message_text: 'Для получения информации нажмите на кнопку',
          parse_mode: 'HTML'
        },
        reply_markup: Markup.inlineKeyboard([
          Markup.callbackButton('🔄', `inlineUpdateMail_${mail._id}`)
        ])
      }
    ])
  }
}
