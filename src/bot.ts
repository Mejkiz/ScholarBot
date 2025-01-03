import { Bot, Context } from "grammy";
import { Menu } from "@grammyjs/menu";
import { config } from "./config";
import { DBFunc } from "./database/func/funct";
import { Admin } from "./modules/admin.js"
import { bot } from "./misc/connections"
const menu = new Menu("my-menu-identifier")
  .text("A", (ctx) => ctx.reply("Вы нажали A!")).row()
  .text("B", (ctx) => ctx.reply("Вы нажали B!"));

bot.use(menu)
let admin = new Admin()
let db = new DBFunc()

bot.command("start", async (ctx) => {
  if (ctx.config.isDeveloper) return await admin.start(ctx)
  let test = await db.getbyid(123)
  console.log(test)
  await ctx.reply("Меню:", { reply_markup: menu });
});

bot.command("test", async (ctx) => {
  console.log(await ctx.getAuthor())
  let test = await db.createuser(await ctx.getAuthor(), "admin")
});
bot.command("test2", async (ctx) => {
  let test = await db.checkuser((await ctx.getAuthor()))
  console.log(test)
});

bot.on("message", (ctx) => ctx.reply("Получил другое сообщение!"));
bot.start();
bot.catch(error => console.log(error));
