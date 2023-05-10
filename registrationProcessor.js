const path = require('path')
require('dotenv').config({ path: path.resolve('.env') })

const Contest = require('./models/contest')
const Participant = require('./models/participant')
require('./models')

const convertChars = require('./helpers/convertChars')

const cluster = require('cluster')
require('cluster-shared-memory')
const os = require('os')

const Queue = require('bull')
const registrationQueue = new Queue('registration', {
  redis: {
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASS
  }
})

const { Telegraf } = require('telegraf')
const bot = new Telegraf('', { handlerTimeout: 1 })

const errorAction = require('./actions/error')

const I18n = require('telegraf-i18n')
const i18n = new I18n({
  directory: 'locales',
  defaultLanguage: 'ru',
  defaultLanguageOnMissing: true
})

const errorHandler = (err, botUsername, contestId) =>
  errorAction(
    err,
    { updateType: 'registration', updateSubTypes: [`${contestId}`] },
    botUsername,
    cluster.worker.id
  )

if (cluster.isMaster) {
  for (let i = 0; i < os.cpus().length; i++) cluster.fork()
} else {
  console.log(`Starting registrationProcessor №${cluster.worker.id}`)
  const sharedMemoryController = require('cluster-shared-memory')

  const cancel = (thisBot, id, fromId, contest, reason, channels) => {
    console.log(
      `${new Date().toLocaleString('ru')} @${bot.username}[${
        cluster.worker.id
      }] ${fromId} on ${contest._id} failed with ${reason}`
    )

    return thisBot.telegram
      .answerCbQuery(
        id,
        i18n.t(contest.language, `registration.${reason}`, {
          name: contest.name,
          channels
        }),
        true
      )
      .catch((err) => errorHandler(err, thisBot.username, contest._id))
  }

  registrationQueue.process(100, async (job) => {
    bot.token = job.data.botInfo.token
    bot.username = job.data.botInfo.username

    const contestId = job.data.data.split('_')[1]

    const participant = await Participant.findOne({
      id: job.data.from.id,
      contest: contestId
    })

    let contest = await sharedMemoryController.get(`contest_${contestId}`)
    if (!contest?.saveTime || Date.now() - contest.saveTime > 60000) {
      const [cont, members] = await Promise.all([
        Contest.findOne({ _id: contestId }, 'name config subscription posts'),
        Participant.countDocuments({
          contest: contestId,
          status: 'active'
        })
      ])
      contest = {
        ...cont._doc,
        membersCount: members,
        saveTime: Date.now()
      }

      await sharedMemoryController.set(`contest_${contestId}`, contest)
    }

    if (
      contest.config.maxMembers !== 0 &&
      contest.config.maxMembers <= contest.membersCount
    )
      return cancel(bot, job.data.id, job.data.from.id, contest, 'full')

    if (contest.config.checkUsername && !job.data.from.username)
      return cancel(
        bot,
        job.data.id,
        job.data.from.id,
        contest,
        'checkUsername'
      )

    if (contest.config.status)
      return cancel(
        bot,
        job.data.id,
        job.data.from.id,
        contest,
        'alreadyPlayed'
      )

    if (participant?.status === 'banned')
      return cancel(
        bot,
        job.data.id,
        job.data.from.id,
        contest,
        'alreadyPlayed'
      )

    if (participant?.status === 'unsubscribed' && contest.config.unsubscribe)
      return cancel(bot, job.data.id, job.data.from.id, contest, 'unsubscribed')

    if (participant?.status && participant?.status !== 'unsubscribed')
      return cancel(
        bot,
        job.data.id,
        job.data.from.id,
        contest,
        'alreadyEnteredInline'
      )

    if (contest.subscription?.length) {
      let subscription = await Promise.all(
        contest.subscription.map((channel) =>
          bot.telegram
            .getChatMember(channel.id, job.data.from.id)
            .then((result) => ({ channel, result }))
            .catch((error) => ({ channel, error }))
        )
      )
      subscription = subscription.filter(
        (channel) =>
          !!(
            !channel.result ||
            channel.result.status === 'left' ||
            channel.result.status === 'kicked' ||
            (channel.channel.type === 'supergroup' &&
              channel.result.status === 'restricted' &&
              !channel.result.is_member)
          )
      )
      subscription = subscription.map((channel) => channel.channel.title)

      if (subscription.length)
        return cancel(
          bot,
          job.data.id,
          job.data.from.id,
          contest,
          `notSubscribed`,
          subscription.join(', ')
        )
    }

    console.log(
      `${new Date().toLocaleString('ru')} @${bot.username}[${
        cluster.worker.id
      }] ${job.data.from.id} on ${contest._id} completed`
    )

    return Promise.all([
      bot.telegram
        .answerCbQuery(
          job.data.id,
          i18n.t(contest.language, 'registration.successInline', {
            name: contest.name
          }),
          true
        )
        .catch((err) => errorHandler(err, bot.username, contest._id)),
      Participant.updateOne(
        {
          id: job.data.from.id,
          contest: contest._id
        },
        {
          username: job.data.from.username,
          name: convertChars(job.data.from.first_name),
          status: 'active',
          registerDate: new Date()
        },
        { upsert: true }
      ).catch(() => {}),
      contest.posts.findIndex((post) =>
        post.inlineMessageId
          ? post.inlineMessageId === job.data.inline_message_id
          : post.messageId
          ? post.messageId === job.data.message?.message_id
          : false
      ) === -1
        ? await Contest.updateOne(
            { _id: contest._id },
            {
              $addToSet: {
                posts: {
                  inlineMessageId: job.data.inline_message_id,
                  messageId: job.data.message?.message_id,
                  chatId: job.data.message?.chat?.id,
                  type: job.data.message
                    ? job.data.message.text
                      ? 'text'
                      : 'media'
                    : 'indefinitely'
                }
              }
            }
          )
        : undefined
    ])
  })
}

setInterval(async () => await registrationQueue.clean(5000), 30 * 60000)
