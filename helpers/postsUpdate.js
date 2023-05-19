const postCreate = require('./postCreate')

const Contest = require('../models/contest')
const Participant = require('../models/participant')

const errorHandler = (err, post, contest) => {
  console.error(`UPDATE POST ${contest._id}`, post, err)

  if (
    ['Bad Request: message not found', ' Bad Request: chat not found'].includes(
      err.description
    )
  )
    return Contest.updateOne(
      { _id: contest._id },
      {
        $pull: {
          posts: post
        }
      }
    )
  else return err
}

module.exports = async (contest, bot, force = false) => {
  const preparedPost = await postCreate(
    contest,
    contest.config.status,
    contest.language,
    bot.username
  )
  const membersCount = await Participant.countDocuments({
    contest: contest._id,
    status: { $nin: ['banned', 'unsubscribed'] }
  })

  await Promise.all(
    contest.posts.map((post) => {
      if ((!preparedPost.variables || post.type === 'indefinitely') && !force)
        return bot.telegram
          .editMessageReplyMarkup(
            post.chatId,
            post.messageId,
            post.inlineMessageId,
            { inline_keyboard: preparedPost.keyboard }
          )
          .catch((err) => errorHandler(err, post, contest))

      if (post.type === 'text')
        return bot.telegram
          .editMessageText(
            post.chatId,
            post.messageId,
            post.inlineMessageId,
            preparedPost.text,
            {
              parse_mode: 'HTML',
              disable_web_page_preview: preparedPost.preview,
              reply_markup: { inline_keyboard: preparedPost.keyboard }
            }
          )
          .catch((err) => errorHandler(err, post, contest))
      else if (
        (post.type !== 'text' && preparedPost.type === 'text') ||
        (preparedPost.type !== 'text' && post.type === 'text')
      )
        return bot.telegram
          .editMessageCaption(
            post.chatId,
            post.messageId,
            post.inlineMessageId,
            preparedPost.text,
            {
              parse_mode: 'HTML',
              reply_markup: { inline_keyboard: preparedPost.keyboard }
            }
          )
          .catch((err) => errorHandler(err, post, contest))
      else
        return bot.telegram
          .editMessageMedia(
            post.chatId,
            post.messageId,
            post.inlineMessageId,
            {
              type: preparedPost.type,
              media: preparedPost.media,
              caption: preparedPost.text,
              parse_mode: 'HTML'
            },
            {
              reply_markup: { inline_keyboard: preparedPost.keyboard }
            }
          )
          .catch((err) => errorHandler(err, post, contest))
    })
  )

  return Contest.updateOne(
    { _id: contest._id },
    {
      lastPostsUpdate: {
        status: contest.config.status,
        membersCount
      }
    }
  )
}
