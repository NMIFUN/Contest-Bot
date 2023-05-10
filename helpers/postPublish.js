const postMethods = {
  audio: 'sendAudio',
  document: 'sendDocument',
  photo: 'sendPhoto',
  sticker: 'sendSticker',
  text: 'sendMessage',
  video: 'sendVideo',
  animation: 'sendAnimation',
  voice: 'sendVoice'
}

module.exports = (bot, id, post) =>
  bot[postMethods[post.type]](id, post.media || post.text, {
    reply_markup: { inline_keyboard: post.keyboard },
    parse_mode: 'HTML',
    disable_web_page_preview: post.preview,
    caption: post.text
  })
