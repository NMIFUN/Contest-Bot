const config = require('../../config.json')
const admin = require('../../helpers/admin.js')
const fs = require('fs').promises

module.exports = async (ctx) => {
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery()

    ctx.user.state = 'admin_addAdmin'

    return ctx.editMessageText(
      `Для добавления/удаления администратора введите его id.
\nТекущий список администраторов: ${config.admins.join(', ')}`,
      {
        ...admin.backKeyboard,
        parse_mode: 'HTML'
      }
    )
  } else {
    const list = ctx.message.text.split(' ')
    for (let i of list) {
      i = Number(i.trim())

      const find = config.admins.indexOf(i)

      if (find === -1) config.admins.push(i)
      else config.admins.splice(find, 1)
    }
    await fs.writeFile('config.json', JSON.stringify(config, null, '  '))

    return ctx.replyWithHTML(
      `Список администраторов обновлен\n\nТекущий список: ${config.admins.join(
        ', '
      )}`,
      admin.backKeyboard
    )
  }
}
