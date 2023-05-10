const config = require('../../config.json')
const admin = require('../../helpers/admin.js')
const fs = require('fs').promises

module.exports = async (ctx) => {
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery()

    ctx.user.state = 'admin_addJoin'

    return ctx.editMessageText(
      `Для добавления канала/чата на принятие заявок введите id/@username\nПример: 
<code>-1001488198124</code>

Для удаления канала/чата из принятия заявок введите его id\n
Текущий список каналов/чатов на принятие заявок: ${
        config.joinChannels
          ?.map((e) => `${e.title} (<code>${e.id}</code>)`)
          .join(', ') || ''
      }`,
      {
        ...admin.backKeyboard,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      }
    )
  } else {
    const list = ctx.message.text.split(' ')

    if (!config.joinChannels?.length) config.joinChannels = []

    let find = config.joinChannels.findIndex((o) => o.id === Number(list[0]))
    if (find !== -1) config.joinChannels.splice(find, 1)
    else {
      try {
        // eslint-disable-next-line no-var
        var getChat = await ctx.telegram.getChat(list[0])
      } catch (e) {
        return ctx.replyWithHTML('Неверный канал/чат или не добавлен бот')
      }

      find = config.joinChannels.findIndex((o) => o.id === getChat.id)
      if (find === -1) {
        config.joinChannels.push({
          title: getChat.title,
          id: getChat.id
        })
      } else config.joinChannels.splice(find, 1)
    }
    await fs.writeFile('config.json', JSON.stringify(config, null, '  '))

    return ctx.replyWithHTML(
      `Список каналов/чатов на принятие заявок обновлен.\n
Текущий список каналов/чатов на принятие заявок: ${config.joinChannels
        .map((e) => `${e.title} (<code>${e.id}</code>)`)
        .join(', ')}`,
      {
        ...admin.backKeyboard,
        disable_web_page_preview: true
      }
    )
  }
}
