import { Menu, MenuRange } from "@grammyjs/menu";
import { MyContext } from "../misc/connections";
import db from "../database/func/funct";
import { Admin } from "../roles/admin.js"
import editor from "../roles/editor"
import creator from "../roles/creator"
import { bot } from "../misc/connections"

let admin = new Admin()

bot.command("start", async (ctx) => {
  if (["group", "supergroup"].includes(ctx.update.message?.chat.type || '')) return await ctx.reply("Это группа!")
  let user = await db.getUserById(((await ctx.getAuthor()).user.id))
  if (ctx.config.isDeveloper) return await admin.start(ctx)
  if (user?.role == "editor") return await editor.start(ctx)
  if (user?.role == "creator") return await creator.start(ctx)
  await ctx.reply("У тебя нет доступа к этому боту!");
});

bot.command("test", async (ctx) => {
  console.log(await ctx.getAuthor())
  console.log(await db.getUserById(((await ctx.getAuthor()).user.id)))
});

bot.command("test2", async (ctx) => {
  if (["group", "supergroup"].includes(ctx.update.message?.chat.type || '')) await db.createSchool(ctx.update.message?.chat.title, ctx.update.message?.chat?.username, ctx.update.message?.chat?.id)
  else return ctx.reply("Это не является группой!")
});

bot.command("sosal", async (ctx) => {
  console.log(await db.createuser((await ctx.getAuthor()).user, "editor", 1))
})