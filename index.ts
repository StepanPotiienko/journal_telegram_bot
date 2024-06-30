const TelegramBot = require('node-telegram-bot-api')
const { MongoClient, ServerApiVersion } = require('mongodb')

import axios from 'axios'

console.log(axios)

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

if (process.env.OPENAI_API_KEY == undefined) {
    console.log('Cannot retrieve OPENAI_API_KEY.')
    process.exit()
}

async function checkTextValidity(text: string): Promise<boolean> {
    const prompt = `Check if the following text is real and makes sense: ${text}`;

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/completions',
            {
                model: 'gpt-3.5-turbo-instruct',
                prompt: prompt,
                max_tokens: 50,
                temperature: 0.7
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                }
            }
        );

        const completion = response.data.choices[0].text.trim();
        console.log(completion);

        // Simple logic to determine if the response indicates the text is real and makes sense
        return completion.toLowerCase().includes('yes');
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            console.error('Error checking text validity:', error.response.data);
        } else {
            console.error('Error checking text validity:', error.message);
        }
        return false;
    }
}

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
    try {
        db.collection('entries').insertOne(saveData)
    }
    catch (err) {
        bot.sendMessage(usr_msg.chat.id, err)
    }
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

        try {
            const isValid: boolean = await checkTextValidity(text)
            console.log(isValid)

            if (text != null && text != "" && text.length > 15 && isValid) {
                await saveJournalEntry(text)
                await bot.sendMessage(usr_msg.chat.id, "Успішно збережено у базі даних.")
            } else if (!isValid) {
                await bot.sendMessage(usr_msg.chat.id, "Це не справжній текст! Спробуй знову.")
                await journal(msg)
            }
            else {
                await bot.sendMessage(usr_msg.chat.id, "Гей, розкажи більше! Мені цікаво, що відбулось у тебе за день.")
                await journal(msg)
            }
        }

        catch (err) {
            console.log(err)
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
