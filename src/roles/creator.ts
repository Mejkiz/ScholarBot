import { Menu, MenuRange } from "@grammyjs/menu";
import { bot } from "../misc/connections";
import { config } from "../config";
import { MyContext } from "../misc/connections";
import db from "../database/func/funct";
import moment from 'moment';
import 'moment/locale/ru';
import 'moment-timezone'
moment.locale('ru');
import { all } from "axios";
let dayList = config.data.dayList

async function hasAccess(ctx: MyContext): Promise<boolean> {
    const user = await db.getUserById(ctx.chat?.id || 0);
    if (!user) return false;

    return user?.role == "creator"
}

const menu = new Menu<MyContext>("creator-menu")
    .submenu("Управление классом", "creator-edit-school", async ctx => {
        if (!(await hasAccess(ctx))) return ctx.deleteMessage()
        await ctx.editMessageText('Выберите что хотите поменять')
    })
    .row()
    .submenu("Управление Д/З", "creator-edit-hw", async ctx => {
        if (!(await hasAccess(ctx))) return ctx.deleteMessage()
        await ctx.editMessageText('Выберите предмет на который хотите записать д/з')
    })
    .row()
    .submenu("Д/З на завтра", "creator-get-hw", async ctx => {
        if (!(await hasAccess(ctx))) return ctx.deleteMessage()
        let day = moment().tz(config.timezone).day()+1
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
    .submenu("Списки", "creator-lists", async ctx => {
        if (!(await hasAccess(ctx))) return ctx.deleteMessage()
        await ctx.editMessageText('Списки:')
    })
    // .submenu("Книги", "creator-books", async ctx => {
    //     if (!(await hasAccess(ctx))) return ctx.deleteMessage()
    //     await ctx.editMessageText('Список книг:\n(для добавления напишите вашему администратору, раздел находится в разработке)')
    // })
    .row()
    .submenu("Аккаунт", "creator-account", async ctx => {
        if (!(await hasAccess(ctx))) return ctx.deleteMessage()
        let user = await db.getUserById(ctx.chatId || 0)
        if (user == null) return await ctx.editMessageText("Ошибка")
        await ctx.editMessageText(`Ваш аккаунт:\n• Id: ${user.id}\n• Роль: ${user.role || 'none'}\n• Id-Школы: ${user.schoolId || 'none'}`)
    })
bot.use(menu)

const creator_edit_school = new Menu<MyContext>("creator-edit-school")
    .submenu("Имя класса", "creator-edit-menu", async (ctx) => {
        let userSchoolId = (await db.getUserById(ctx.chatId || 0))?.schoolId
        let nameSchool = (await db.getSchoolById(userSchoolId || 0))?.Name
        if (typeof nameSchool !== "string") return await ctx.reply("Ошибка: У тебя нет класса")
        const msg = await ctx.editMessageText(`Текущее имя класса: ${nameSchool}\nВведите новое имя класса.\n Что бы отменить нажминте кнопку "Назад" ниже`)
        ctx.session.step = "edit-school-name"
        if (msg !== true) ctx.session.data.editMsgId = msg.message_id || null
    })
    // .submenu("Группа", "creator-edit-group")
    .row()
    .submenu("Предметы", "creator-edit-items", async (ctx) => {
        await ctx.editMessageText("Создавайте, редактируйте и удаляйте предметы ниже")
    })
    .submenu("Звонки", "creator-edit-bell", async (ctx) => {
        await ctx.editMessageText("Редактируйте расписание звонков ниже")
    })
    .submenu("Расписание", "creator-edit-schedule", async (ctx) => {
        ctx.editMessageText('Выберите день недели который хотите изменить')
    })
    .row()
    .back('Назад', async ctx => {
        await ctx.editMessageText('Меню:')
    })
menu.register(creator_edit_school)

const creator_edit_menu = new Menu<MyContext>("creator-edit-menu")
    .back('Назад', async ctx => {
        ctx.session.data.editMsgId = null;
        ctx.session.data = {};
        ctx.session.step = '';
        await ctx.editMessageText('Выберите что хотите поменять')
    })
creator_edit_school.register(creator_edit_menu)

export const confirm_edit_school_name_menu = new Menu<MyContext>('confirm-edit-school-name-menu')
    .text('Подтвердить', async (ctx) => {
        let confirmedSchoolName = ctx.session.data.schoolName;
        if (confirmedSchoolName) {
            await ctx.editMessageText(`Изменения сохранены.\nНовое имя класса: ${confirmedSchoolName}`, { reply_markup: creator_back_to_menu });
            let userSchoolId = (await db.getUserById(ctx.chatId || 0))?.schoolId
            if (typeof userSchoolId !== "number") return ctx.reply("Ошибка: у тебя нет класса!")
            await db.editSchool(userSchoolId, { Name: confirmedSchoolName })
            delete ctx.session.data.schoolName;
        } else {
            await ctx.editMessageText('Ошибка: имя класса не найдено.');
        }
    })
    .text('Назад', async (ctx) => {
        delete ctx.session.data.schoolName;
        let userSchoolId = (await db.getUserById(ctx.chatId || 0))?.schoolId
        let nameSchool = (await db.getSchoolById(userSchoolId || 0))?.Name
        if (typeof nameSchool !== "string") return await ctx.reply("Ошибка: У тебя нет класса")
        const msg = await ctx.editMessageText(`Текущее имя класса: ${nameSchool}\nВведите новое имя класса.\n Что бы отменить нажминте кнопку "Назад" ниже`, { reply_markup: creator_edit_menu })
        ctx.session.step = "edit-school-name"
        if (msg !== true) ctx.session.data.editMsgId = msg.message_id || null
    })

creator_edit_menu.register(confirm_edit_school_name_menu)

const creator_edit_group = new Menu<MyContext>("creator-edit-group")
    .back('Назад', async ctx => {
        await ctx.editMessageText('Выберите что хотите поменять')
    })
creator_edit_school.register(creator_edit_group)

//
// СОЗДАНИЕ ПРЕДМЕТОВ
//

const creator_edit_items = new Menu<MyContext>("creator-edit-items")
    .dynamic(async (ctx: MyContext) => {
        let itemsList = await db.getItems();
        const range = new MenuRange<MyContext>();
        itemsList.forEach((item) => {
            range
                .text(item.Name.toString(), (ctx) => {
                    ctx.editMessageText(`Предмет: ${item.Name.toString()}\nВыберите действие ниже`, { reply_markup: creator_edit_item });
                    ctx.session.data.subjectEditId = item.id || null
                })
                .row();
        });
        return range;
    })
    .text("+ Предмет", async (ctx) => {
        let userSchoolId = (await db.getUserById(ctx.chatId || 0))?.schoolId
        let nameSchool = (await db.getSchoolById(userSchoolId || 0))?.Name
        if (typeof nameSchool !== "string") return await ctx.reply("Ошибка: У тебя нет класса")
        const msg = await ctx.editMessageText(`Введите имя нового предмета.\n Что бы отменить нажминте кнопку "Назад" ниже`, { reply_markup: creator_edit_items_back })
        ctx.session.step = "create-item"
        if (msg !== true) ctx.session.data.editMsgId = msg.message_id || null
    })
    .row()
    .back('Назад', async (ctx) => {
        await ctx.editMessageText('Выберите что хотите поменять');
    });

creator_edit_school.register(creator_edit_items);

const creator_edit_item = new Menu<MyContext>("creator-edit-item")
    .text("Изменить имя", async (ctx) => {
        let msg = await ctx.editMessageText(`Текущее имя предмета: ${(await db.getItemById((await db.getUserById(ctx.chatId || 0))?.schoolId || 0, ctx.session.data.subjectEditId || 0))?.Name}\nНапишите новое имя`, { reply_markup: creator_edit_items_back })
        ctx.session.step = "edit-item-name"
        if (msg !== true) ctx.session.data.editMsgId = msg.message_id || null
    })
    .submenu("Удалить", "confirm-remove-item", async (ctx) => {
        ctx.editMessageText(`Подтвердите что хотите удалить предмет - ${(await db.getItemById((await db.getUserById(ctx.chatId || 0))?.schoolId || 0, ctx.session.data.subjectEditId || 0))?.Name}`)
    })
    .row()
    .back("Назад", async (ctx) => {
        ctx.session.data.subjectEditId = null
        ctx.editMessageText("Создавайте, редактируйте и удаляйте предметы ниже")
    })

creator_edit_items.register(creator_edit_item)

const creator_edit_items_back = new Menu<MyContext>("creator-edit-items-back")
    .back("Назад", async (ctx) => {
        ctx.session.data.editMsgId = null;
        ctx.session.data = {};
        ctx.session.step = '';
        ctx.editMessageText("Создавайте, редактируйте и удаляйте предметы ниже")
    })

creator_edit_items.register(creator_edit_items_back)

const creator_edit_item_back = new Menu<MyContext>("creator-edit-item-back")
    .back("Назад", async (ctx) => {
        ctx.editMessageText("Создавайте, редактируйте и удаляйте предметы ниже")
    })

creator_edit_items.register(creator_edit_item_back)

export const confirm_add_new_item = new Menu<MyContext>('confirm-add-new-item')
    .text('Подтвердить', async (ctx) => {
        let confirmedItemName = ctx.session.data.itemName;
        if (confirmedItemName) {
            await ctx.editMessageText(`Добавлен новый предмет: ${confirmedItemName}`, { reply_markup: creator_edit_items_back });
            let userSchoolId = (await db.getUserById(ctx.chatId || 0))?.schoolId
            if (typeof userSchoolId !== "number") return ctx.reply("Ошибка: у тебя нет класса!")
            await db.createItem(userSchoolId, ctx.chatId, confirmedItemName)
            delete ctx.session.data.itemName;
        } else {
            await ctx.editMessageText('Ошибка: имя предмета не найдено.');
        }
    })
    .text('Назад', async (ctx) => {
        delete ctx.session.data.itemName;
        let userSchoolId = (await db.getUserById(ctx.chatId || 0))?.schoolId
        let nameSchool = (await db.getSchoolById(userSchoolId || 0))?.Name
        if (typeof nameSchool !== "string") return await ctx.reply("Ошибка: У тебя нет класса")
        const msg = await ctx.editMessageText(`Введите имя нового предмета.\n Что бы отменить нажминте кнопку "Назад" ниже`, { reply_markup: creator_edit_items_back })
        ctx.session.step = "create-item"
        if (msg !== true) ctx.session.data.editMsgId = msg.message_id || null
    })

creator_edit_items.register(confirm_add_new_item)

export const confirm_edit_item_name_menu = new Menu<MyContext>('confirm-edit-item-name-menu')
    .text('Подтвердить', async (ctx) => {
        let confirmedItemName = ctx.session.data.itemName;
        if (confirmedItemName) {
            await ctx.editMessageText(`Изменения сохранены.\nНовое имя предмета: ${confirmedItemName}`, { reply_markup: creator_edit_items_back });
            let userSchoolId = (await db.getUserById(ctx.chatId || 0))?.schoolId
            if (typeof userSchoolId !== "number") return ctx.reply("Ошибка: у тебя нет класса!")
            await db.editItem(userSchoolId, ctx.session.data.subjectEditId || 0, { Name: confirmedItemName })
            delete ctx.session.data.itemName;
        } else {
            await ctx.editMessageText('Ошибка: имя класса не найдено.');
        }
    })
    .text('Назад', async (ctx) => {
        delete ctx.session.data.itemName;
        let msg = await ctx.editMessageText(`Текущее имя предмета: ${(await db.getItemById((await db.getUserById(ctx.chatId || 0))?.schoolId || 0, ctx.session.data.subjectEditId || 0))?.Name}\nНапишите новое имя`, { reply_markup: creator_edit_items_back })
        ctx.session.step = "edit-item-name"
    })

creator_edit_menu.register(confirm_edit_item_name_menu)

const confirm_remove_item = new Menu<MyContext>('confirm-remove-item')
    .text('Подтвердить', async (ctx) => {
        let userSchoolId = (await db.getUserById(ctx.chatId || 0))?.schoolId
        if (typeof userSchoolId !== "number") return ctx.reply("Ошибка: у тебя нет класса!")
        await db.deleteItem(userSchoolId, ctx.session.data.subjectEditId || 0)
        await ctx.editMessageText(`Предмет удалён!`, { reply_markup: creator_edit_items_back });
    })
    .back('Назад', async (ctx) => {
        ctx.editMessageText(`Предмет: ${(await db.getItemById((await db.getUserById(ctx.chatId || 0))?.schoolId || 0, ctx.session.data.subjectEditId || 0))?.Name}\nВыберите действие ниже`)
    })

creator_edit_item.register(confirm_remove_item)

//
// РЕДАКТИРОВАНИЕ ЗВОНКОВ
//
// Осталось сделать редактирование (inputText), команду для группы, лс и кнопку креатору (После надо вводить бота в работу, тестить искать баги, на admin, editor пока пофиг, слишком много работы, дедлайн до апреля (можно просто скопировать вырезав "Управление классом"))
//  

const creator_edit_bell = new Menu<MyContext>("creator-edit-bell") // clone creator_edit_schedule_items_day
    .dynamic(async (ctx: MyContext) => {
        const range = new MenuRange<MyContext>();
        let userSchoolId = (await db.getUserById(ctx.chatId || 0))?.schoolId || 0
        let listBells = await db.getBellsDay({ schoolId: userSchoolId })
        for (const Bell of listBells) {
            let itemName = Bell.isEmpty
                ? `Урок №${Bell.num}`
                : Bell.interval || 'Error';

            range.text(itemName.toString(), async (ctx) => {
                ctx.session.data.bellId = Bell.id;
                let msg = await ctx.editMessageText(`Напишите новый период для ${Bell.num}-го урока`, { reply_markup: creator_edit_bell_back });
                if (msg !== true) ctx.session.data.editMsgId = msg.message_id || null
                ctx.session.step = 'edit-bell'
            }).row();

        }
        return range;
    })
    .text("+ Ячейка", async (ctx) => {
        let userSchoolId = (await db.getUserById(ctx.chatId || 0))?.schoolId || 0
        let num = (Number((await db.getBellsDay({ where: { schoolId: userSchoolId }, order: { id: -1 }, take: 1 }))[0]?.num) + 1) || 1
        await db.createBell(userSchoolId, num, undefined)
        ctx.editMessageText(`Редактируйте расписание звонков ниже`, { reply_markup: creator_edit_bell })
    })
    .back('Назад', async ctx => {
        await ctx.editMessageText(`Выберите что хотите поменять`)
    })


creator_edit_school.register(creator_edit_bell)

export const confirm_edit_bell = new Menu<MyContext>("confirm_edit_bell")
    .text('Подтвердить', async (ctx) => {
        let userSchoolId = (await db.getUserById(ctx.chatId || 0))?.schoolId
        let bell = (await db.getBellsDay({ schoolId: userSchoolId, id: ctx.session.data.bellId }))[0]
        let confirmedBell = ctx.session.data.text_bell;
        if (confirmedBell) {
            await ctx.editMessageText(`Изменения сохранены.\nУрок №${bell.num}: ${confirmedBell}`, { reply_markup: creator_edit_bell_back });
            if (typeof userSchoolId !== "number") return ctx.reply("Ошибка: у тебя нет класса!")
            await db.editBell(userSchoolId, ctx.session.data.bellId, { interval: confirmedBell, isEmpty: false })
            delete ctx.session.data.text_bell;
            delete ctx.session.data.bellId;
        } else {
            await ctx.editMessageText('Ошибка: имя класса не найдено.');
        }
    })
    .text('Назад', async (ctx) => {
        delete ctx.session.data.text_bell;
        let userSchoolId = (await db.getUserById(ctx.chatId || 0))?.schoolId || 0
        let bell = (await db.getBellsDay({ schoolId: userSchoolId, id: ctx.session.data.bellId }))[0]
        let msg = await ctx.editMessageText(`Напишите новый период для ${bell.num}-го урока`, { reply_markup: creator_edit_bell_back })
        ctx.session.step = "edit-bell"
        if (msg !== true) ctx.session.data.editMsgId = msg.message_id || null
    })
creator_edit_bell.register(confirm_edit_bell)

const creator_edit_bell_back = new Menu<MyContext>("creator-edit-bell-back")
    .back("Назад", async (ctx) => {
        ctx.session.data = {};
        ctx.session.step = '';
        ctx.editMessageText("Создавайте, редактируйте и удаляйте предметы ниже")
    })
creator_edit_bell.register(creator_edit_bell_back)

//
// РАСПИСАНИЕ
//

const creator_edit_schedule = new Menu<MyContext>("creator-edit-schedule")
    .dynamic(async (ctx: MyContext) => {
        const range = new MenuRange<MyContext>();
        for (let i = 0; i < dayList.length; i++) {
            range
                .text(dayList[i], async (ctx) => {
                    ctx.session.data.dayId = i;
                    let userSchoolId = (await db.getUserById(ctx.chatId || 0))?.schoolId || 0
                    if (!await db.checkDay(userSchoolId, i)) await db.createDay(userSchoolId, i, dayList[i], ([0, 6].includes(i) ? false : true))
                    ctx.editMessageText(`Вы выбрали - ${dayList[i]}.\nВыберите что хотите изменить`, { reply_markup: creator_edit_schedule_day })
                })
                .row()
        }
        return range;
    })
    .back('Назад', async ctx => {
        await ctx.editMessageText('Выберите что хотите поменять')
    })

creator_edit_school.register(creator_edit_schedule)

const creator_edit_schedule_day = new Menu<MyContext>("creator-edit-schedule-day")
    .text(
        async (ctx) => `Учебный день: ${(await db.getDayById((await db.getUserById(ctx.chatId || 0))?.schoolId || 0, ctx.session.data.dayId))?.isStudy ? "✅" : "❌"}`,
        async (ctx) => {
            let userSchoolId = (await db.getUserById(ctx.chatId || 0))?.schoolId || 0
            let isStudy = (await db.getDayById(userSchoolId, ctx.session.data.dayId))?.isStudy
            await db.editDay(userSchoolId, ctx.session.data.dayId, { isStudy: !isStudy })
            await ctx.editMessageText(`Вы выбрали - ${dayList[ctx.session.data.dayId]}.\nВыберите что хотите изменить`, { reply_markup: creator_edit_schedule_day })
        }
    )
    .row()
    .text("Изменить расписание", async (ctx) => {
        ctx.editMessageText(`День недели: ${dayList[ctx.session.data.dayId]}\nИзменяйте расписание используя кнопки ниже`, { reply_markup: creator_edit_schedule_items_day })
    })
    .back("Назад", async (ctx) => {
        delete ctx.session.data.dayId
        await ctx.editMessageText("Выберите день недели который хотите изменить")
    })

creator_edit_schedule.register(creator_edit_schedule_day)

const creator_edit_schedule_items_day = new Menu<MyContext>("creator-edit-schedule-items-day")
    .dynamic(async (ctx: MyContext) => {
        const range = new MenuRange<MyContext>();
        let userSchoolId = (await db.getUserById(ctx.chatId || 0))?.schoolId || 0
        let lessonsDay = await db.getLessonsDay({ schoolId: userSchoolId, dayId: ctx.session.data.dayId })
        for (const lDay of lessonsDay) {
            let itemName = lDay.isEmpty
                ? `Ячейка №${lDay.num}`
                : (await db.getItemsBySchool({ schoolId: userSchoolId, id: lDay.itemId }))[0]?.Name || 'Error';

            range.text(itemName.toString(), async (ctx) => {
                ctx.session.data.lessonId = lDay.id;
                ctx.editMessageText(`Выберите какой предмет хотите поставить в ячейку №${lDay.num}, День недели: ${dayList[Number(lDay.dayId)]}`, { reply_markup: creator_edit_lesson_unit });
            }).row();

        }
        return range;
    })
    .text("+ Ячейка", async (ctx) => {
        let userSchoolId = (await db.getUserById(ctx.chatId || 0))?.schoolId || 0
        let num = (Number((await db.getLessonsDay({ where: { schoolId: userSchoolId, dayId: ctx.session.data.dayId }, order: { id: -1 }, take: 1 }))[0]?.num) + 1) || 1
        await db.createLesson(userSchoolId, null, ctx.session.data.dayId, num, true)
        ctx.editMessageText(`День недели: ${dayList[ctx.session.data.dayId]}\nИзменяйте расписание используя кнопки ниже`, { reply_markup: creator_edit_schedule_items_day })
    })
    .back('Назад', async ctx => {
        await ctx.editMessageText(`Вы выбрали - ${dayList[ctx.session.data.dayId]}.\nВыберите что хотите изменить`)
    })

creator_edit_schedule_day.register(creator_edit_schedule_items_day)

const creator_edit_lesson_unit = new Menu<MyContext>("creator-edit-lesson-unit")
    .dynamic(async (ctx: MyContext) => {
        const range = new MenuRange<MyContext>();
        let userSchoolId = (await db.getUserById(ctx.chatId || 0))?.schoolId || 0
        let schoolItems = await db.getItemsBySchool({ schoolId: userSchoolId })
        schoolItems.forEach(async (item) => {
            range
                .text(item.Name.toString(), async (ctx) => {
                    await db.editLesson(userSchoolId, ctx.session.data.lessonId, { itemId: item.id, isEmpty: false })
                    delete ctx.session.data.lessonId
                    await ctx.editMessageText(`День недели: ${dayList[ctx.session.data.dayId]}\nИзменяйте расписание используя кнопки ниже`, { reply_markup: creator_edit_schedule_items_day })
                })
                .row()
        });
        return range;
    })
    .text("Удалить", async (ctx) => {
        let userSchoolId = (await db.getUserById(ctx.chatId || 0))?.schoolId || 0
        await db.deleteLesson(userSchoolId, ctx.session.data.lessonId)
        delete ctx.session.data.lessonId
        await ctx.editMessageText(`День недели: ${dayList[ctx.session.data.dayId]}\nИзменяйте расписание используя кнопки ниже`, { reply_markup: creator_edit_schedule_items_day })
    })
    .back('Назад', async ctx => {
        delete ctx.session.data.lessonId
        await ctx.editMessageText(`День недели: ${dayList[ctx.session.data.dayId]}\nИзменяйте расписание используя кнопки ниже`)
    })

creator_edit_schedule_items_day.register(creator_edit_lesson_unit)

const creator_edit_hw = new Menu<MyContext>("creator-edit-hw")
    .dynamic(async (ctx: MyContext) => {
        const range = new MenuRange<MyContext>();
        let userSchoolId = (await db.getUserById(ctx.chatId || 0))?.schoolId || 0
        let day = moment().tz(config.timezone).day()
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
                ctx.session.step = "write-hw";
                ctx.session.data.editlessonId = lesson?.id
                let msg = await ctx.editMessageText(`${lesson?.Name}\nТекущее: ${(await db.getlastHomework(userSchoolId, Number(lesson?.id)))?.text || 'Нету'}\nНапишите новое д/з`, { reply_markup: creator_back_to_edit_hw })
                if (msg !== true) ctx.session.data.editMsgId = msg.message_id || null
            }).row()
        }
        range.text('Другие', async (ctx) => {
            ctx.editMessageText(`Выберите предмет на который хотите записать д/з`, { reply_markup: creator_edit_list_lesson })
        })
        return range
    })
    .back('Назад', async ctx => {
        await ctx.editMessageText('Меню:')
    })
menu.register(creator_edit_hw)

const creator_back_to_edit_hw = new Menu<MyContext>("creator-back-to-edit-hw")
    .back('Назад', async ctx => {
        ctx.session.data.editMsgId = null;
        ctx.session.step = '';
        delete ctx.session.data.write_hw
        await ctx.editMessageText('Выберите предмет на который хотите записать д/з')
    })
creator_edit_hw.register(creator_back_to_edit_hw)

export const confirm_write_hw = new Menu<MyContext>("confirm_write_hw")
    .text('Подтвердить', async (ctx) => {
        let userSchoolId = (await db.getUserById(ctx.chatId || 0))?.schoolId
        let lesson = await db.getItemById(Number(userSchoolId), Number(ctx.session.data.editlessonId));
        let confirmedHWText = ctx.session.data.text_hw;
        if (confirmedHWText) {
            await ctx.editMessageText(`Изменения сохранены.\n${lesson?.Name}: ${confirmedHWText}`, { reply_markup: creator_back_to_menu });
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
        let msg = await ctx.editMessageText(`${lesson?.Name}\nТекущее: ${(await db.getlastHomework(userSchoolId, Number(lesson?.id)))?.text || 'Нету'}\nНапишите новое д/з`, { reply_markup: creator_back_to_edit_hw })
        ctx.session.step = "write-hw"
        if (msg !== true) ctx.session.data.editMsgId = msg.message_id || null
    })
creator_edit_hw.register(confirm_write_hw)


const creator_edit_list_lesson = new Menu<MyContext>("creator-edit-list-lesson")
    .dynamic(async (ctx: MyContext) => {
        const range = new MenuRange<MyContext>();
        let userSchoolId = (await db.getUserById(ctx.chatId || 0))?.schoolId || 0
        let lessonList = (await db.getItemsBySchool({ schoolId: userSchoolId })).map(e => e.id)
        for (const id of lessonList) {
            let lesson = await db.getItemById(userSchoolId, Number(id));

            range.text((lesson?.Name || "error").toString(), async (ctx) => {
                ctx.session.step = "write-hw";
                ctx.session.data.editlessonId = lesson?.id
                let msg = await ctx.editMessageText(`${lesson?.Name}\nТекущее: ${(await db.getlastHomework(userSchoolId, Number(lesson?.id)))?.text || 'Нету'}\nНапишите новое д/з`, { reply_markup: creator_back_to_edit_hw })
                if (msg !== true) ctx.session.data.editMsgId = msg.message_id || null
            }).row()
        }
        return range
    })
    .back('Назад', async ctx => {
        await ctx.editMessageText('Выберите предмет на который хотите записать д/з')
    })
creator_edit_hw.register(creator_edit_list_lesson)


const creator_lists = new Menu<MyContext>("creator-lists")
    .text("Расписание", async (ctx) => {
        let userId = ctx.update.callback_query?.from?.id || ctx.chatId

        if (!(await db.checkuser(userId || 0))) return ctx.reply(`У тебя не привязана школа! Что бы привязать напиши в школьную группу с ботом /join`, { reply_parameters: { message_id: ctx.update.callback_query.message?.message_id || 0 } })
        let userSchool = (await db.getSchoolBy({ id: (await db.getUserById(userId || 0))?.schoolId }))[0]
        if (userSchool?.id == null) return console.error("err creator-lists")
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
        await ctx.editMessageText(reply, { reply_markup: back_to_creator_lists })
    })
    .text("Д/З", async (ctx) => {
        let userId = ctx.update.callback_query?.from?.id || ctx.chatId

        if (!(await db.checkuser(userId || 0))) return ctx.reply(`У тебя не привязана школа! Что бы привязать напиши в школьную группу с ботом /join`, { reply_parameters: { message_id: ctx.update.callback_query.message?.message_id || 0 } })
        let userSchool = (await db.getSchoolBy({ id: (await db.getUserById(userId || 0))?.schoolId }))[0]
        if (userSchool?.id == null) return console.error("err creator-lists")
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
        await ctx.editMessageText(reply, { reply_markup: back_to_creator_lists })
    })
    .text("Звонков", async (ctx) => {
        let userId = ctx.update.callback_query?.from?.id || ctx.chatId

        if (!(await db.checkuser(userId || 0))) return ctx.reply(`У тебя не привязана школа! Что бы привязать напиши в школьную группу с ботом /join`, { reply_parameters: { message_id: ctx.update.callback_query.message?.message_id || 0 } })
        let userSchool = (await db.getSchoolBy({ id: (await db.getUserById(userId || 0))?.schoolId }))[0]
        if (userSchool?.id == null) return console.error("err creator-lists")
        let reply = 'Расписание звонков:\n'
        let bellList = (await db.getBellsDay({ schoolId: userSchool.id })).filter(e => e.isEmpty == false)
        for (let i = 0; i < bellList.length; i++) {
            reply += `${i + 1}. ${bellList[i].interval}\n`
        }
        await ctx.editMessageText(reply, { reply_markup: back_to_creator_lists })
    }).row()
    .back('Назад', async ctx => {
        await ctx.editMessageText('Меню:')
    })
menu.register(creator_lists)

const back_to_creator_lists = new Menu<MyContext>("back-to-creator-lists")
    .back('Назад', async (ctx) => {
        await ctx.editMessageText('Списки:')
    })
creator_lists.register(back_to_creator_lists)

const creator_get_hw = new Menu<MyContext>("creator-get-hw")
    .back('Назад', async ctx => {
        await ctx.editMessageText('Меню:')
    })
menu.register(creator_get_hw)

const creator_books = new Menu<MyContext>("creator-books")
    .back('Назад')
menu.register(creator_books)

const creator_account = new Menu<MyContext>("creator-account")
    .back('Назад', async ctx => {
        await ctx.editMessageText('Меню:')
    })
menu.register(creator_account)

const creator_back_to_menu = new Menu<MyContext>("creator-back-to-menu")
    .text("В меню", async (ctx) => {
        ctx.editMessageText("Меню:", { reply_markup: menu })
    })
menu.register(creator_back_to_menu)

export default {
    async start(ctx: any) {
        return await ctx.reply("Меню:", { reply_markup: menu });
    }
}

const capitalize = (s: string) => s && String(s[0]).toUpperCase() + String(s).slice(1)