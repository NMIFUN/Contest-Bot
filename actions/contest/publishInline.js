const Contest = require('../../models/contest')
const postCreate = require('../../helpers/postCreate')

const typeName = {
  audio: 'audio_file_id',
  document: 'document_file_id',
  photo: 'photo_file_id',
  sticker: 'sticker_file_id',
  video: 'video_file_id',
  video_note: 'video_file_id',
  animation: 'gif_file_id',
  voice: 'voice_file_id',
  text: undefined
}

module.exports = async (ctx) => {
  if (!ctx.inlineQuery.query)
    return ctx.answerInlineQuery([
      {
        type: 'article',
        id: 'unnecessary',
        title: ctx.i18n.t('inline.enter'),
        input_message_content: {
          message_text: ctx.i18n.t('inline.notEntered')
        }
      }
    ])

  const contest = await Contest.findOne({
    key: ctx.inlineQuery.query,
    bot: ctx.botInfo.id
  })
  if (!contest)
    return ctx.answerInlineQuery([
      {
        type: 'article',
        id: 'notFound',
        title: ctx.i18n.t('inline.enterValid'),
        input_message_content: {
          message_text: ctx.i18n.t('inline.notFound')
        }
      }
    ])

  const post = await postCreate(
    contest,
    contest.config.status,
    ctx.i18n.locale(),
    ctx.botInfo.username
  )

  return ctx.answerInlineQuery(
    [
      {
        id: post.type,
        type:
          (post.type === 'text' && 'article') ||
          (post.type === 'animation' && 'gif') ||
          post.type,
        title: contest.name || `Contest`,
        [typeName[post.type]]: post.media,
        caption: post.text,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: post.keyboard },
        input_message_content:
          post.type === 'text'
            ? {
                message_text: post.text,
                parse_mode: 'HTML',
                disable_web_page_preview: post.preview
              }
            : {
                parse_mode: 'HTML'
              }
      }
    ],
    {
      cache_time: 15
    }
  )
}
