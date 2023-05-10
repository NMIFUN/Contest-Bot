const Markup = require('telegraf/markup')
const dateConfig = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric'
}
const { ObjectId } = require('mongodb')
const statuses = {
  notStarted: '🛠 Просмотры еще не начаты',
  doing: '🕒 Просмотры выполняются',
  // paused: `⏸ Просмотры приостановлены`,
  // stopped: `⏹ Просмотры остановлены`,
  ended: '📬 Просмотры завершены'
}

module.exports = async (ctx) => {
  let a

  if (!ctx.state[0]) a = 0
  else if (isNaN(ctx.state[0])) {
    a =
      (await ctx.View.countDocuments({
        _id: { $gte: ObjectId(ctx.state[0]) }
      })) - 1
  } else a = Number(ctx.state[0])

  if (a < 0) return ctx.answerCbQuery('Нельзя', true)

  const count = await ctx.View.countDocuments()
  if (a !== 0 && a + 1 > count) return ctx.answerCbQuery('Нельзя', true)

  await ctx.answerCbQuery()

  ctx.user.state = null

  if (count === 0) {
    return ctx.editMessageText('Нет просмотров', {
      reply_markup: Markup.inlineKeyboard([
        [Markup.callbackButton('Добавить', 'admin_view_add')],
        [Markup.callbackButton('‹ Назад', 'admin_back')]
      ]),
      parse_mode: 'HTML'
    })
  } else {
    await ctx.deleteMessage()
    const result = await ctx.View.findOne().skip(a).sort({ _id: -1 })

    if (ctx.state[1]) {
      const index = Object.keys(statuses).indexOf(result.status) + 1
      const length = Object.keys(statuses).length
      const pureIndex = index % length

      result.status =
        Object.keys(statuses)[pureIndex >= 0 ? pureIndex : length + pureIndex]
      await result.save()
    }

    let extraKeyboard = [
      [
        Markup.callbackButton('◀️', `admin_view_id_${a - 1}`),
        Markup.callbackButton(`${a + 1}/${count} 🔄`, `admin_view_id_${a}`),
        Markup.callbackButton('▶️', `admin_view_id_${a + 1}`)
      ],
      [
        Markup.callbackButton(
          `👉${statuses[result.status]}👈`,
          `admin_view_id_${a}_${result._id}`
        )
      ]
    ]

    if (result.status === 'notStarted') {
      extraKeyboard = extraKeyboard.concat([
        [
          Markup.callbackButton(
            `🔘 Кнопки ${result.keyboard.length ? '✅' : '❌'}`,
            `admin_view_keyboard_${result._id}`
          ),
          Markup.callbackButton('🧹', `admin_view_keyboard_${result._id}_del`)
        ],
        [
          Markup.callbackButton(
            `🕓 Начало ${
              result.startDate
                ? new Date(result.startDate).toLocaleString('ru', dateConfig)
                : '❌'
            }`,
            `admin_view_startDate_${result._id}`
          ),
          Markup.callbackButton('🧹', `admin_view_startDate_${result._id}_del`)
        ],
        [
          Markup.callbackButton(
            `🕤 Окончание ${
              result.endDate
                ? new Date(result.endDate).toLocaleString('ru', dateConfig)
                : '❌'
            }`,
            `admin_view_endDate_${result._id}_end`
          ),
          Markup.callbackButton('🧹', `admin_view_endDate_${result._id}_del`)
        ],
        [
          Markup.callbackButton(
            `🫂 Макс кол-во ${result.quantity === 0 ? '♾️' : result.quantity}`,
            `admin_view_quantity_${result._id}`
          ),
          Markup.callbackButton('🧹', `admin_view_quantity_${result._id}_del`)
        ],
        [
          Markup.callbackButton(
            `🏳️ Язык ${result.lang === null ? 'все' : result.lang}`,
            `admin_view_lang_${result._id}`
          ),
          Markup.callbackButton('🧹', `admin_view_lang_${result._id}_del`)
        ],
        [
          Markup.callbackButton(
            `🌐 Превью ${result.preview ? '✅' : '❌'}`,
            `admin_view_preview_${result._id}`
          ),
          Markup.callbackButton(
            `✉️ Уникальные ${result.unique ? '✅' : '❌'}`,
            `admin_view_unique_${result._id}`
          ),
          Markup.callbackButton(
            '📃 Изменить пост',
            `admin_view_editPost_${result._id}`
          )
        ]
      ])
    }

    if (['doing', 'ended'].includes(result.status)) {
      extraKeyboard = extraKeyboard.concat([
        [
          Markup.callbackButton(
            `👁 Просмотров ${result.views}`,
            'admin_view_none'
          )
        ]
      ])
    }

    extraKeyboard = extraKeyboard.concat([
      [
        Markup.switchToChatButton('✈️ Поделиться', `view_${result._id}`),
        Markup.callbackButton('🗑 Удалить', `admin_view_delete_${result._id}`)
      ],
      [
        Markup.callbackButton('Добавить просмотры', 'admin_view_add'),
        Markup.callbackButton('‹ Назад', 'admin_back')
      ]
    ])
    const keyboard = result.keyboard.concat(extraKeyboard)

    delete result.message.chat

    return ctx.telegram.sendCopy(ctx.from.id, result.message, {
      reply_markup: Markup.inlineKeyboard(keyboard),
      disable_web_page_preview: !result.preview
    })
  }
}
