import { bot } from "./misc/connections"
import "./modules/commands"
import "./modules/inputText"

bot.start();
bot.catch(error => console.log(error));
