const { Markup } = require('telegraf')
const config = require('../../config.json')
const fs = require('fs').promises

module.exports = async (ctx) => {
  if (ctx.callbackQuery) await ctx.answerCbQuery()

  if (!config.botStat) {
    config.botStat = {
      send: false,
      alive: false
    }
  }

  if (ctx.message?.text) {
    ctx.user.state = null

    config.botStat.key = ctx.message.text
    await fs.writeFile('config.json', JSON.stringify(config, null, '  '))
  }

  if (['alive', 'send'].includes(ctx.state[0])) {
    config.botStat[ctx.state[0]] = !config.botStat[ctx.state[0]]

    await fs.writeFile('config.json', JSON.stringify(config, null, '  '))
  } else if (ctx.state[0] === 'token') {
    ctx.user.state = 'admin_botStat'

    return ctx.editMessageText(
      'Введите ключ.',
      Markup.inlineKeyboard([
        [Markup.callbackButton('‹ Назад', 'admin_botStat')]
      ]).extra({ parse_mode: 'HTML' })
    )
  }

  return ctx[ctx.message ? 'replyWithHTML' : 'editMessageText'](
    `
BotStat.io настройка

Текущий ключ: ${
      config.botStat.key || 'нет'
    } (<a href='https://botstat.io/dashboard/api'>получение ключа</a>)`,
    Markup.inlineKeyboard([
      [
        Markup.callbackButton(
          `Отправлять ${config.botStat.send ? '✅' : '❌'}`,
          'admin_botStat_send'
        ),
        Markup.callbackButton(
          `Живые ${config.botStat.alive ? '✅' : '❌'}`,
          'admin_botStat_alive'
        ),
        Markup.callbackButton('Ключ', 'admin_botStat_token')
      ],
      [Markup.callbackButton('‹ Назад', 'admin_back')]
    ]).extra({ parse_mode: 'HTML' })
  )
}
