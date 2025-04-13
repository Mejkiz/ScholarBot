import { bot } from "./misc/connections"
import "./modules/commands"
import "./modules/inputText"

bot.start();
bot.catch(error => console.log(error));

process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION:', reason);
  });
  