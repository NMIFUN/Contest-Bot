const path = require('path')
require('dotenv').config({ path: path.resolve('.env') })

console.log('Starting updater')

const Contest = require('./models/contest')
const Bot = require('./models/bot')
const Participant = require('./models/participant')
require('./models')

const play = require('./helpers/play')
const postsUpdate = require('./helpers/postsUpdate')
const postPublish = require('./helpers/postPublish')
const postCreate = require('./helpers/postCreate')

const { Telegraf } = require('telegraf')
const bot = new Telegraf('', { handlerTimeout: 1 })

const I18n = require('telegraf-i18n')
const i18n = new I18n({
  directory: 'locales',
  defaultLanguage: 'ru',
  defaultLanguageOnMissing: true
})

// eslint-disable-next-line no-extend-native
Number.prototype.format = function (n, x) {
  const re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\.' : '$') + ')'
  return this.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, 'g'), '$& ')
}

const schedule = require('node-schedule')

schedule.scheduleJob('* * * * *', async () => {
  const now = new Date()
  now.setSeconds(0)
  now.setMilliseconds(0)

  const [playAt, posts, publish] = await Promise.all([
    Contest.find({
      'config.status': false,
      'config.playAt': {
        $gte: now.getTime(),
        $lt: now.getTime() + 60000,
        $exists: true
      },
      deleted: false
    }),
    Contest.find({
      posts: { $exists: true, $ne: [] },
      deleted: false
    }),
    Contest.find({
      'post.time': {
        $gte: now.getTime(),
        $lt: now.getTime() + 60000,
        $exists: true
      },
      deleted: false
    })
  ])

  for (let contest of playAt) {
    const findBot = await Bot.findOne({ id: contest.bot })
    bot.token = findBot.token
    bot.username = findBot.username

    const result = await play(contest, bot.telegram)

    if (result)
      contest = await Contest.findOneAndUpdate(
        { _id: contest._id },
        { 'config.status': true, 'config.playAt': undefined },
        { new: true }
      )

    console.log(
      `${new Date().toLocaleString('ru')} contest ${contest._id} played`
    )

    await Promise.all([
      postsUpdate(contest, bot),
      bot.telegram.sendMessage(
        contest.creator,
        i18n.t(contest.language, 'playAt.planned', { name: contest.name }),
        {
          parse_mode: 'HTML'
        }
      )
    ])
  }

  for (const contest of posts) {
    const findBot = await Bot.findOne({ id: contest.bot })
    bot.token = findBot.token
    bot.username = findBot.username

    const membersCount = await Participant.countDocuments({
      contest: contest._id,
      status: { $nin: ['banned', 'unsubscribed'] }
    })

    if (
      contest.config.status !== contest.lastPostsUpdate?.status ||
      membersCount !== contest.lastPostsUpdate?.membersCount
    ) {
      console.log(
        `${new Date().toLocaleString('ru')} contest ${
          contest._id
        } posts updated`
      )
      await postsUpdate(contest, bot)
    }
  }

  for (const contest of publish) {
    const findBot = await Bot.findOne({ id: contest.bot })
    bot.token = findBot.token
    bot.username = findBot.username

    const post = await postCreate(
      contest,
      contest.config.status,
      contest.language,
      bot.username
    )

    const messages = await Promise.all(
      contest.post.channels.map((channel) =>
        postPublish(bot.telegram, channel.id, post)
      )
    )
    await Contest.updateOne(
      { _id: contest._id },
      {
        $addToSet: {
          posts: {
            $each: messages.map((message) => ({
              messageId: message.message_id,
              chatId: message.chat.id,
              type: post.type
            }))
          }
        }
      }
    )
    await bot.telegram.sendMessage(
      contest.creator,
      i18n.t(contest.language, 'publish.plan.time.planned', {
        name: contest.name
      }),
      {
        parse_mode: 'HTML'
      }
    )

    console.log(
      `${new Date().toLocaleString('ru')} contest ${
        contest._id
      } posts published`
    )
  }
})
