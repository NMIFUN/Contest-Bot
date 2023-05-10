const admin = require('../../helpers/admin.js')
const User = require('../../models/user.js')

module.exports = async (ctx) => {
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery()

    ctx.user.state = 'admin_ban'
    return ctx.editMessageText(
      'Для добавления/удаления в/из бан(а) введите его id.',
      {
        ...admin.backKeyboard,
        parse_mode: 'HTML'
      }
    )
  } else {
    const user = await User.findOne({ id: ctx.message.text })
    if (!user) {
      return ctx.reply(
        `Пользователь с id ${ctx.message.text} не найден.`,
        admin.backKeyboard
      )
    }

    ctx.user.state = null

    user.ban = !user.ban
    await user.save()

    return ctx.replyWithHTML(
      `Пользователь ${user.name} ${user.ban ? 'забанен' : 'разбанен'}.`,
      admin.backKeyboard
    )
  }
}
