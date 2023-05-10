/* eslint-disable no-unused-vars */
const { parentPort, workerData } = require('worker_threads')

require('../../../models')

const Mail = require('../../../models/mail')
const User = require('../../../models/user')

const sleep = (millis) => new Promise((resolve) => setTimeout(resolve, millis))
const shift = 5000

const { Telegraf } = require('telegraf')
const bot = new Telegraf(process.env.BOT_TOKEN)

function imitateAsync() {}
;(async () => {
  let promises = []
  let died = []
  let alive = []

  const mail = await Mail.findById(workerData)

  const mailConfig = {
    alive: true
  }
  if (mail.lang !== null) mailConfig.lang = mail.lang

  const usersCount = await User.countDocuments()

  mail.status = 'doing'
  let y = 0
  if (mail.success + mail.unsuccess === 0) {
    mail.startDate = Date.now()
    mail.all = usersCount
  } else y = (mail.success + mail.unsuccess) / shift
  await mail.save()

  const message = await bot.telegram.sendCopy(
    mail.uid,
    { ...mail.message, chat: {} },
    {
      reply_markup: {
        inline_keyboard: mail.keyboard
      },
      disable_web_page_preview: !mail.preview
    }
  )
  const message1 = { ...message, chat: {} }

  for (y; y <= Math.ceil(mail.all / shift); y++) {
    const users = await User.find({ id: { $ne: mail.uid } }, { id: 1 })
      .limit(shift)
      .skip(y * shift)

    for (let i = 0; i < users.length; i++) {
      const user = users[i]

      promises.push(
        bot.telegram
          .sendCopy(user.id, i % 2 === 0 ? message : message1, {
            reply_markup: {
              inline_keyboard: mail.keyboard
            },
            disable_web_page_preview: !mail.preview
          })
          .then(() => ({ id: user.id, i, result: true }))
          .catch((e) => ({
            id: user.id,
            i,
            result: e.description
          }))
      )

      if (i !== 0 && i % 10 === 0) {
        const results = await Promise.all(promises)

        const findIndex = results.findIndex(
          (result) =>
            typeof result.result === 'string' &&
            result.result.startsWith('Too Many Requests:')
        )
        const find = results[findIndex]
        if (find) {
          await sleep(parseInt(find.result.match(/\d+/)) * 1000)
          i = find.i - 1
        } else {
          const success = results.filter((result) => result.result).length
          await sleep(success * 16)
        }

        results
          .slice(0, find ? findIndex : results.length)
          .forEach((result) => {
            if (result.result === true) {
              alive.push(result.id)
              mail.success++
            } else {
              Number.isInteger(mail.errorsCount[result.result])
                ? mail.errorsCount[result.result]++
                : (mail.errorsCount[result.result] = 1)

              died.push(result.id)
              mail.unsuccess++
            }
          })

        promises = []
      }

      if (i % 100 === 0) {
        const mailUpd = await Mail.findByIdAndUpdate(
          workerData,
          {
            success: mail.success,
            unsuccess: mail.unsuccess,
            errorsCount: mail.errorsCount
          },
          { new: true }
        )

        await Promise.all([
          User.updateMany({ id: { $in: died } }, { alive: false }),
          User.updateMany({ id: { $in: alive } }, { alive: true })
        ])
        died = []
        alive = []

        if (mailUpd.status === 'paused' || mailUpd.status === 'stopped')
          return parentPort.postMessage('stop')
      }
    }
  }

  // console.log(Object.entries(errorsCount).map(([key, value]) => `${key} - ${value}`))

  await Promise.all([
    ...promises,
    User.updateMany({ id: { $in: died } }, { alive: false }),
    User.updateMany({ id: { $in: alive } }, { alive: true })
  ])

  await Mail.findByIdAndUpdate(workerData, {
    endDate: Date.now(),
    status: 'ended',
    success: mail.success,
    unsuccess: mail.unsuccess,
    all: mail.success + mail.unsuccess,
    errorsCount: mail.errorsCount
  })

  parentPort.postMessage('complete')
})()
