import { bot } from "./misc/connections"
import "./modules/commands"
import "./modules/inputText"



//bot.on("message", (ctx) => ctx.reply("Получил другое сообщение!"));
bot.start();
bot.catch(error => console.log(error));
