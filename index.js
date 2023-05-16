/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
const path = require('path')
require('dotenv').config({ path: path.resolve('.env') })

// eslint-disable-next-line no-extend-native
Number.prototype.format = function (n, x) {
  const re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\.' : '$') + ')'
  return this.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, 'g'), '$& ')
}

const cluster = require('cluster')
const os = require('os')

require('./models')

const { Telegraf } = require('telegraf')
const bot = new Telegraf('', { handlerTimeout: 1 })

bot.catch((err, ctx) =>
  require('./actions/error')(err, ctx, ctx.botInfo.username, cluster.worker.id)
)

const I18n = require('telegraf-i18n')
const i18n = new I18n({
  directory: 'locales',
  defaultLanguage: 'ru',
  defaultLanguageOnMissing: true
})
bot.use(i18n.middleware())

const rateLimit = require('telegraf-ratelimit')
const limitConfig = {
  window: 3000,
  limit: 3
}
bot.use(rateLimit(limitConfig))

const Bot = require('./models/bot')

bot.use(async (ctx, next) => {
  const findBot =
    bot.token === process.env.BOT_TOKEN
      ? {
          token: process.env.BOT_TOKEN,
          username: process.env.BOT_USERNAME,
          id: Number(process.env.BOT_ID)
        }
      : bot.token === process.env.BOT_TOKEN1
      ? {
          token: process.env.BOT_TOKEN1,
          username: process.env.BOT_USERNAME1,
          id: Number(process.env.BOT_ID1)
        }
      : await Bot.findOne({ token: bot.token })
  if (!findBot) return

  ctx.botInfo = findBot

  return next()
})

bot.on('chat_join_request', require('./actions/chatJoin'))
bot.on('my_chat_member', require('./actions/myChatMember'))
bot.on('chat_member', require('./actions/chatMember'))
bot.on('chosen_inline_result', require('./actions/inlineFeedback'))

bot.action(
  /contestRegistration_\w+/g,
  require('./actions/contest/registrationInline')
)

bot.use(require('./middlewares/attachUser'))

bot.use((ctx, next) =>
  require('./middlewares/logging')(ctx, next, cluster.worker.id)
)

bot.on('text', require('./middlewares/sysRefs'))

bot.on('message', require('./middlewares/subscription'))

bot.hears(I18n.match('start.keys.create'), require('./actions/create'))
bot.hears(I18n.match('start.keys.contests'), require('./actions/contest'))
bot.hears(I18n.match('start.keys.bots'), require('./actions/bot'))

bot.on('message', require('./routers/message'))

bot.on('callback_query', require('./routers/callbackQuery'))

bot.on('inline_query', require('./routers/inlineQuery'))

const fastify = require('fastify')({ logger: false })

fastify.post(`/${process.env.WEBHOOK_PATH}`, async (request, reply) => {
  if (!request.headers['x-telegram-bot-api-secret-token'])
    return reply.code(403).send('x-telegram-bot-api-secret-token not found')

  bot.token = request.headers['x-telegram-bot-api-secret-token'].replace(
    '-----',
    ':'
  )

  return bot.handleUpdate(request.body, reply)
})

const start = async () => {
  console.log(`Starting main №${cluster.worker.id}`)

  try {
    await fastify.listen({ port: Number(process.env.WEBHOOK_PORT) })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

if (cluster.isMaster) for (let i = 0; i < os.cpus().length; i++) cluster.fork()
else start()

const updateStat = require('./helpers/updateStat')
const updateWebhook = require('./helpers/updateWebhook')
const botStat = require('./helpers/botStat')

const schedule = require('node-schedule')
const Mail = require('./models/mail')
const Contest = require('./models/contest')

const lauchWorker = require('./actions/admin/mail/lauchWorker')

function r() {}
;(async () => {
  const result = await Mail.findOne({ status: 'doing' })
  if (result) lauchWorker(result._id)

  if (!cluster.isMaster) return

  await Promise.all([
    updateWebhook(process.env.BOT_TOKEN, bot),
    updateWebhook(process.env.BOT_TOKEN1, bot)
  ])
})()

schedule.scheduleJob('* * * * *', async () => {
  const result = await Mail.findOne({
    status: 'notStarted',
    startDate: { $exists: true, $lte: new Date() }
  })
  if (result) lauchWorker(result._id)
})

const { randomInt } = require('crypto')

schedule.scheduleJob(`0 ${randomInt(2, 6)} * * *`, async () => {
  await updateStat(bot)

  await botStat()
})
