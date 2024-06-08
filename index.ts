const TelegramBot = require('node-telegram-bot-api')


require('dotenv').config()


const bot = new TelegramBot(process.env.BOT_TOKEN, {
    polling: true
})


const admin = require('firebase-admin')


admin.initializeApp({ credential: admin.credential.cert(process.env.CREDENTIALS_PATH) })


const db = admin.db


let usr_msg: any = null


async function saveJournalEntry(text: string) {
    const dateObj = new Date()
    const day = dateObj.getDate()
    const month = dateObj.getMonth() + 1
    const year = dateObj.getFullYear()

    let saveData: string = `${day}-${month}-${year}: ${text}`
    return saveData
}


async function journal(msg) {
    if (usr_msg == null) {
        usr_msg = msg
    }

    const namePrompt = await bot.sendMessage(usr_msg.chat.id, "Напиши у повідомленні нижче все, що відбулось за день: позитивні/негативні емоції, за що ти вдячний, кому ти вдячний і так далі. Наприклад, \"Сьогодні мама приготувала дуже смачні млинці. Я вдячній їй за це.\"", {
        reply_markup: {
            force_reply: true,
        },
    })

    bot.onReplyToMessage(usr_msg.chat.id, namePrompt.message_id, async (nameMsg) => {
        const text = nameMsg.text

        if (text != null && text.length > 15) {
            await bot.sendMessage(usr_msg.chat.id, await saveJournalEntry(nameMsg.text))
        } else {
            await bot.sendMessage(usr_msg.chat.id, "Гей, розкажи більше! Мені цікаво, що відбулось у тебе за день.")
            await journal(msg)
        }
    })
}


bot.onText(/\/journal/, async msg => {
    journal(msg)
})


bot.on('text', async msg => {
    console.log(msg)
})
