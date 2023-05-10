const mainKeyboard = require('../helpers/mainKeyboard')

module.exports = async (ctx) => {
  return ctx.replyWithHTML(ctx.i18n.t('start.text'), {
    reply_markup: mainKeyboard(ctx),
    disable_web_page_preview: true
  })
}
