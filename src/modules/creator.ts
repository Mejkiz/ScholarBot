import { Menu, MenuRange } from "@grammyjs/menu";
import { bot } from "../misc/connections";
import { MyContext } from "../misc/connections";
import { DBFunc } from "../database/func/funct";
let db = new DBFunc()

const menu = new Menu<MyContext>("creator-menu")
    .submenu("Управление классом", "creator-edit-school", async ctx => {
        await ctx.editMessageText('Выберите что хотите поменять')
    })
    .row()
    .submenu("Управление Д/З", "creator-edit-hw", async ctx => {
        await ctx.editMessageText('Выберите предмет на который хотите записать д/з')
    })
    .row()
    .submenu("Д/З", "creator-get-hw", async ctx => {
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
    .submenu("Имя класса", "creator-edit-schoolName", async (ctx) => {
        let userSchoolId = (await db.getUserById(ctx.chatId || 0))?.schoolId
        let nameSchool = (await db.getSchoolById(userSchoolId || 0))?.Name
        if(typeof nameSchool !== "string") return await ctx.reply("Ошибка: У тебя нет класса")
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
                if(ctx.chat?.id) {
                    return await ctx.api.editMessageText(
                        ctx.chat.id,
                        ctx.session.editMsgId || 1,
                        `Время для ввода истекло. Пожалуйста, попробуйте снова.`,
                        { reply_markup: creator_edit_schoolName }
                    );
                } else return await ctx.reply('Время для ввода истекло. Пожалуйста, попробуйте снова.', { reply_markup: creator_edit_schoolName });
            }
        }, 5*60*1000); // 5 минут
    })
    .submenu("Группа", "creator-edit-group")
    .back('Назад', async ctx => {
        await ctx.editMessageText('Меню:')
    })
menu.register(creator_edit_school)

const creator_edit_schoolName = new Menu<MyContext>("creator-edit-schoolName")
    .back('Назад', async ctx => {
        ctx.session.data = {};
        ctx.session.step = '';
        if (ctx.session.timeoutHandle) {
            clearTimeout(ctx.session.timeoutHandle);
            ctx.session.timeoutHandle = null; // Очистим таймер после его удаления
        }
        await ctx.editMessageText('Выберите что хотите поменять')
    })
creator_edit_school.register(creator_edit_schoolName)

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

export const confirm_edit_school_name_menu = new Menu<MyContext>('confirm-edit-school-name-menu')
    .text('Подтвердить', async (ctx) => {
        let confirmedSchoolName = ctx.session.data.schoolName;
        if (confirmedSchoolName) {
            await ctx.editMessageText(`Изменения сохранены. Новое имя класса: ${confirmedSchoolName}`, { reply_markup: creator_back_to_menu });
            console.log("save " + confirmedSchoolName)
            delete ctx.session.data.schoolName;
        } else {
            await ctx.editMessageText('Ошибка: имя класса не найдено.');
        }
    })
    .text('Назад', async (ctx) => {
        delete ctx.session.data.schoolName;
        let userSchoolId = (await db.getUserById(ctx.chatId || 0))?.schoolId
        let nameSchool = (await db.getSchoolById(userSchoolId || 0))?.Name
        if(typeof nameSchool !== "string") return await ctx.reply("Ошибка: У тебя нет класса")
        const msg = await ctx.editMessageText(`Текущее имя класса: ${nameSchool}\nВведите новое имя класса, у вас есть 5 минут.\n Что бы отменить нажминте кнопку "Назад" ниже`, { reply_markup: creator_edit_schoolName })
        if (ctx.session.timeoutHandle) {
            clearTimeout(ctx.session.timeoutHandle);
        }
        ctx.session.step = "edit-school-name"
        if (msg !== true) ctx.session.editMsgId = msg.message_id || null
        ctx.session.timeoutHandle = setTimeout(async () => {
            if (ctx.session.step == 'edit-school-name') {
                ctx.session.step = '';
                ctx.session.data = {};
                if(ctx.chat?.id) {
                    return await ctx.api.editMessageText(
                        ctx.chat.id,
                        ctx.session.editMsgId || 1,
                        `Время для ввода истекло. Пожалуйста, попробуйте снова.`,
                        { reply_markup: creator_edit_schoolName }
                    );
                } else return await ctx.reply('Время для ввода истекло. Пожалуйста, попробуйте снова.', { reply_markup: creator_edit_schoolName });
            }
        }, 5*60*1000); // 5 минут
    })

creator_edit_schoolName.register(confirm_edit_school_name_menu)

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
