const Ref = require('../../models/ref')
const User = require('../../models/user')

const dateConfig = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric'
}
const Markup = require('telegraf/markup')

const defaultShift = 20

module.exports = async (ctx) => {
  if (!ctx.state[0]) ctx.state[0] = 0

  if (ctx.message?.text && ctx.state[1] === 'price') {
    ctx.user.state = null

    await Ref.updateOne({ name: ctx.state[0] }, { price: ctx.message.text })
  }

  if (isNaN(ctx.state[0])) {
    if (ctx.callbackQuery) await ctx.answerCbQuery()

    if (ctx.state[1] === 'price' && ctx.callbackQuery) {
      ctx.user.state = `admin_sysRef_${ctx.state[0]}_price`

      return ctx.editMessageText(
        'Введите цену.',
        Markup.inlineKeyboard([
          [Markup.callbackButton('‹ Назад', `admin_sysRef_${ctx.state[0]}`)]
        ]).extra({ parse_mode: 'HTML' })
      )
    }

    const [result, alive, subscribed] = await Promise.all([
      Ref.findOne({ name: ctx.state[0] }),

      User.countDocuments({ from: `ref-${ctx.state[0]}`, alive: true }),

      User.countDocuments({ from: `ref-${ctx.state[0]}`, subscribed: true })
    ])

    return ctx[ctx.message ? 'reply' : 'editMessageText'](
      `
Всего переходов: ${result.count.format(0)} ${
        result.price ? `(${(result.price / result.count).format(1)} р.ед)` : ''
      }
Уникальных переходов: ${result.uniqueCount.format(0)} (${Math.round(
        (result.uniqueCount / result.count) * 100
      )}%) ${
        result.price
          ? `${(result.price / result.uniqueCount).format(1)} р.ед`
          : ''
      }
Новых пользователей: ${result.newCount.format(0)} (${Math.round(
        (result.newCount / result.uniqueCount) * 100
      )}%) ${
        result.price ? `${(result.price / result.newCount).format(1)} р.ед` : ''
      }
Прошедших ОП: ${subscribed.format(0)} (${Math.round(
        (subscribed / result.newCount) * 100
      )}%)  ${
        result.price ? `${(result.price / subscribed).format(1)} р.ед` : ''
      }
Живых пользователей: ${alive.format(0)} (${Math.round(
        (alive / result.newCount) * 100
      )}%)  ${result.price ? `${(result.price / alive).format(1)} р.ед` : ''}
${result.price ? `Стоимость: ${result.price.format(1)} р.ед\n` : ''}
Первый переход: ${new Date(result.first).toLocaleString('ru', dateConfig)}
Последний переход: ${new Date(result.last).toLocaleString('ru', dateConfig)}

Ссылка: https://t.me/${process.env.BOT_USERNAME}?start=ref-${result.name}
`,
      Markup.inlineKeyboard([
        [
          Markup.callbackButton(
            'Стоимость',
            `admin_sysRef_${result.name}_price`
          )
        ],
        [Markup.callbackButton('🔄 Обновить', `admin_sysRef_${result.name}`)],
        [Markup.callbackButton('‹ Назад', 'admin_sysRef')]
      ]).extra({
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    )
  }

  const shift = Number(ctx.state[0])
  const count = await Ref.countDocuments()

  if (!count) {
    return ctx.editMessageText(
      `Реферальных ссылок еще не существует.\n
<code>https://t.me/${process.env.BOT_USERNAME}?start=ref-</code>code, переходя по такой ссылке пользователь автоматически учитывается в списке.
code - любой код для отличия ссылки от других ссылок`,
      Markup.inlineKeyboard([
        Markup.callbackButton('‹ Назад', 'admin_back')
      ]).extra({
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    )
  }

  if (shift < 0 || shift >= count) return ctx.answerCbQuery('Нельзя', true)
  await ctx.answerCbQuery()

  const results = await Ref.find()
    .skip(shift)
    .limit(defaultShift)
    .sort({ _id: -1 })

  const content = results.map(
    (result) => `<b>${result.name}</b>: ${result.count} / ${result.uniqueCount}`
  )
  const keyboard = results.map((result) =>
    Markup.callbackButton(
      `${result.name} ${result.count}`,
      `admin_sysRef_${result.name}`
    )
  )

  return ctx.editMessageText(
    `
<code>https://t.me/${process.env.BOT_USERNAME}?start=ref-</code>code

${content.join('\n')}`,
    {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: Markup.inlineKeyboard(keyboard, {
          columns: 2
        }).inline_keyboard.concat([
          [
            Markup.callbackButton('◀️', `admin_sysRef_${shift - defaultShift}`),
            Markup.callbackButton(
              `${shift + results.length}/${count} 🔄`,
              `admin_sysRef_${shift}`
            ),
            Markup.callbackButton('▶️', `admin_sysRef_${shift + defaultShift}`)
          ],
          [Markup.callbackButton('‹ Назад', 'admin_back')]
        ])
      }
    }
  )
}
