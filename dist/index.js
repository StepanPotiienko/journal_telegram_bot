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
require('dotenv').config();
const bot = new TelegramBot(process.env.BOT_TOKEN, {
    polling: true
});
const admin = require('firebase-admin');
admin.initializeApp({ credential: admin.credential.cert(process.env.CREDENTIALS_PATH) });
const db = admin.db;
let usr_msg = null;
function saveJournalEntry(text) {
    return __awaiter(this, void 0, void 0, function* () {
        const dateObj = new Date();
        const day = dateObj.getDate();
        const month = dateObj.getMonth() + 1;
        const year = dateObj.getFullYear();
        let saveData = `${day}-${month}-${year}: ${text}`;
        return saveData;
    });
}
function journal(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        if (usr_msg == null) {
            usr_msg = msg;
        }
        const namePrompt = yield bot.sendMessage(usr_msg.chat.id, "Напиши у повідомленні нижче все, що відбулось за день: позитивні/негативні емоції, за що ти вдячний, кому ти вдячний і так далі. Наприклад, \"Сьогодні мама приготувала дуже смачні млинці. Я вдячній їй за це.\"", {
            reply_markup: {
                force_reply: true,
            },
        });
        bot.onReplyToMessage(usr_msg.chat.id, namePrompt.message_id, (nameMsg) => __awaiter(this, void 0, void 0, function* () {
            const text = nameMsg.text;
            if (text != null && text.length > 15) {
                yield bot.sendMessage(usr_msg.chat.id, yield saveJournalEntry(nameMsg.text));
            }
            else {
                yield bot.sendMessage(usr_msg.chat.id, "Гей, розкажи більше! Мені цікаво, що відбулось у тебе за день.");
                yield journal(msg);
            }
        }));
    });
}
bot.onText(/\/journal/, (msg) => __awaiter(this, void 0, void 0, function* () {
    journal(msg);
}));
bot.on('text', (msg) => __awaiter(this, void 0, void 0, function* () {
    console.log(msg);
}));
//# sourceMappingURL=index.js.map