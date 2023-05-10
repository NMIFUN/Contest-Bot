const Markup = require('telegraf/markup')

const postCreate = require('../../../helpers/postCreate')
const postPublish = require('../../../helpers/postPublish')
const postsUpdate = require('../../../helpers/postsUpdate')

const toHTML = require('../../../helpers/toHTML')

module.exports = async (ctx) => {
  let contest = await ctx.Contest.findOne({ _id: ctx.state[0] })

  if (ctx.callbackQuery) {
    ctx.user.state = null

    await ctx.answerCbQuery()
  }

  if (ctx.state[2] === 'edit') {
    if (ctx.callbackQuery) {
      if (ctx.message || !ctx.callbackQuery?.message?.text)
        await ctx.deleteMessage()

      ctx.user.state = `contest_pubPost_${ctx.state[0]}_${ctx.state[1]}_edit`

      return ctx[
        ctx.callbackQuery?.message?.text ? 'editMessageText' : 'reply'
      ](
        ctx.i18n.t(`publish.post.${ctx.state[1]}.text`),
        Markup.inlineKeyboard([
          Markup.callbackButton(
            ctx.i18n.t('back'),
            `contest_pubPost_${ctx.state[0]}_${ctx.state[1]}`
          )
        ]).extra({ parse_mode: 'HTML' })
      )
    }

    await ctx.Contest.findOneAndUpdate(
      { _id: ctx.state[0] },
      {
        [`post.${ctx.state[1]}`]: {
          text:
            (ctx.message.text &&
              toHTML(ctx.message.text, ctx.message.entities)) ||
            toHTML(ctx.message.caption, ctx.message.caption_entities),
          media:
            (ctx.message[ctx.updateSubTypes[0]].file_id &&
              ctx.message[ctx.updateSubTypes[0]].file_id) ||
            (Array.isArray(ctx.message[ctx.updateSubTypes[0]]) &&
              ctx.message[ctx.updateSubTypes[0]][
                ctx.message[ctx.updateSubTypes[0]].length - 1
              ].file_id) ||
            undefined,
          type: ctx.updateSubTypes[0]
        }
      }, { new: true }
    )
    ctx.user.state = `contest_pubPost_${ctx.state[0]}_${ctx.state[1]}_keyboard`

    return Promise.all([
      ctx.replyWithHTML(
        ctx.i18n.t(`publish.post.${ctx.state[1]}.keyboard`),
        Markup.inlineKeyboard([
          [
            Markup.callbackButton(
              ctx.i18n.t(`publish.keys.skip`),
              `contest_pubPost_${ctx.state[0]}_${ctx.state[1]}_skip`
            )
          ],
          [
            Markup.callbackButton(
              ctx.i18n.t('back'),
              `contest_pubPost_${ctx.state[0]}_${ctx.state[1]}_edit`
            )
          ]
        ]).extra()
      ),
      postsUpdate(contest, ctx, true)
    ])
  } else if (ctx.state[2] === 'keyboard') {
    if (!ctx.message.text)
      return ctx.reply(ctx.i18n.t(`publish.post.errorKeyboard`))

    const possibleUrls = [
      'http://',
      'https://',
      'tg://',
      'ton://',
      't.me/',
      'telegram.me/'
    ]

    const splitByEnter = ctx.message.text.split('\n')

    const keyboard = splitByEnter.map((enter) => {
      const splitByWand = enter.split('|')

      return splitByWand.map((wand) => {
        const indexOfUrl = wand.indexOf(
          possibleUrls.find((url) => wand.includes(url))
        )

        const key =
          indexOfUrl === -1
            ? {
                text: wand.replace(' - ', '').trim(),
                callback_data: 'contestRegistration_{id}'
              }
            : {
                text: wand.slice(0, indexOfUrl).replace(' - ', '').trim(),
                url: wand.slice(indexOfUrl).trim()
              }

        return key.text && (key.url || key.callback_data) ? key : false
      })
    })

    if (
      keyboard.findIndex(
        (enterKeyboard) => enterKeyboard.findIndex((key) => !key) !== -1
      ) !== -1
    )
      return ctx.reply(ctx.i18n.t(`publish.post.errorKeyboard`))

    ctx.user.state = null

    contest = await ctx.Contest.findByIdAndUpdate(
      contest._id,
      {
        [`post.${ctx.state[1]}.keyboard`]: keyboard
      },
      { new: true }
    )
    await postsUpdate(contest, ctx, true)
  }

  const post = await postCreate(
    contest,
    ctx.state[1],
    ctx.i18n.locale(),
    ctx.botInfo.username
  )
  post.keyboard.push(
    [
      Markup.callbackButton(
        ctx.i18n.t(`publish.keys.edit`),
        `contest_pubPost_${ctx.state[0]}_${ctx.state[1]}_edit`
      )
    ],
    [Markup.callbackButton(ctx.i18n.t('back'), `contest_pub_${ctx.state[0]}`)]
  )

  await ctx.deleteMessage()

  return postPublish(ctx.telegram, ctx.user.id, post).catch((error) =>
    ctx.replyWithHTML(
      ctx.i18n.t(`publish.post.errorInPost`, { error }),
      Markup.inlineKeyboard([
        [
          Markup.callbackButton(
            ctx.i18n.t(`publish.keys.edit`),
            `contest_pubPost_${ctx.state[0]}_${ctx.state[1]}_edit`
          )
        ],
        [
          Markup.callbackButton(
            ctx.i18n.t('back'),
            `contest_pub_${ctx.state[0]}`
          )
        ]
      ]).extra()
    )
  )
}
