const Bot = require('../../models/bot')

const botShow = require('../../helpers/botShow')
const axios = require('axios')

module.exports = async (ctx) => {
  if (ctx.callbackQuery || ctx.message.text === ctx.i18n.t('start.keys.bots')) {
    if (ctx.callbackQuery) await ctx.answerCbQuery()

    ctx.user.state = 'bot_create'
    return ctx[ctx.message ? 'reply' : 'editMessageText'](
      ctx.i18n.t('bot.create.text'),
      {
        parse_mode: 'HTML'
      }
    )
  } else {
    if (!ctx.message.text)
      return ctx.replyWithHTML(ctx.i18n.t(`bot.create.text`))

    let token = ctx.message.text.trim()
    if (ctx.message.text.length > 200)
      token = ctx.message.text
        .slice(
          ctx.message.text.indexOf(`Use this token to access the HTTP API:`) +
            39,
          ctx.message.text.indexOf(
            `Keep your token secure and store it safely, it can be used by anyone to control your bot.`
          )
        )
        .trim()

    const getBot = await axios
      .get(`https://api.telegram.org/bot${token}/getMe`)
      .catch(() => {})
    if (!getBot || !getBot.data.ok)
      return ctx.replyWithHTML(ctx.i18n.t(`bot.create.error`))

    ctx.user.state = null

    const [bot, count] = await Promise.all([
      Bot.findOneAndUpdate(
        { id: getBot.data.result.id },
        {
          name: getBot.data.result.first_name,
          username: getBot.data.result.username,
          creator: ctx.user.id,
          token
        },
        { upsert: true, new: true }
      ),
      Bot.countDocuments({
        creator: ctx.user.id,
        deleted: false
      })
    ])

    const { text, keyboard } = await botShow(bot, ctx, count - 1)

    await ctx.replyWithHTML(text, keyboard.extra())

    return axios.get(
      `https://api.telegram.org/bot${token}/setWebhook?url=https://${
        process.env.WEBHOOK_DOMAIN
      }/${
        process.env.WEBHOOK_PATH
      }&max_connections=100&allowed_updates=['message','inline_query','callback_query','my_chat_member','chat_member','chat_join_request','chosen_inline_result']&secret_token=${bot.token.replace(
        ':',
        '-----'
      )}`
    )
  }
}
