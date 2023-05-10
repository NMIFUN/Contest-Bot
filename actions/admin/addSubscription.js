const config = require('../../config.json')
const admin = require('../../helpers/admin.js')
const fs = require('fs').promises

module.exports = async (ctx) => {
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery()

    ctx.user.state = 'admin_addSubscription'

    return ctx.editMessageText(
      `Для добавления канала/чата на обязательную подписку введите id/@username и ссылку (и код языка если нужно) через пробел\nПример: 
<code>-1001488198124 https://t.me/+WLQZ7FtUjj65e93L</code>
<code>-1001488198124 https://t.me/+WLQZ7FtUjj65e93L ru</code>

Для удаления канала/чата из обязательной подписки введите его id\n
Текущий список каналов/чатов на обязательную подписку: ${config.subsChannels
        .map(
          (e) =>
            `<a href='${e.link}'>${e.title}</a> ${e.lang} (<code>${e.id}</code>)`
        )
        .join(', ')}`,
      {
        ...admin.backKeyboard,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      }
    )
  } else {
    const list = ctx.message.text.split(' ')

    let find = config.subsChannels.findIndex((o) => o.id === Number(list[0]))
    if (find !== -1) config.subsChannels.splice(find, 1)
    else {
      if (!list[1]) {
        return ctx.replyWithHTML(
          'Не указана ссылка на канал/чат.',
          admin.backKeyboard
        )
      }

      try {
        // eslint-disable-next-line no-var
        var getChat = await ctx.telegram.getChat(list[0])
      } catch (e) {
        return ctx.replyWithHTML('Неверный канал/чат или не добавлен бот')
      }

      find = config.subsChannels.findIndex((o) => o.id === getChat.id)
      if (find === -1) {
        config.subsChannels.push({
          link: list[1],
          title: getChat.title,
          id: getChat.id,
          lang: list[2] || 'all'
        })
      } else config.subsChannels.splice(find, 1)
    }

    await fs.writeFile('config.json', JSON.stringify(config, null, '  '))

    return ctx.replyWithHTML(
      `Список каналов/чатов на обязательную подписку обновлен.\n
Текущий список: ${config.subsChannels
        .map(
          (e) =>
            `<a href='${e.link}'>${e.title}</a> ${e.lang} (<code>${e.id}</code>)`
        )
        .join(', ')}`,
      {
        ...admin.backKeyboard,
        disable_web_page_preview: true
      }
    )
  }
}
