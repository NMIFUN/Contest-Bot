const ShortUniqueId = require('short-unique-id')
const genkey = new ShortUniqueId({ length: 6 })

const convertChars = require('../helpers/convertChars')
const contestShow = require('../helpers/contestShow')

const Contest = require('../models/contest')

module.exports = async (ctx) => {
  if (
    ctx.callbackQuery ||
    ctx.message.text === ctx.i18n.t('start.keys.create') ||
    ctx.message.text === ctx.i18n.t('start.keys.contests')
  ) {
    if (ctx.callbackQuery) await ctx.answerCbQuery()

    ctx.user.state = 'create'
    return ctx[ctx.message ? 'reply' : 'editMessageText'](
      ctx.i18n.t('create.text'),
      {
        parse_mode: 'HTML'
      }
    )
  } else {
    if (!ctx.message.text) return ctx.replyWithHTML(ctx.i18n.t(`create.text`))
    if (ctx.message.text.length > 100)
      return ctx.replyWithHTML(ctx.i18n.t(`create.length`))

    const [count] = await Promise.all([
      Contest.countDocuments({
        creator: ctx.user.id,
        bot: ctx.botInfo.id,
        deleted: false
      })
    ])

    if (ctx.botInfo.id === Number(process.env.BOT_TOKEN1))
      return ctx.replyWithHTML(ctx.i18n.t(`bot.noContestsInSecondBot`))

    ctx.user.state = null
    ctx.user.contests.created = ctx.user.contests.created + 1

    const key = genkey()
    const contest = await Contest.create({
      key,
      creator: ctx.user.id,
      name: convertChars(ctx.message.text),
      language: ctx.i18n.locale(),
      bot: ctx.botInfo.id
    })

    const { text, keyboard } = await contestShow(contest, ctx, count)

    return Promise.all([
      ctx.replyWithHTML(text, keyboard.extra()),
      ctx.telegram.sendMessage(
        process.env.NOTIFY_CHAT,
        `<a href='${
          ctx.user.username
            ? `t.me/${ctx.user.username}`
            : `tg://user?id=${ctx.user.id}`
        }'>${ctx.user.name}</a> (<code>${ctx.user.id}</code>) создал "${
          contest.name
        }"`,
        {
          parse_mode: 'HTML'
        }
      )
    ])
  }
}
