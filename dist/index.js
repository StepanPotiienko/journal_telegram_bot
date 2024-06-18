var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const TelegramBot = require('node-telegram-bot-api');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const bot = new TelegramBot(process.env.BOT_TOKEN, {
    polling: true
});
const client = new MongoClient(process.env.DB_URI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true
    }
});
const commands = [
    {
        command: "journal",
        description: "Внести запис у щоденник."
    }
];
bot.setMyCommands(commands);
const db = client.db('journal_bot');
let usr_msg = null;
function connectToDB() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield client.connect();
            yield client.db("admin").command({ ping: 1 });
            console.log("You have connected to db.");
        }
        catch (_a) {
            yield client.close(console.dir);
        }
    });
}
function saveJournalEntry(text) {
    return __awaiter(this, void 0, void 0, function* () {
        const dateObj = new Date();
        const day = dateObj.getDate();
        const month = dateObj.getMonth() + 1;
        const year = dateObj.getFullYear();
        let saveData = {
            day: day,
            month: month,
            year: year,
            id: usr_msg.chat.id,
            entry: text
        };
        db.collection('entries').insertOne(saveData);
    });
}
function journal(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        if (usr_msg == null) {
            usr_msg = msg;
        }
        const namePrompt = yield bot.sendMessage(usr_msg.chat.id, "Напиши у повідомленні нижче все, що відбулось за день: позитивні/негативні емоції, за що ти вдячний, кому ти вдячний і так далі. Наприклад, \"Сьогодні мама приготувала дуже смачні млинці. Я вдячний їй за це.\"", {
            reply_markup: {
                force_reply: true,
            },
        });
        bot.onReplyToMessage(usr_msg.chat.id, namePrompt.message_id, (nameMsg) => __awaiter(this, void 0, void 0, function* () {
            const text = nameMsg.text;
            if (text != null && text.length > 15) {
                yield saveJournalEntry(text);
                yield bot.sendMessage(usr_msg.chat.id, "Успішно збережено у базі даних.");
            }
            else {
                yield bot.sendMessage(usr_msg.chat.id, "Гей, розкажи більше! Мені цікаво, що відбулось у тебе за день.");
                yield journal(msg);
            }
        }));
    });
}
bot.onText(/\/see/, () => {
    let cursor = db.collection('entries').find();
    cursor.each(function (err, item) {
        return __awaiter(this, void 0, void 0, function* () {
            if (item.id == usr_msg.chat.id) {
                yield bot.sendMessage(usr_msg.chat.id, item);
            }
        });
    });
});
bot.onText(/\/journal/, (msg) => __awaiter(this, void 0, void 0, function* () {
    connectToDB().catch(console.dir);
    journal(msg);
}));
bot.onText(/\/help/, (msg) => __awaiter(this, void 0, void 0, function* () {
    for (let index = 0; index < commands.length; index++) {
        const element = commands[index];
        yield bot.sendMessage(msg.chat.id, element);
    }
}));
bot.on('text', (msg) => __awaiter(this, void 0, void 0, function* () {
    console.log(msg);
}));
//# sourceMappingURL=index.js.map