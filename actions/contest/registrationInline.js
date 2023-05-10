const Queue = require('bull')
const registrationQueue = new Queue('registration', {
  redis: {
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASS
  }
})

module.exports = (ctx) =>
  registrationQueue.add({ ...ctx.callbackQuery, botInfo: ctx.botInfo })
