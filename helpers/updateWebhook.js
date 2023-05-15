module.exports = async (token, bot) => {
  bot.token = token

  await bot.telegram.setWebhook(
    `https://${process.env.WEBHOOK_DOMAIN}/contest`,
    {
      max_connections: 100,
      allowed_updates: [
        'message',
        'channel_post',
        'inline_query',
        'chosen_inline_result',
        'callback_query',
        'my_chat_member',
        'chat_member'
      ],
      secret_token: token.replace(':', '-----')
    }
  )
}
