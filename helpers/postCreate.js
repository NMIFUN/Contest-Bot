const I18n = require('telegraf-i18n')
const i18n = new I18n({
  directory: './locales',
  defaultLanguage: 'ru',
  defaultLanguageOnMissing: true
})

const dayjs = require('dayjs')
dayjs.extend(require('dayjs/plugin/localizedFormat'))

const Participant = require('../models/participant')

const substrHTML = require('./substrHTML')

module.exports = async (contest, template, lang, botUsername) => {
  dayjs.locale(lang)

  let [winners, members] = await Promise.all([
    Participant.find({ contest: contest._id, status: 'win' }),
    Participant.countDocuments({
      contest: contest._id,
      status: { $nin: ['banned', 'unsubscribed'] }
    })
  ])

  const publishTemplate = (contest.post[template]?.type &&
    contest.post[template]) || {
    type: 'text',
    text: i18n.t(lang, `defaultPost.${template}`)
  }
  publishTemplate.preview = !contest.post.preview

  const channels = contest.subscription.map(
    (channel) =>
      `<a href='${channel.link || `https://t.me/${channel.username}`}'>${
        channel.title
      }</a>`
  )

  const winnersWithId = winners.map((winner, index) =>
    index <= 101
      ? `${
          (winner.username && `@${winner.username}`) ||
          `<a href='tg://user?id=${winner.id}'>${winner.name}</a>`
        } (<code>${winner.id}</code>)`
      : index === 101
      ? '...'
      : ''
  )
  const winnersWithPlace = winners.map((winner, index) =>
    index <= 151
      ? `${index + 1}. ${
          (winner.username && `@${winner.username}`) ||
          `<a href='tg://user?id=${winner.id}'>${winner.name} (${winner.id})</a>`
        }`
      : index === 151
      ? '...'
      : ''
  )
  winners = winners.map((winner, index) =>
    index <= 151
      ? `${
          (winner.username && `@${winner.username}`) ||
          `<a href='tg://user?id=${winner.id}'>${Array.from(winner.name)
            .slice(0, 10)
            .join('')}</a>`
        }`
      : index === winner.name
      ? '...'
      : ''
  )

  publishTemplate.variables = [
    '{name}',
    '{key}',
    '{members}',
    '{max_members}',
    '{prize}',
    '{link}',
    '{subs}',
    '{time}',
    '{winners}',
    '{winnersSimply}'
  ].some((text) => publishTemplate.text.includes(text))

  publishTemplate.text = publishTemplate.text
    .replace(/{name}/g, contest.name)
    .replace(/{key}/g, contest.key)
    .replace(/{members}/g, members.format(0))
    .replace(
      /{max_members}/g,
      contest.config.maxMembers ? '∞' : contest.config.maxMembers.format(0)
    )
    .replace(/{prize}/g, contest.config.prize)
    .replace(/{link}/g, `https://t.me/${botUsername}?start=reg-${contest.key}`)
    .replace(/{subs}/g, channels.join(', ') || '{subs}')
    .replace(
      /{time}/g,
      (contest.config.playAt &&
        dayjs(contest.config.playAt).format('D.M.YYYY H:mm')) ||
        '{time}'
    )
    .replace(/{winners}/g, template ? winners.join(', ') || '{winners}' : '')
    .replace(
      /{winnersSimply}/g,
      template ? winners.join(', ') || '{winnersSimply}' : ''
    )
    .replace(
      /{winnersWithId}/g,
      template ? winnersWithId.join(', ') || '{winnersWithId}' : ''
    )
    .replace(
      /{winnersWithPlace}/g,
      template ? winnersWithPlace.join('\n ') || '{winnersWithPlace}' : ''
    )

  publishTemplate.text = publishTemplate.media
    ? substrHTML(publishTemplate.text, 1024)
    : substrHTML(publishTemplate.text, 4096)

  publishTemplate.keyboard = publishTemplate.keyboard?.length
    ? publishTemplate.keyboard
    : !template
    ? [
        [
          {
            text: i18n.t(lang, 'defaultPost.keyboard'),
            callback_data: `contestRegistration_{id}`
          }
        ]
      ]
    : []

  publishTemplate.keyboard.map((keyboard) =>
    keyboard.map((keyboardInner) => {
      keyboardInner.text = keyboardInner.text
        .replace(/{members}/g, members.format(0))
        .replace(/{max_members}/g, contest.config.maxMembers)
      if (keyboardInner.callback_data)
        keyboardInner.callback_data = keyboardInner.callback_data.replace(
          /{id}/g,
          `${contest._id}`
        )

      return keyboardInner
    })
  )

  return publishTemplate
}
