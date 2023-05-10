const dayjs = require('dayjs')
dayjs
  .extend(require('dayjs/plugin/localizedFormat'))
  .extend(require('dayjs/plugin/relativeTime'))
require('dayjs/locale/ru')

const Markup = require('telegraf/markup')

const Contest = require('../models/contest')
const Participant = require('../models/participant')

const contestShow = async (contest, ctx, shift) => {
  dayjs.locale(ctx.i18n.locale())

  let [count, winners, members] = await Promise.all([
    Contest.countDocuments({
      creator: ctx.user.id,
      bot: ctx.botInfo.id,
      deleted: false
    }),
    Participant.find({ contest: contest._id, status: 'win' }),
    Participant.countDocuments({
      contest: contest._id,
      status: { $nin: ['banned', 'unsubscribed'] }
    })
  ])

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.callbackButton(
        (contest.config.status && ctx.i18n.t('contest.keys.replay')) ||
          ctx.i18n.t('contest.keys.play'),
        `contest_play_${contest._id}`
      ),
      Markup.callbackButton(
        ctx.i18n.t('contest.keys.publish'),
        `contest_pub_${contest._id}`
      )
    ],
    [
      Markup.callbackButton(
        ctx.i18n.t('contest.keys.subscription'),
        `contest_sub_${contest._id}`
      ),
      Markup.callbackButton(
        ctx.i18n.t('contest.keys.playAt'),
        `contest_playAt_${contest._id}`
      )
    ],
    [
      Markup.callbackButton(
        ctx.i18n.t('contest.keys.userList'),
        `contest_userList_${contest._id}`
      ),
      Markup.callbackButton(
        ctx.i18n.t('contest.keys.delete'),
        `contest_delete_${contest._id}`
      )
    ],
    [
      Markup.callbackButton(
        ctx.i18n.t('contest.keys.extra'),
        `contest_extra_${contest._id}`
      )
    ],
    [
      Markup.callbackButton(`⏪`, `contest_navigation_start`),
      Markup.callbackButton(`◀️`, `contest_navigation_${shift - 1}`),
      Markup.callbackButton(`🔄`, `contest_navigation_${shift}`),
      Markup.callbackButton(`▶️`, `contest_navigation_${shift + 1}`),
      Markup.callbackButton(`${count} ⏩`, `contest_navigation_end`)
    ]
  ])

  winners = winners.map((winner, index) =>
    index <= 51
      ? `${
          (winner.username && `@${winner.username}`) ||
          `<a href='tg://user?id=${winner.id}'>${winner.name}</a>`
        } (<code>${winner.id}</code>)`
      : index === 51
      ? '...'
      : ''
  )

  const text = `№${shift + 1} <b>${contest.name}</b>
  
<b>${ctx.i18n.t('contest.status.text')}</b>: ${ctx.i18n.t(
    `contest.status.${contest.config.status}`
  )}
<b>${ctx.i18n.t('contest.key')}</b>: <code>${contest.key}</code>
<b>${ctx.i18n.t('contest.members')}</b>: ${members.format(0)} ${ctx.i18n.t(
    'contest.of'
  )} ${!contest.config.maxMembers ? `∞` : contest.config.maxMembers.format(0)}
<b>${ctx.i18n.t('contest.prize')}</b>: ${contest.config.prize}
<i>${
    (contest.config.playAt &&
      ctx.i18n.t('contest.playAt', {
        date: dayjs(contest.config.playAt).format('D.M.YYYY H:mm'),
        to: dayjs().to(contest.config.playAt, true)
      })) ||
    ''
  }</i>
${
  (contest.config.status &&
    `<b>${ctx.i18n.t('contest.winners')}</b>: \n${winners
      .filter((winner) => winner !== '')
      .join('\n')}`) ||
  ''
}
`

  return { text, keyboard }
}

module.exports = contestShow
