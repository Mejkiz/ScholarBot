import { Menu, MenuRange } from "@grammyjs/menu";
import { bot } from "../misc/connections";
import { config } from "../config";
import { MyContext } from "../misc/connections";
import db from "../database/func/funct";
import moment from 'moment';
import 'moment/locale/ru';
moment.locale('ru');

const ROLE = "editor"

const menu = new Menu<MyContext>(`${ROLE}-menu`)
    .submenu("Управление Д/З", `${ROLE}-edit-hw`, async ctx => {
        if (!(await hasAccess(ctx))) return ctx.deleteMessage()
        await ctx.editMessageText('Выберите предмет на который хотите записать д/з')
    })
    .row()
    .submenu("Д/З на завтра", `${ROLE}-get-hw`, async ctx => {
        if (!(await hasAccess(ctx))) return ctx.deleteMessage()
        let day = new Date().getDay() + 1
        let userSchoolId = (await db.getUserById(ctx.chatId || 0))?.schoolId || 0
        const allDays = (await db.getDaysBy({ schoolId: userSchoolId })).filter(e => e.isStudy == true).map(e => Number(e.dayId))
        let hwDay;
        if (!allDays.includes(day) || hwDay == Math.max.apply(null, allDays)) {
            hwDay = 1
        } else {
            hwDay = day
        }
        let lessonList = (await db.getLessonsDay({ schoolId: userSchoolId, dayId: hwDay })).filter(e => e.isEmpty == false).filter(e => allDays.includes(Number(e.dayId)) == true).sort((a, b) => Number(a.num) - Number(b.num)).map(e => e.itemId)
        let reply = `Д/З на ${moment().weekday(hwDay - 1).format('dd')}:\n\n`
        for (const id of lessonList) {
            let lesson = await db.getItemById(userSchoolId, Number(id));
            reply += `${lesson?.Name}: ${(await db.getlastHomework(userSchoolId, Number(lesson?.id)))?.text || 'Нету'}\n`
        }
        await ctx.editMessageText(reply)
    })
    .submenu("Списки", `${ROLE}-lists`, async ctx => {
        if (!(await hasAccess(ctx))) return ctx.deleteMessage()
        await ctx.editMessageText('Списки:')
    })
    .row()
    .submenu("Аккаунт", `${ROLE}-account`, async ctx => {
        if (!(await hasAccess(ctx))) return ctx.deleteMessage()
        let user = await db.getUserById(ctx.chatId || 0)
        if (user == null) return await ctx.editMessageText("Ошибка")
        await ctx.editMessageText(`Ваш аккаунт:\n• Id: ${user.id}\n• Роль: ${user.role || 'none'}\n• Id-Школы: ${user.schoolId || 'none'}`)
    })
bot.use(menu)


const editor_edit_hw = new Menu<MyContext>(`${ROLE}-edit-hw`)
    .dynamic(async (ctx: MyContext) => {
        const range = new MenuRange<MyContext>();
        let userSchoolId = (await db.getUserById(ctx.chatId || 0))?.schoolId || 0
        let day = new Date().getDay()
        const allDays = (await db.getDaysBy({ schoolId: userSchoolId })).filter(e => e.isStudy == true).map(e => e.dayId)
        let lessonList;
        if (!allDays.includes(day)) {
            lessonList = (await db.getItemsBySchool({ schoolId: userSchoolId })).map(e => e.id)
        } else {
            lessonList = (await db.getLessonsDay({ schoolId: userSchoolId, dayId: day })).filter(e => e.isEmpty == false).filter(e => allDays.includes(e.dayId) == true).sort((a, b) => Number(a.num) - Number(b.num)).map(e => e.itemId)
        }
        for (const id of lessonList) {
            let lesson = await db.getItemById(userSchoolId, Number(id));

            range.text((lesson?.Name || "error").toString(), async (ctx) => {
                ctx.session.step = "editor-write-hw";
                ctx.session.data.editlessonId = lesson?.id
                let msg = await ctx.editMessageText(`${lesson?.Name}\nТекущее: ${(await db.getlastHomework(userSchoolId, Number(lesson?.id)))?.text || 'Нету'}\nНапишите новое д/з`, { reply_markup: editor_back_to_edit_hw })
                if (msg !== true) ctx.session.data.editMsgId = msg.message_id || null
            }).row()
        }
        range.text('Другие', async (ctx) => {
            ctx.editMessageText(`Выберите предмет на который хотите записать д/з`, { reply_markup: editor_edit_list_lesson })
        })
        return range
    })
    .back('Назад', async ctx => {
        await ctx.editMessageText('Меню:')
    })
menu.register(editor_edit_hw)

const editor_edit_list_lesson = new Menu<MyContext>(`${ROLE}-edit-list-lesson`)
    .dynamic(async (ctx: MyContext) => {
        const range = new MenuRange<MyContext>();
        let userSchoolId = (await db.getUserById(ctx.chatId || 0))?.schoolId || 0
        let lessonList = (await db.getItemsBySchool({ schoolId: userSchoolId })).map(e => e.id)
        for (const id of lessonList) {
            let lesson = await db.getItemById(userSchoolId, Number(id));

            range.text((lesson?.Name || "error").toString(), async (ctx) => {
                ctx.session.step = "editor-write-hw";
                ctx.session.data.editlessonId = lesson?.id
                let msg = await ctx.editMessageText(`${lesson?.Name}\nТекущее: ${(await db.getlastHomework(userSchoolId, Number(lesson?.id)))?.text || 'Нету'}\nНапишите новое д/з`, { reply_markup: editor_back_to_edit_hw })
                if (msg !== true) ctx.session.data.editMsgId = msg.message_id || null
            }).row()
        }
        return range
    })
    .back('Назад', async ctx => {
        await ctx.editMessageText('Выберите предмет на который хотите записать д/з')
    })
editor_edit_hw.register(editor_edit_list_lesson)

const editor_back_to_edit_hw = new Menu<MyContext>(`${ROLE}-back-to-edit-hw`)
    .back('Назад', async ctx => {
        ctx.session.data.editMsgId = null;
        ctx.session.step = '';
        delete ctx.session.data.write_hw
        await ctx.editMessageText('Выберите предмет на который хотите записать д/з')
    })
editor_edit_hw.register(editor_back_to_edit_hw)

export const editor_confirm_write_hw = new Menu<MyContext>(`${ROLE}_confirm_write_hw`)
    .text('Подтвердить', async (ctx) => {
        let userSchoolId = (await db.getUserById(ctx.chatId || 0))?.schoolId
        let lesson = await db.getItemById(Number(userSchoolId), Number(ctx.session.data.editlessonId));
        let confirmedHWText = ctx.session.data.text_hw;
        if (confirmedHWText) {
            await ctx.editMessageText(`Изменения сохранены.\n${lesson?.Name}: ${confirmedHWText}`, { reply_markup: editor_back_to_menu });
            if (typeof userSchoolId !== "number") return ctx.reply("Ошибка: у тебя нет класса!")
            await db.addHomework(userSchoolId, Number(ctx.session.data.editlessonId), ctx.chatId || 0, ctx.session.data.text_hw)
            delete ctx.session.data.text_hw;
            delete ctx.session.data.editlessonId;
        } else {
            await ctx.editMessageText('Ошибка: имя класса не найдено.');
        }
    })
    .text('Назад', async (ctx) => {
        delete ctx.session.data.text_hw;
        let userSchoolId = (await db.getUserById(ctx.chatId || 0))?.schoolId || 0
        let lesson = await db.getItemById(userSchoolId, Number(ctx.session.data.editlessonId));
        let msg = await ctx.editMessageText(`${lesson?.Name}\nТекущее: ${(await db.getlastHomework(userSchoolId, Number(lesson?.id)))?.text || 'Нету'}\nНапишите новое д/з`, { reply_markup: editor_back_to_edit_hw })
        ctx.session.step = "editor-write-hw"
        if (msg !== true) ctx.session.data.editMsgId = msg.message_id || null
    })
editor_edit_hw.register(editor_confirm_write_hw)


const editor_lists = new Menu<MyContext>(`${ROLE}-lists`)
    .text("Расписание", async (ctx) => {
        let userId = ctx.update.callback_query?.from?.id || ctx.chatId

        if (!(await db.checkuser(userId || 0))) return ctx.reply(`У тебя не привязана школа! Что бы привязать напиши в школьную группу с ботом /join`, { reply_parameters: { message_id: ctx.update.callback_query.message?.message_id || 0 } })
        let userSchool = (await db.getSchoolBy({ id: (await db.getUserById(userId || 0))?.schoolId }))[0]
        if (userSchool?.id == null) return console.error(`err ${ROLE}-lists`)
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
        await ctx.editMessageText(reply, { reply_markup: back_to_editor_lists })
    })
    .text("Д/З", async (ctx) => {
        let userId = ctx.update.callback_query?.from?.id || ctx.chatId

        if (!(await db.checkuser(userId || 0))) return ctx.reply(`У тебя не привязана школа! Что бы привязать напиши в школьную группу с ботом /join`, { reply_parameters: { message_id: ctx.update.callback_query.message?.message_id || 0 } })
        let userSchool = (await db.getSchoolBy({ id: (await db.getUserById(userId || 0))?.schoolId }))[0]
        if (userSchool?.id == null) return console.error(`err ${ROLE}-lists`)
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
        await ctx.editMessageText(reply, { reply_markup: back_to_editor_lists })
    })
    .text("Звонков", async (ctx) => {
        let userId = ctx.update.callback_query?.from?.id || ctx.chatId

        if (!(await db.checkuser(userId || 0))) return ctx.reply(`У тебя не привязана школа! Что бы привязать напиши в школьную группу с ботом /join`, { reply_parameters: { message_id: ctx.update.callback_query.message?.message_id || 0 } })
        let userSchool = (await db.getSchoolBy({ id: (await db.getUserById(userId || 0))?.schoolId }))[0]
        if (userSchool?.id == null) return console.error(`err ${ROLE}-lists`)
        let reply = 'Расписание звонков:\n'
        let bellList = (await db.getBellsDay({ schoolId: userSchool.id })).filter(e => e.isEmpty == false)
        for (let i = 0; i < bellList.length; i++) {
            reply += `${i + 1}. ${bellList[i].interval}\n`
        }
        await ctx.editMessageText(reply, { reply_markup: back_to_editor_lists })
    }).row()
    .back('Назад', async ctx => {
        await ctx.editMessageText('Меню:')
    })
menu.register(editor_lists)

const back_to_editor_lists = new Menu<MyContext>(`back-to-${ROLE}-lists`)
    .back('Назад', async (ctx) => {
        await ctx.editMessageText('Списки:')
    })
editor_lists.register(back_to_editor_lists)


const editor_get_hw = new Menu<MyContext>(`${ROLE}-get-hw`)
    .back('Назад', async ctx => {
        await ctx.editMessageText('Меню:')
    })
menu.register(editor_get_hw)

const editor_books = new Menu<MyContext>(`${ROLE}-books`)
    .back('Назад')
menu.register(editor_books)

const editor_account = new Menu<MyContext>(`${ROLE}-account`)
    .back('Назад')
menu.register(editor_account)

const editor_back_to_menu = new Menu<MyContext>(`${ROLE}-back-to-menu`)
    .text("В меню", async (ctx) => {
        ctx.editMessageText("Меню:", { reply_markup: menu })
    })
menu.register(editor_back_to_menu)

export default {
    async start(ctx: any) {
        return await ctx.reply("Меню:", { reply_markup: menu });
    }

}

async function hasAccess(ctx: MyContext): Promise<boolean> {
    const user = await db.getUserById(ctx.chat?.id || 0);
    if (!user) return false;

    return user?.role == ROLE
}

const capitalize = (s: string) => s && String(s[0]).toUpperCase() + String(s).slice(1)