import { Menu, MenuRange } from "@grammyjs/menu";
import { bot } from "../misc/connections";



const menu = new Menu("editor-menu")
    .submenu("Управление Д/З", "editor-edit-hw", async ctx => {
        await ctx.editMessageText('Выберите предмет на который хотите записать д/з')
    })
    .row()
    .submenu("Д/З", "editor-get-hw", async ctx => {
        await ctx.editMessageText('Дз на завтра:')
    })
    .submenu("Списки", "editor-lists", async ctx => {
        await ctx.editMessageText('Списки:')
    })
    .submenu("Книги", "editor-books", async ctx => {
        await ctx.editMessageText('Список книг:\n(для добавления напишите вашему администратору, раздел находится в разработке)')
    })
    .row()
    .submenu("Аккаунт", "editor-account", async ctx => {
        await ctx.editMessageText('Аккаунт:')
    })
bot.use(menu)


const editor_edit_hw = new Menu("editor-edit-hw")
    .back('Назад', async ctx => {
        await ctx.editMessageText('Меню:')
    })
menu.register(editor_edit_hw)

const editor_lists = new Menu("editor-lists")
    .back('Назад', async ctx => {
        await ctx.editMessageText('Меню:')
    })
menu.register(editor_lists)

const editor_get_hw = new Menu("editor-get-hw")
    .text({ text: "xdd", payload: Date.now().toString() },
        async (ctx) => {
            await ctx.answerCallbackQuery("Тест");
        })
    .back('Назад', async ctx => {
        await ctx.editMessageText('Меню:')
    })
menu.register(editor_get_hw)

const editor_books = new Menu("editor-books")
    .back('Назад')
menu.register(editor_books)

const editor_account = new Menu("editor-account")
    .back('Назад')
menu.register(editor_account)


export default {
    async start(ctx: any) {
        return await ctx.reply("Меню:", { reply_markup: menu });
    }

}
