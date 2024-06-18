const TelegramBot = require('node-telegram-bot-api')
const { MongoClient, ServerApiVersion } = require('mongodb')


require('dotenv').config()


const bot = new TelegramBot(process.env.BOT_TOKEN, {
    polling: true
})


const client = new MongoClient(process.env.DB_URI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true
    }
})


const commands: Object[] = [
    {
        command: "journal",
        description: "Внести запис у щоденник."
    }
]


bot.setMyCommands(commands)


const db = client.db('journal_bot')

let usr_msg: any = null


async function connectToDB() {
    try {
        await client.connect()

        await client.db("admin").command({ ping: 1 })
        console.log("You have connected to db.")
    } catch {
        await client.close(console.dir)
    }
}

async function saveJournalEntry(text: string) {
    const dateObj = new Date()
    const day: number = dateObj.getDate()
    const month: number = dateObj.getMonth() + 1
    const year: number = dateObj.getFullYear()

    let saveData = {
        day: day,
        month: month,
        year: year,
        id: usr_msg.chat.id,
        entry: text
    }

    db.collection('entries').insertOne(saveData)
}


async function journal(msg) {
    if (usr_msg == null) {
        usr_msg = msg
    }

    const namePrompt = await bot.sendMessage(usr_msg.chat.id, "Напиши у повідомленні нижче все, що відбулось за день: позитивні/негативні емоції, за що ти вдячний, кому ти вдячний і так далі. Наприклад, \"Сьогодні мама приготувала дуже смачні млинці. Я вдячний їй за це.\"", {
        reply_markup: {
            force_reply: true,
        },
    })

    bot.onReplyToMessage(usr_msg.chat.id, namePrompt.message_id, async (nameMsg) => {
        const text = nameMsg.text

        if (text != null && text.length > 15) {
            await saveJournalEntry(text)
            await bot.sendMessage(usr_msg.chat.id, "Успішно збережено у базі даних.")
        } else {
            await bot.sendMessage(usr_msg.chat.id, "Гей, розкажи більше! Мені цікаво, що відбулось у тебе за день.")
            await journal(msg)
        }
    })
}


// ! TODO: Fix. The command does not show all entries properly.
bot.onText(/\/see/, () => {
    let cursor = db.collection('entries').find()

    cursor.each(async function (err, item) {
        if (item.id == usr_msg.chat.id) {
            await bot.sendMessage(usr_msg.chat.id, item)
        }
    })
})


bot.onText(/\/journal/, async msg => {
    connectToDB().catch(console.dir)
    journal(msg)
})


bot.onText(/\/help/, async msg => {
    for (let index = 0; index < commands.length; index++) {
        const element = commands[index];

        await bot.sendMessage(msg.chat.id, element)
    }
})


bot.on('text', async msg => {
    console.log(msg)
})
