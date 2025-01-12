import { Menu, MenuRange } from "@grammyjs/menu";
import { bot } from "../misc/connections";
import { MyContext } from "../misc/connections";
import db from "../database/func/funct";

const menu = new Menu<MyContext>("creator-menu")
    .submenu("Управление классом", "creator-edit-school", async ctx => {
        await ctx.editMessageText('Выберите что хотите поменять')
    })
    .row()
    .submenu("Управление Д/З", "creator-edit-hw", async ctx => {
        await ctx.editMessageText('Выберите предмет на который хотите записать д/з')
    })
    .row()
    .submenu("Д/З на завтра", "creator-get-hw", async ctx => {
        await ctx.editMessageText('Дз на завтра:')
    })
    .submenu("Списки", "creator-lists", async ctx => {
        await ctx.editMessageText('Списки:')
    })
    .submenu("Книги", "creator-books", async ctx => {
        await ctx.editMessageText('Список книг:\n(для добавления напишите вашему администратору, раздел находится в разработке)')
    })
    .row()
    .submenu("Аккаунт", "creator-account", async ctx => {
        await ctx.editMessageText('Аккаунт:')
    })
bot.use(menu)

const creator_edit_school = new Menu<MyContext>("creator-edit-school")
    .submenu("Имя класса", "creator-edit-menu", async (ctx) => {
        let userSchoolId = (await db.getUserById(ctx.chatId || 0))?.schoolId
        let nameSchool = (await db.getSchoolById(userSchoolId || 0))?.Name
        if (typeof nameSchool !== "string") return await ctx.reply("Ошибка: У тебя нет класса")
        const msg = await ctx.editMessageText(`Текущее имя класса: ${nameSchool}\nВведите новое имя класса, у вас есть 5 минут.\n Что бы отменить нажминте кнопку "Назад" ниже`)
        if (ctx.session.timeoutHandle) {
            clearTimeout(ctx.session.timeoutHandle);
        }
        ctx.session.step = "edit-school-name"
        if (msg !== true) ctx.session.editMsgId = msg.message_id || null
        ctx.session.timeoutHandle = setTimeout(async () => {
            if (ctx.session.step == 'edit-school-name') {
                ctx.session.step = '';
                ctx.session.data = {};
                if (ctx.chat?.id) {
                    return await ctx.api.editMessageText(
                        ctx.chat.id,
                        ctx.session.editMsgId || (msg != true ? msg.message_id : 0),
                        `Время для ввода истекло. Пожалуйста, попробуйте снова.`,
                        { reply_markup: creator_edit_menu }
                    );
                } else return await ctx.reply('Время для ввода истекло. Пожалуйста, попробуйте снова.', { reply_markup: creator_edit_menu });
            }
        }, 5 * 60 * 1000); // 5 минут
    })
    .submenu("Группа", "creator-edit-group")
    .row()
    .submenu("Предметы", "creator-edit-items", async (ctx) => {
        await ctx.editMessageText("Создавайте, редактируйте и удаляйте предметы ниже")
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
        ctx.session.editMsgId = null;
        ctx.session.data = {};
        ctx.session.step = '';
        if (ctx.session.timeoutHandle) {
            clearTimeout(ctx.session.timeoutHandle);
            ctx.session.timeoutHandle = null; // Очистим таймер после его удаления
        }
        await ctx.editMessageText('Выберите что хотите поменять')
    })
creator_edit_school.register(creator_edit_menu)

export const confirm_edit_school_name_menu = new Menu<MyContext>('confirm-edit-school-name-menu')
    .text('Подтвердить', async (ctx) => {
        let confirmedSchoolName = ctx.session.data.schoolName;
        if (confirmedSchoolName) {
            await ctx.editMessageText(`Изменения сохранены. Новое имя класса: ${confirmedSchoolName}`, { reply_markup: creator_back_to_menu });
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
        const msg = await ctx.editMessageText(`Текущее имя класса: ${nameSchool}\nВведите новое имя класса, у вас есть 5 минут.\n Что бы отменить нажминте кнопку "Назад" ниже`, { reply_markup: creator_edit_menu })
        if (ctx.session.timeoutHandle) {
            clearTimeout(ctx.session.timeoutHandle);
        }
        ctx.session.step = "edit-school-name"
        if (msg !== true) ctx.session.editMsgId = msg.message_id || null
        ctx.session.timeoutHandle = setTimeout(async () => {
            if (ctx.session.step == 'edit-school-name') {
                ctx.session.step = '';
                ctx.session.data = {};
                if (ctx.chat?.id) {
                    return await ctx.api.editMessageText(
                        ctx.chat.id,
                        ctx.session.editMsgId || 1,
                        `Время для ввода истекло. Пожалуйста, попробуйте снова.`,
                        { reply_markup: creator_edit_menu }
                    );
                } else return await ctx.reply('Время для ввода истекло. Пожалуйста, попробуйте снова.', { reply_markup: creator_edit_menu });
            }
        }, 5 * 60 * 1000); // 5 минут
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
                    ctx.session.subjectEditId = item.id || null
                })
                .row();
        });
        return range;
    })
    .text("+ Предмет", async (ctx) => {
        let userSchoolId = (await db.getUserById(ctx.chatId || 0))?.schoolId
        let nameSchool = (await db.getSchoolById(userSchoolId || 0))?.Name
        if (typeof nameSchool !== "string") return await ctx.reply("Ошибка: У тебя нет класса")
        const msg = await ctx.editMessageText(`Введите имя нового предмета, на это у вас есть 5 минут.\n Что бы отменить нажминте кнопку "Назад" ниже`, { reply_markup: creator_edit_items_back })
        if (ctx.session.timeoutHandle) {
            clearTimeout(ctx.session.timeoutHandle);
        }
        ctx.session.step = "create-item"
        if (msg !== true) ctx.session.editMsgId = msg.message_id || null
        ctx.session.timeoutHandle = setTimeout(async () => {
            if (ctx.session.step == 'create-item') {
                ctx.session.step = '';
                ctx.session.data = {};
                if (ctx.chat?.id) {
                    return await ctx.api.editMessageText(
                        ctx.chat.id,
                        ctx.session.editMsgId || 1,
                        `Время для ввода истекло. Пожалуйста, попробуйте снова.`,
                        { reply_markup: undefined }
                    );
                } else return await ctx.reply('Время для ввода истекло. Пожалуйста, попробуйте снова.', { reply_markup: creator_edit_menu });
            }
        }, 5 * 60 * 1000); // 5 минут
    })
    .row()
    .back('Назад', async (ctx) => {
        await ctx.editMessageText('Выберите что хотите поменять');
    });

creator_edit_school.register(creator_edit_items);

const creator_edit_item = new Menu<MyContext>("creator-edit-item")
    .text("Изменить имя", async (ctx) => {
        if (ctx.session.timeoutHandle) {
            clearTimeout(ctx.session.timeoutHandle);
        }
        let msg = await ctx.editMessageText(`Текущее имя предмета: ${(await db.getItemById((await db.getUserById(ctx.chatId || 0))?.schoolId || 0, ctx.session.subjectEditId || 0))?.Name}\nНапишите новое имя в течении 5 минут!`, { reply_markup: creator_edit_items_back })
        ctx.session.step = "edit-item-name"
        if (msg !== true) ctx.session.editMsgId = msg.message_id || null
        ctx.session.timeoutHandle = setTimeout(async () => {
            if (ctx.session.step == 'edit-item-name') {
                ctx.session.step = '';
                ctx.session.data = {};
                if (ctx.chat?.id) {
                    return await ctx.api.editMessageText(
                        ctx.chat.id,
                        ctx.session.editMsgId || 1,
                        `Время для ввода истекло. Пожалуйста, попробуйте снова.`,
                        { reply_markup: creator_edit_item }
                    );
                } else return await ctx.reply('Время для ввода истекло. Пожалуйста, попробуйте снова.', { reply_markup: creator_edit_item });
            }
        }, 5 * 60 * 1000); // 5 минут
    })
    .submenu("Удалить", "confirm-remove-item", async (ctx) => {
        ctx.editMessageText(`Подтвердите что хотите удалить предмет - ${(await db.getItemById((await db.getUserById(ctx.chatId || 0))?.schoolId || 0, ctx.session.subjectEditId || 0))?.Name}`)
    })
    .row()
    .back("Назад", async (ctx) => {
        ctx.session.subjectEditId = null
        ctx.editMessageText("Создавайте, редактируйте и удаляйте предметы ниже")
    })

creator_edit_items.register(creator_edit_item)

const creator_edit_items_back = new Menu<MyContext>("creator-edit-items-back")
    .back("Назад", async (ctx) => {
        ctx.session.editMsgId = null;
        ctx.session.data = {};
        ctx.session.step = '';
        if (ctx.session.timeoutHandle) {
            clearTimeout(ctx.session.timeoutHandle);
            ctx.session.timeoutHandle = null; // Очистим таймер после его удаления
        }
        ctx.editMessageText("Создавайте, редактируйте и удаляйте предметы ниже")
    })

creator_edit_item.register(creator_edit_items_back)

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
        if (ctx.session.timeoutHandle) {
            clearTimeout(ctx.session.timeoutHandle);
        }
        let msg = await ctx.editMessageText(`Текущее имя предмета: ${(await db.getItemById((await db.getUserById(ctx.chatId || 0))?.schoolId || 0, ctx.session.subjectEditId || 0))?.Name}\nНапишите новое имя в течении 5 минут!`, { reply_markup: creator_edit_items_back })
        ctx.session.step = "edit-item-name"
        if (msg !== true) ctx.session.editMsgId = msg.message_id || null
        ctx.session.timeoutHandle = setTimeout(async () => {
            if (ctx.session.step == 'edit-item-name') {
                ctx.session.step = '';
                ctx.session.data = {};
                if (ctx.chat?.id) {
                    return await ctx.api.editMessageText(
                        ctx.chat.id,
                        ctx.session.editMsgId || 1,
                        `Время для ввода истекло. Пожалуйста, попробуйте снова.`,
                        { reply_markup: creator_edit_item }
                    );
                } else return await ctx.reply('Время для ввода истекло. Пожалуйста, попробуйте снова.', { reply_markup: creator_edit_item });
            }
        }, 5 * 60 * 1000); // 5 минут
    })

creator_edit_items.register(confirm_add_new_item)

export const confirm_edit_item_name_menu = new Menu<MyContext>('confirm-edit-item-name-menu')
    .text('Подтвердить', async (ctx) => {
        let confirmedItemName = ctx.session.data.itemName;
        if (confirmedItemName) {
            await ctx.editMessageText(`Изменения сохранены. Новое имя предмета: ${confirmedItemName}`, { reply_markup: creator_edit_items_back });
            let userSchoolId = (await db.getUserById(ctx.chatId || 0))?.schoolId
            if (typeof userSchoolId !== "number") return ctx.reply("Ошибка: у тебя нет класса!")
            await db.editItem(userSchoolId, ctx.session.subjectEditId || 0, { Name: confirmedItemName })
            delete ctx.session.data.itemName;
        } else {
            await ctx.editMessageText('Ошибка: имя класса не найдено.');
        }
    })
    .text('Назад', async (ctx) => {
        delete ctx.session.data.itemName;
        if (ctx.session.timeoutHandle) {
            clearTimeout(ctx.session.timeoutHandle);
        }
        let msg = await ctx.editMessageText(`Текущее имя предмета: ${(await db.getItemById((await db.getUserById(ctx.chatId || 0))?.schoolId || 0, ctx.session.subjectEditId || 0))?.Name}\nНапишите новое имя в течении 5 минут!`, { reply_markup: creator_edit_items_back })
        ctx.session.step = "edit-item-name"
        if (msg !== true) ctx.session.editMsgId = msg.message_id || null
        ctx.session.timeoutHandle = setTimeout(async () => {
            if (ctx.session.step == 'edit-item-name') {
                ctx.session.step = '';
                ctx.session.data = {};
                if (ctx.chat?.id) {
                    return await ctx.api.editMessageText(
                        ctx.chat.id,
                        ctx.session.editMsgId || 1,
                        `Время для ввода истекло. Пожалуйста, попробуйте снова.`,
                        { reply_markup: creator_edit_item }
                    );
                } else return await ctx.reply('Время для ввода истекло. Пожалуйста, попробуйте снова.', { reply_markup: creator_edit_item });
            }
        }, 5 * 60 * 1000); // 5 минут
    })

creator_edit_menu.register(confirm_edit_item_name_menu)

const confirm_remove_item = new Menu<MyContext>('confirm-remove-item')
    .text('Подтвердить', async (ctx) => {
        let userSchoolId = (await db.getUserById(ctx.chatId || 0))?.schoolId
        if (typeof userSchoolId !== "number") return ctx.reply("Ошибка: у тебя нет класса!")
        await db.deleteItem(userSchoolId, ctx.session.subjectEditId || 0)
        await ctx.editMessageText(`Предмет удалён!`, { reply_markup: creator_edit_items_back });
    })
    .back('Назад', async (ctx) => {
        ctx.editMessageText(`Предмет: ${(await db.getItemById((await db.getUserById(ctx.chatId || 0))?.schoolId || 0, ctx.session.subjectEditId || 0))?.Name}\nВыберите действие ниже`)
    })

creator_edit_item.register(confirm_remove_item)

//
// РАСПИСАНИЕ
//

const creator_edit_schedule = new Menu<MyContext>("creator-edit-schedule")
    .back('Назад', async ctx => {
        await ctx.editMessageText('Выберите что хотите поменять')
    })
creator_edit_school.register(creator_edit_schedule)

const creator_edit_hw = new Menu<MyContext>("creator-edit-hw")
    .back('Назад', async ctx => {
        await ctx.editMessageText('Меню:')
    })
menu.register(creator_edit_hw)

const creator_lists = new Menu<MyContext>("creator-lists")
    .back('Назад', async ctx => {
        await ctx.editMessageText('Меню:')
    })
menu.register(creator_lists)

const creator_get_hw = new Menu<MyContext>("creator-get-hw")
    .back('Назад', async ctx => {
        await ctx.editMessageText('Меню:')
    })
menu.register(creator_get_hw)

const creator_books = new Menu<MyContext>("creator-books")
    .back('Назад')
menu.register(creator_books)

const creator_account = new Menu<MyContext>("creator-account")
    .back('Назад')
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
