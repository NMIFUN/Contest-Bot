const { Router } = require('telegraf')

const router = new Router(async (ctx) => {
  const split = ctx.inlineQuery.query.split('_')

  ctx.state = split
  return { route: split[0] }
})

router.on('mail', require('../actions/admin/mail/inline'))
router.on('view', require('../actions/admin/view/inline'))

router.otherwise(require('../actions/contest/publishInline'))

module.exports = router
