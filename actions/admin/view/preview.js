const Markup = require('telegraf/markup')

module.exports = async (ctx) => {
  await ctx.answerCbQuery()
  await ctx.deleteMessage()

  const view = await ctx.View.findById(ctx.state[0])
  view.preview = !view.preview
  await view.save()

  return ctx.replyWithHTML(
    `Превью ${view.preview ? 'включено' : 'выключено'}.`,
    {
      reply_markup: Markup.inlineKeyboard([
        Markup.callbackButton(
          'Продолжить настройку',
          `admin_view_id_${ctx.state[0]}`
        )
      ]),
      parse_mode: 'HTML'
    }
  )
}
