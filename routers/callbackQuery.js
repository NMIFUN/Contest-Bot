const { Router } = require('telegraf')
const config = require('../config')

const View = require('../models/view')
const Mail = require('../models/mail')
const Contest = require('../models/contest')
const Bot = require('../models/bot')

const router = new Router(async (ctx) => {
  const split = ctx.callbackQuery.data.split('_')

  ctx.state = split.slice(1, split.length)
  return { route: split[0] }
})

router.on('translateBot', require('../actions/translateBot'))
router.on('subscription', require('../middlewares/subscription'))

router.on(
  'contestRegistration',
  require('../actions/contest/registrationInline')
)

router.on('inlineUpdateMail', require('../actions/admin/mail/inlineUpdate'))
router.on('inlineUpdateView', require('../actions/admin/view/inlineUpdate'))

const contestRouter = new Router(async (ctx) => {
  const split = ctx.callbackQuery.data.split('_')

  ctx.Contest = Contest

  ctx.state = split.slice(2, split.length)
  return { route: split[1] }
})

contestRouter.on('navigation', require('../actions/contest'))
contestRouter.on('back', require('../actions/contest/back'))

contestRouter.on('delete', require('../actions/contest/delete'))
contestRouter.on('sub', require('../actions/contest/subscription'))
contestRouter.on('playAt', require('../actions/contest/playAt'))
contestRouter.on('userList', require('../actions/contest/userList'))
contestRouter.on('play', require('../actions/contest/play'))
contestRouter.on('extra', require('../actions/contest/extra'))

contestRouter.on('pub', require('../actions/contest/publish'))
contestRouter.on('pubPost', require('../actions/contest/publish/post'))
contestRouter.on('pubPlan', require('../actions/contest/publish/plan'))

router.on('contest', contestRouter)

const botRouter = new Router(async (ctx) => {
  const split = ctx.callbackQuery.data.split('_')

  ctx.Bot = Bot

  ctx.state = split.slice(2, split.length)
  return { route: split[1] }
})

botRouter.on('navigation', require('../actions/bot'))
botRouter.on('back', require('../actions/bot/back'))

botRouter.on('delete', require('../actions/bot/delete'))
botRouter.on('create', require('../actions/bot/create'))
botRouter.on('updateToken', require('../actions/bot/updateToken'))

router.on('bot', botRouter)

const adminRouter = new Router(async (ctx) => {
  if (!config.admins.includes(ctx.from.id)) return

  const split = ctx.callbackQuery.data.split('_')

  ctx.state = split.slice(2, split.length)
  return { route: split[1] }
})

adminRouter.on('addAdmin', require('../actions/admin/addAdmin'))
adminRouter.on('addSubscription', require('../actions/admin/addSubscription'))
adminRouter.on(
  'addBotSubscription',
  require('../actions/admin/addBotSubscription')
)
adminRouter.on('addJoin', require('../actions/admin/addJoin'))
adminRouter.on('listUsers', require('../actions/admin/listUsers'))
adminRouter.on('sysRef', require('../actions/admin/sysRef'))
adminRouter.on('ban', require('../actions/admin/ban'))
adminRouter.on('stat', require('../actions/admin/stat'))
adminRouter.on('botStat', require('../actions/admin/botStat'))

const adminViewRouter = new Router(async (ctx) => {
  const split = ctx.callbackQuery.data.split('_')

  if (!split[2]) split[2] = 'nothing'
  ctx.View = View

  ctx.state = split.slice(3, split.length)
  return { route: split[2] }
})

adminViewRouter.on('nothing', require('../actions/admin/view'))
adminViewRouter.on('id', require('../actions/admin/view'))

adminViewRouter.on('add', require('../actions/admin/view/add'))

adminViewRouter.on('keyboard', require('../actions/admin/view/keyboard'))
adminViewRouter.on('lang', require('../actions/admin/view/lang'))
adminViewRouter.on('quantity', require('../actions/admin/view/quantity'))
adminViewRouter.on('preview', require('../actions/admin/view/preview'))
adminViewRouter.on('unique', require('../actions/admin/view/unique'))
adminViewRouter.on('editPost', require('../actions/admin/view/editPost'))
adminViewRouter.on('startDate', require('../actions/admin/view/startDate'))
adminViewRouter.on('endDate', require('../actions/admin/view/endDate'))
adminViewRouter.on('delete', require('../actions/admin/view/delete'))
adminViewRouter.on('none', (ctx) => ctx.answerCbQuery())

adminRouter.on('view', adminViewRouter)

const adminMailRouter = new Router(async (ctx) => {
  const split = ctx.callbackQuery.data.split('_')

  if (!split[2]) split[2] = 'nothing'
  ctx.Mail = Mail

  ctx.state = split.slice(3, split.length)
  return { route: split[2] }
})

adminMailRouter.on('nothing', require('../actions/admin/mail'))
adminMailRouter.on('id', require('../actions/admin/mail'))

adminMailRouter.on('add', require('../actions/admin/mail/add'))

adminMailRouter.on('keyboard', require('../actions/admin/mail/keyboard'))
adminMailRouter.on('lang', require('../actions/admin/mail/lang'))
adminMailRouter.on('quantity', require('../actions/admin/mail/quantity'))
adminMailRouter.on('preview', require('../actions/admin/mail/preview'))
adminMailRouter.on('editPost', require('../actions/admin/mail/editPost'))
adminMailRouter.on('startDate', require('../actions/admin/mail/startDate'))
adminMailRouter.on('delete', require('../actions/admin/mail/delete'))
adminMailRouter.on('action', require('../actions/admin/mail/action'))
adminMailRouter.on('start', require('../actions/admin/mail/start'))
adminMailRouter.on('none', (ctx) => ctx.answerCbQuery())

adminRouter.on('mail', adminMailRouter)

adminRouter.on('back', require('../actions/admin'))

router.on('admin', adminRouter)

module.exports = router
