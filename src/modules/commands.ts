import { Menu, MenuRange } from "@grammyjs/menu";
import { config } from "../config";
import { MyContext } from "../misc/connections";
import db from "../database/func/funct";
import utils from '../misc/utils'
import { Admin } from "../roles/admin.js"
import editor from "../roles/editor"
import creator from "../roles/creator"
import { bot } from "../misc/connections"
import moment from 'moment';
import cmdKB from "./command_keyboard"
import 'moment/locale/ru';
moment.locale('ru');
// // for test
// import { appDataSource } from "../database/db";
// import { Item } from "../database/entities/item";

let admin = new Admin()

bot.command("start", async (ctx) => {
  if (["group", "supergroup"].includes(ctx.update.message?.chat.type || '')) return await ctx.reply("TODO!")
  let user = await db.getUserById(((await ctx.getAuthor()).user.id))
  //if (ctx.config.isDeveloper) return await admin.start(ctx)
  if (user?.role == "editor") return await editor.start(ctx)
  if (user?.role == "creator") return await creator.start(ctx)
  await ctx.reply("У тебя нет доступа к этому боту!");
});


// bot.command("give", async (ctx) => {
//   if (!ctx.config.isDeveloper) return
//   console.log(await db.createuser((await ctx.getAuthor()).user, "creator", 1))
// });

bot.command("admin_cmd", async (ctx) => {
  if (!ctx.config.isDeveloper) return
  if (["group", "supergroup"].includes(ctx.update.message?.chat.type || '')) await db.createSchool(ctx.update.message?.chat.title, ctx.update.message?.chat?.username, ctx.update.message?.chat?.id)
});

bot.command(["hw", "dz", "дз", "homework"], async (ctx) => {
  let userId;
  let isGroup = ["group", "supergroup"].includes(ctx.update.message?.chat.type || '')
  if (isGroup) userId = ctx.update.message?.from?.id
  else userId = ctx.chatId
  if (!(await db.checkuser(userId || 0))) return ctx.reply(`У тебя не привязана школа! Что бы привязать напиши в школьную группу с ботом /join`, { reply_parameters: { message_id: ctx.msg.message_id } })
  let userSchoolId = (await db.getUserById(userId || 0))?.schoolId || null
  if (userSchoolId == null) return ctx.reply("У тебя нет доступа к этому боту!");
  let day = moment().tz(config.timezone).day() + 1
  const allDays = (await db.getDaysBy({ schoolId: userSchoolId })).filter(e => e.isStudy == true).map(e => Number(e.dayId))
  let hwDay;
  if (!allDays.includes(day) || hwDay == Math.max.apply(null, allDays)) {
    hwDay = allDays[0]
  } else {
    hwDay = day
  }
  let lessonList = (await db.getLessonsDay({ schoolId: userSchoolId, dayId: hwDay })).filter(e => e.isEmpty == false).filter(e => allDays.includes(Number(e.dayId)) == true).sort((a, b) => Number(a.num) - Number(b.num)).map(e => e.itemId)
  let reply = `Д/З на ${moment().weekday(hwDay - 1).format('dd')}:\n\n`
  for (const id of lessonList) {
    let lesson = await db.getItemById(userSchoolId, Number(id));
    reply += `${lesson?.Name}: ${(await db.getlastHomework(userSchoolId, Number(lesson?.id)))?.text || 'Нету'}\n`
  }
  await ctx.reply(reply)
});

bot.command(["list"], async (ctx) => {
  let userId;
  let isGroup = ["group", "supergroup"].includes(ctx.update.message?.chat.type || '')
  if (isGroup) userId = ctx.update.message?.from?.id
  else userId = ctx.chatId
  if (!(await db.checkuser(userId || 0))) return ctx.reply(`У тебя не привязана школа! Что бы привязать напиши в школьную группу с ботом /join`, { reply_parameters: { message_id: ctx.msg.message_id } })
  let userSchoolId = (await db.getUserById(userId || 0))?.schoolId || null
  if (userSchoolId == null) return ctx.reply("У тебя нет доступа к этому боту!");
  await ctx.reply("Выберите список:", { reply_markup: cmdKB.menu_list })
})

bot.command(["join"], async (ctx) => {
  let userId;
  if (["group", "supergroup"].includes(ctx.update.message?.chat.type || '')) userId = ctx.update.message?.from?.id
  else userId = ctx.chatId
  if (!["group", "supergroup"].includes(ctx.update.message?.chat.type || '')) return await ctx.reply("Это личные сообщения, а не школьная группа!")
  let hasSchool = await db.hasUserSchool(userId || 0)
  if (hasSchool) return await ctx.reply(`У тебя уже привязяна школа, обратись к администратору бота если хочешь её поменять!`, { reply_parameters: { message_id: ctx.msg.message_id } })
  let schoolId = (await db.getSchoolBy({ groupId: ctx.chatId }))[0].id || 0
  if (schoolId == 0) return await ctx.reply(`К этой группе не привязана школа!`, { reply_parameters: { message_id: ctx.msg.message_id } })
  if (await db.checkuser(userId || 0)) {
    await db.edituser(userId || 0, { schoolId: schoolId })
  } else if (ctx.update.message?.from) {
    await db.createuser(ctx.update.message?.from, 'user', schoolId)
  }
  else return ctx.reply('err')
  await ctx.reply(`Успешно, теперь тебе доступны команды бота!`, { reply_parameters: { message_id: ctx.msg.message_id } })
})

// bot.command("test", async (ctx) => {
//   let ret = (await appDataSource.getRepository(Item).find({order: { id: -1 }, take: 1}))[0].id 
//   console.log(ret)
// });

bot.command('clearfnewghor2efihrefr', async (ctx) => {
  if (!ctx.config.isDeveloper) return
   await ctx.reply('Клавиатура очищена!', {
    reply_markup: {
      remove_keyboard: true,  // Удаляем клавиатуру
    },
  });
});

bot.command('clearfnewghor2efihrefr', async (ctx) => {
  if (!ctx.config.isDeveloper) return
  await ctx.reply(`${await eval(ctx.message.split(' ').slice(1).join(' '))}`)
});
