const config = require('../config.json')
const fs = require('fs').promises

const convertChars = require('../helpers/convertChars')

const { Telegraf } = require('telegraf')
const bot = new Telegraf(process.env.BOT_TOKEN)

module.exports = async (err, ctx, botUsername, clusterId) => {
  if (
    err.code === 429 &&
    err.description?.startsWith('Too Many Requests: retry after')
  ) {
    if (Date.now() - config.lastFloodError < 180000 && config.lastFloodError)
      return

    console.error(
      `${new Date().toLocaleString(
        'ru'
      )} @${botUsername}[${clusterId}] SLOW ANSWER in FLOOD ERROR in ${
        ctx.updateType
      }[${ctx.updateSubTypes}] | ${
        (ctx.message?.text &&
          Array.from(ctx.message.text).slice(0, 300).join('')) ||
        ctx.callbackQuery?.data ||
        ctx.inlineQuery?.query ||
        'empty'
      }`,
      err
    )

    config.lastFloodError = Date.now()
    await fs.writeFile('config.json', JSON.stringify(config, null, '  '))

    return bot.telegram
      .sendMessage(
        process.env.DEV_ID,
        `@${botUsername}[${clusterId}] FLOOD ERROR in ${ctx.updateType}[${
          ctx.updateSubTypes
        }] | ${
          (ctx.message?.text &&
            Array.from(convertChars(ctx.message.text))
              .slice(0, 300)
              .join('')) ||
          ctx.callbackQuery?.data ||
          ctx.inlineQuery?.query ||
          'empty'
        }
      \n<i>${convertChars(err.description)}</i>`,
        { parse_mode: 'HTML' }
      )
      .catch((error) => {
        console.error('Error Flood handling error', error)
      })
  } else if (
    err.code === 400 &&
    err.description ===
      'Bad Request: query is too old and response timeout expired or query ID is invalid'
  ) {
    if (
      Date.now() - config.lastTimeoutError < 180000 &&
      config.lastTimeoutError
    )
      return

    console.error(
      `${new Date().toLocaleString(
        'ru'
      )} @${botUsername}[${clusterId}] SLOW ANSWER in ${ctx.updateType}[${
        ctx.updateSubTypes
      }] | ${ctx.callbackQuery?.data}`,
      err
    )

    config.lastTimeoutError = Date.now()
    await fs.writeFile('config.json', JSON.stringify(config, null, '  '))

    return bot.telegram
      .sendMessage(
        process.env.DEV_ID,
        `@${botUsername}[${clusterId}] SLOW ANSWER in ${ctx.updateType}[${
          ctx.updateSubTypes
        }] | ${ctx.callbackQuery?.data}
        \n<i>${convertChars(err.description)}</i>`,
        { parse_mode: 'HTML' }
      )
      .catch((error) => {
        console.error('Error SlowAnswer handling error', error)
      })
  } else if (
    err.code === 400 &&
    (err.description === 'Bad Request: message to edit not found' ||
      err.description === 'Bad Request: MESSAGE_ID_INVALID')
  )
    return ctx.telegram
      ?.sendCopy(err.on.payload.chat_id, err.on.payload, err.on.payload)
      .catch((error) => {
        console.error('Error MessageEdit handling error', error)
      })
  else if (
    (err.code === 400 || err.code === 403) &&
    err.description &&
    [
      'Bad Request: message is not modified: specified new message content and reply markup are exactly the same as a current content and reply markup of the message',
      'Bad Request: message to delete not found',
      'Forbidden: bot was blocked by the user',
      "Bad Request: message can't be deleted for everyone"
    ].includes(err.description)
  ) {
    return
  }

  console.error(
    `${new Date().toLocaleString(
      'ru'
    )} @${botUsername}[${clusterId}] ERROR in ${ctx.updateType}[${
      ctx.updateSubTypes
    }] | ${ctx.from?.id || 'noUserId'} | ${ctx.chat?.id || 'noChatId'} | ${
      (ctx?.message?.text &&
        Array.from(ctx.message.text).slice(0, 300).join('')) ||
      ctx.callbackQuery?.data ||
      ctx.inlineQuery?.query ||
      'noData'
    } ${ctx.user?.state || 'noState'}`,
    err
  )

  return bot.telegram
    .sendMessage(
      process.env.DEV_ID,
      `@${botUsername}[${clusterId}] ERROR in ${ctx.updateType}[${
        ctx.updateSubTypes
      }] | ${ctx.from?.id || 'noUserId'} | ${ctx.chat?.id || 'noChatId'} | ${
        (ctx.message?.text &&
          Array.from(convertChars(ctx.message.text)).slice(0, 300).join('')) ||
        ctx.callbackQuery?.data ||
        ctx.inlineQuery?.query ||
        'noData'
      } ${ctx.user?.state || 'noState'}
    \n<code>${convertChars(err.stack)}</code>\n${
        (err.on &&
          `<code>${JSON.stringify(convertChars(err.on), null, 2)}</code>`) ||
        'noStack'
      }`,
      { parse_mode: 'HTML' }
    )
    .catch((error) => {
      console.error('Error Main handling error', error)
    })
}
