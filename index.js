import { initializeApp } from 'firebase/app'
import { getAnalytics, initializeAnalytics } from 'firebase/analytics'
import { createRequire } from "module"


const require = createRequire(import.meta.url)
const TelegramBot = require('node-telegram-bot-api')


require('dotenv').config()


const bot = new TelegramBot(process.env.BOT_TOKEN, {
    polling: true
})


const admin = require('firebase-admin')
const serviceAccount = require(process.env.CREDENTIALS_PATH)
const app = initializeApp(firebaseConfig)


admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })


const db = admin.db


bot.onText(/\/journal/, async msg => {
    const namePrompt = await bot.sendMessage(msg.chat.id, "Hi, what's your name?", {
        reply_markup: {
            force_reply: true,
        },
    });
    bot.onReplyToMessage(msg.chat.id, namePrompt.message_id, async (nameMsg) => {
        const name = nameMsg.text;

        if (name != null && name.length > 3) {
            await bot.sendMessage(msg.chat.id, `Hello ${name}!`)
        }
    });
})


bot.on('text', async msg => {
    console.log(msg)
})

