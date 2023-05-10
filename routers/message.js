const { Router } = require('telegraf')
const config = require('../config')

const View = require('../models/view')
const Mail = require('../models/mail')
const Contest = require('../models/contest')
const Bot = require('../models/bot')

const router = new Router(async (ctx) => {
  const route =
    ctx.message?.text?.startsWith('/') || ctx.chat.type !== 'private'
      ? 'command'
      : ctx.user.state
      ? 'state'
      : 'else'

  return { route }
})

const adminRouter = new Router(async (ctx) => {
  if (!config.admins.includes(ctx.from.id)) return
  const cmd = ctx.user.state.split('_')

  ctx.state = cmd.slice(2, cmd.length)
  return { route: cmd[1] }
})

const commandRouter = new Router(async (ctx) => {
  if (!ctx.message?.text) return
  const cmd = ctx.message.text.replace('/', '').split(' ')

  ctx.state = cmd.slice(1, cmd.length)
  const command = cmd[0]
    .replace('/', '')
    .replace(`@${ctx.botInfo.username}`, '')

  if (ctx.chat.type !== 'private' && command !== 'id') return

  return { route: command }
})

commandRouter.on('admin', require('../actions/admin'))
commandRouter.on('start', require('../actions/start'))
commandRouter.on('lang', require('../actions/translateBot'))

commandRouter.on('contest', require('../actions/admin/contest'))

commandRouter.on('id', (ctx) => ctx.reply(ctx.chat.id))

router.on('command', commandRouter)

const stateRouter = new Router(async (ctx) => {
  const cmd = ctx.user.state.split('_')

  ctx.state = cmd.slice(1, cmd.length)
  return { route: cmd[0] }
})

adminRouter.on('addAdmin', require('../actions/admin/addAdmin'))
adminRouter.on('addSubscription', require('../actions/admin/addSubscription'))
adminRouter.on(
  'addBotSubscription',
  require('../actions/admin/addBotSubscription')
)
adminRouter.on('addJoin', require('../actions/admin/addJoin'))
adminRouter.on('sysRef', require('../actions/admin/sysRef'))
adminRouter.on('ban', require('../actions/admin/ban'))
adminRouter.on('botStat', require('../actions/admin/botStat'))

const adminViewRouter = new Router(async (ctx) => {
  const cmd = ctx.user.state.split('_')

  ctx.View = View

  ctx.state = cmd.slice(3, cmd.length)
  return { route: cmd[2] }
})

adminViewRouter.on('add', require('../actions/admin/view/add'))

adminViewRouter.on('keyboard', require('../actions/admin/view/keyboard'))
adminViewRouter.on('lang', require('../actions/admin/view/lang'))
adminViewRouter.on('quantity', require('../actions/admin/view/quantity'))
adminViewRouter.on('editPost', require('../actions/admin/view/editPost'))
adminViewRouter.on('startDate', require('../actions/admin/view/startDate'))
adminViewRouter.on('endDate', require('../actions/admin/view/endDate'))

adminRouter.on('view', adminViewRouter)

const adminMailRouter = new Router(async (ctx) => {
  const cmd = ctx.user.state.split('_')

  ctx.Mail = Mail

  ctx.state = cmd.slice(3, cmd.length)
  return { route: cmd[2] }
})

adminMailRouter.on('add', require('../actions/admin/mail/add'))

adminMailRouter.on('keyboard', require('../actions/admin/mail/keyboard'))
adminMailRouter.on('lang', require('../actions/admin/mail/lang'))
adminMailRouter.on('quantity', require('../actions/admin/mail/quantity'))
adminMailRouter.on('editPost', require('../actions/admin/mail/editPost'))
adminMailRouter.on('startDate', require('../actions/admin/mail/startDate'))

adminRouter.on('mail', adminMailRouter)

stateRouter.on('admin', adminRouter)

stateRouter.on('create', require('../actions/create'))

const contestRouter = new Router(async (ctx) => {
  const cmd = ctx.user.state.split('_')

  ctx.Contest = Contest

  ctx.state = cmd.slice(2, cmd.length)
  return { route: cmd[1] }
})

contestRouter.on('sub', require('../actions/contest/subscription'))
contestRouter.on('playAt', require('../actions/contest/playAt'))
contestRouter.on('extra', require('../actions/contest/extra'))

contestRouter.on('pubPost', require('../actions/contest/publish/post'))
contestRouter.on('pubPlan', require('../actions/contest/publish/plan'))

stateRouter.on('contest', contestRouter)

const botRouter = new Router(async (ctx) => {
  const cmd = ctx.user.state.split('_')

  ctx.Bot = Bot

  ctx.state = cmd.slice(2, cmd.length)
  return { route: cmd[1] }
})

botRouter.on('updateToken', require('../actions/bot/updateToken'))
botRouter.on('create', require('../actions/bot/create'))

stateRouter.on('bot', botRouter)

router.on('state', stateRouter)

router.on('else', require('../actions/start'))

module.exports = router
