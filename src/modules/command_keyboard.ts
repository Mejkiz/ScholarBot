import { Menu, MenuRange } from "@grammyjs/menu";
import { MyContext } from "../misc/connections";
import db from "../database/func/funct";
import utils from '../misc/utils'
import { Admin } from "../roles/admin.js"
import editor from "../roles/editor"
import creator from "../roles/creator"
import { bot } from "../misc/connections"
import moment from 'moment';
import 'moment/locale/ru';
moment.locale('ru');

const menu_list = new Menu<MyContext>("menu-list")
    .submenu("Расписание", "get-list-lessons", async ctx => {
        let chatType = ctx.update.callback_query.message?.chat.type
        let userId = ctx.update.callback_query?.from?.id || ctx.chatId

        let userSchool;
        if (chatType == 'private') {
            if (!(await db.checkuser(userId || 0))) return ctx.reply(`У тебя не привязана школа! Что бы привязать напиши в школьную группу с ботом /join`, { reply_parameters: { message_id: ctx.update.callback_query.message?.message_id || 0 } })
            userSchool = (await db.getSchoolBy({ id: (await db.getUserById(userId || 0))?.schoolId }))[0]
        }
        if (['supergroup', 'group'].includes(chatType || '')) userSchool = (await db.getSchoolBy({ groupId: ctx.update.callback_query.message?.chat?.id }))[0]
        if (userSchool?.id == null) return console.error("err get list lessons")
        let schoolLessons = (await db.getLessonsDay({ schoolId: userSchool.id })).filter(e => e.isEmpty == false)
        let studyDays = (await db.getDaysBy({ schoolId: userSchool.id })).filter(e => e.isStudy == true).map(e => e.dayId)
        let itemList = (await db.getItemsBySchool({ schoolId: userSchool.id }))
        let itemMap = new Map()
        for (let i = 0; i < itemList.length; i++) {
            itemMap.set(itemList[i].id, itemList[i].Name)
        }
        let reply = 'Расписание уроков:\n'
        let arrayData = []
        for (let i = 0; i < studyDays.length; i++) {
            let dayItems = schoolLessons.filter(e => e.dayId == studyDays[i]).sort((a, b) => Number(a.num) - Number(b.num));
            arrayData.push(dayItems.map(e => e.itemId))
        }
        for (let i = 0; i < arrayData.length; i++) {
            reply += `${capitalize(moment().weekday(Number(studyDays[i]) - 1).format('dd'))}.\n`
            for (let a = 0; a < arrayData[i].length; a++) {
                reply += `${a + 1}. ${itemMap.get(arrayData[i][a])}\n`
            }
            reply += '\n'
        }
        await ctx.editMessageText(reply)
    })
    .submenu("Д/З", "get-list-hw", async ctx => {
        let chatType = ctx.update.callback_query.message?.chat.type
        let userId = ctx.update.callback_query?.from?.id || ctx.chatId

        let userSchool;
        if (chatType == 'private') {
            if (!(await db.checkuser(userId || 0))) return ctx.reply(`У тебя не привязана школа! Что бы привязать напиши в школьную группу с ботом /join`, { reply_parameters: { message_id: ctx.update.callback_query.message?.message_id || 0 } })
            userSchool = (await db.getSchoolBy({ id: (await db.getUserById(userId || 0))?.schoolId }))[0]
        }
        if (['supergroup', 'group'].includes(chatType || '')) userSchool = (await db.getSchoolBy({ groupId: ctx.update.callback_query.message?.chat?.id }))[0]
        if (userSchool?.id == null) return console.error("err get-list-hw")
        let itemList = (await db.getItemsBySchool({ schoolId: userSchool.id })).sort((a, b) => {
            const nameA = a.Name.toUpperCase();
            const nameB = b.Name.toUpperCase();
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
            return 0;
        });
        let reply = 'Список домашнего задания:\n'
        let x = Date.now()
        for (let i = 0; i < itemList.length; i++) {
            reply += `${itemList[i].Name}: ${(await db.getlastHomework(userSchool.id, Number(itemList[i].id)))?.text || 'Нету'}\n`
        }
        await ctx.editMessageText(reply)
    })
    .submenu("Звонков", "get-list-bell", async ctx => {
        let chatType = ctx.update.callback_query.message?.chat.type
        let userId = ctx.update.callback_query?.from?.id || ctx.chatId

        let userSchool;
        if (chatType == 'private') {
            if (!(await db.checkuser(userId || 0))) return ctx.reply(`У тебя не привязана школа! Что бы привязать напиши в школьную группу с ботом /join`, { reply_parameters: { message_id: ctx.update.callback_query.message?.message_id || 0 } })
            userSchool = (await db.getSchoolBy({ id: (await db.getUserById(userId || 0))?.schoolId }))[0]
        }
        if (['supergroup', 'group'].includes(chatType || '')) userSchool = (await db.getSchoolBy({ groupId: ctx.update.callback_query.message?.chat?.id }))[0]
        if (userSchool?.id == null) return console.error("err get-list-hw")
        let reply = 'Расписание звонков:\n'
        let bellList = (await db.getBellsDay({ schoolId: userSchool.id })).filter(e => e.isEmpty == false)
        for (let i = 0; i < bellList.length; i++) {
            reply += `${i+1}. ${bellList[i].interval}\n`
        }
        await ctx.editMessageText(reply)
    })
bot.use(menu_list)

const get_list_lessons = new Menu<MyContext>("get-list-lessons")
    .back('Назад', async ctx => {
        await ctx.editMessageText('Выберите список')
    })
menu_list.register(get_list_lessons)

const get_list_hw = new Menu<MyContext>("get-list-hw")
    .back('Назад', async ctx => {
        await ctx.editMessageText('Выберите список')
    })
menu_list.register(get_list_hw)

const get_list_bell = new Menu<MyContext>("get-list-bell")
    .back('Назад', async ctx => {
        await ctx.editMessageText('Выберите список')
    })
menu_list.register(get_list_bell)

export default {
    menu_list
}

const capitalize = (s: string) => s && String(s[0]).toUpperCase() + String(s).slice(1)