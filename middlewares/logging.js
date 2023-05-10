const convertChars = require('../helpers/convertChars')

module.exports = async (ctx, next, clusterId) => {
  const startDate = Date.now()

  if (ctx.user && ctx.from) {
    if (ctx.user.ban) return

    ctx.user.username = ctx.from.username
    ctx.user.lastMessage = Date.now()
    ctx.user.name = convertChars(ctx.from.first_name)
    ctx.user.alive = true
    ctx.user.langCode = ctx.from.language_code
    ctx.i18n.locale(
      ctx.user?.lang
        ? ctx.user.lang
        : ['en', 'ru'].includes(ctx.from.language_code)
        ? ctx.from.language_code
        : 'ru'
    )
  }

  await next()

  console.log(
    `${new Date().toLocaleString('ru')} @${
      ctx.botInfo.username
    }[${clusterId}] ${ctx.updateType}[${ctx.updateSubTypes}] | ${
      ctx.from?.id || 'noUserId'
    } | ${ctx.chat?.id || 'noChatId'} | ${
      ctx.message?.text?.slice(0, 64) ||
      ctx.callbackQuery?.data ||
      ctx.inlineQuery?.query ||
      'noData'
    } [${Date.now() - startDate}ms]`
  )
}
