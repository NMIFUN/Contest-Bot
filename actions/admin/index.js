const Markup = require('telegraf/markup')
const config = require('../../config.json')

module.exports = async (ctx) => {
  if (!config.admins.includes(ctx.from.id)) return

  const text =
    '<b>Админ панель</b>\n\n<tg-spoiler><i>Developed by @NMI_FUN</i></tg-spoiler>'

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.callbackButton('Статистика', 'admin_stat'),
      Markup.callbackButton('Админы', 'admin_addAdmin')
    ],
    [
      Markup.callbackButton('Рассылка', 'admin_mail'),
      Markup.callbackButton('Просмотры', 'admin_view')
    ],
    [
      Markup.callbackButton('Рефералка', 'admin_sysRef'),
      Markup.callbackButton('Список пользователей', 'admin_listUsers')
    ],
    [
      Markup.callbackButton('BotStat.io', 'admin_botStat'),
      Markup.callbackButton('(Раз)бан пользователя', 'admin_ban')
    ],
    [
      Markup.callbackButton('Обязательная подписка', 'admin_addSubscription'),
      Markup.callbackButton(
        'Обязательная подписка бот',
        'admin_addBotSubscription'
      )
    ],
    [
      Markup.callbackButton('Принятие заявок', 'admin_addJoin'),
      Markup.callbackButton('Список розыгрышей', 'admin_contests')
    ]
  ]).extra({ parse_mode: 'HTML' })

  ctx.user.state = null

  if (ctx.callbackQuery) {
    await ctx.answerCbQuery()

    if (ctx.callbackQuery.message.text) {
      return ctx.editMessageText(text, keyboard)
    } else await ctx.deleteMessage()
  }

  return ctx.replyWithHTML(text, keyboard)
}
