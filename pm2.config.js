const path = require('path')
require('dotenv').config({ path: path.resolve('.env') })

module.exports = {
  apps: [
    {
      name: process.env.BOT_USERNAME,
      script: 'index.js',
      watch: true,
      ignore_watch: ['config.json']
    },
    {
      name: process.env.BOT_USERNAME + 'Updater',
      script: 'updater.js',
      watch: true,
      ignore_watch: ['config.json']
    },
    {
      name: process.env.BOT_USERNAME + 'Registration',
      script: 'registrationProcessor.js',
      watch: true,
      ignore_watch: ['config.json']
    }
  ]
}
