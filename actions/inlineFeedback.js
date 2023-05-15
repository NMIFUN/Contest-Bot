const Contest = require('../models/contest')

module.exports = async (ctx) => {
  console.log(
    `${new Date().toLocaleString('ru')} @${ctx.botInfo.username} ${
      ctx.updateType
    } | ${ctx.from?.id || 'noUserId'} | ${ctx.chat?.id || 'noChatId'}`
  )

  if (ctx.chosenInlineResult.inline_message_id === undefined) return

  return Contest.updateOne(
    { key: ctx.chosenInlineResult.query },
    {
      $push: {
        posts: {
          inlineMessageId: ctx.chosenInlineResult.inline_message_id,
          type: ctx.chosenInlineResult.result_id
        }
      }
    }
  )
}
