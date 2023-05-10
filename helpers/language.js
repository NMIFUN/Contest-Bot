const yaml = require('js-yaml')
const fs = require('fs')
const Markup = require('telegraf/markup')
const path = require('path')

const locales = fs.readdirSync(path.resolve('locales'))

const keyboard = locales.map((locale) => {
  const localeCode = locale.split('.')[0]
  const localeName = yaml.load(
    fs.readFileSync(path.resolve(`locales/${locale}`), 'utf8')
  ).name

  return Markup.callbackButton(localeName, `translateBot_${localeCode}`)
})
const languageKeyboard = Markup.inlineKeyboard(keyboard, { columns: 2 })

module.exports = languageKeyboard
