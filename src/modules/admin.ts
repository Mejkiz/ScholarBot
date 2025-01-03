import { Menu, MenuRange } from "@grammyjs/menu";
import { bot } from "../misc/connections";
const SchoolDatabase = [
    {name:"Могойтинская СОШ", id:"mogoyto-school"},
    {name:"Курумканская СОШ №1", id:"kyrymkan-school-1"},
    {name:"Курумканская СОШ №2", id:"kyrymkan-school-2"}
]

export class Admin {
    menu: any;
    admin_schools: any;
    admin_statistics: any;
    admin_control: any;
    admin_server: any;
    admin_my_school: any;
    constructor() {
        this.menu = new Menu("admin-menu")
            .submenu("Школы", "admin-schools", async ctx => {
                await ctx.editMessageText('Школы:')
            })
            .submenu("Статистика", "admin-statistics", async ctx => {
                await ctx.editMessageText('Статистика:\nКол-во пользователей: x чел.\nКол-во школ: x школ\n...\n...')
            }).row()
            .submenu("Управление", "admin-control", async ctx => {
                await ctx.editMessageText('Управление ботом:')
            })
            .submenu("Сервер", "admin-server", async ctx => {
                await ctx.editMessageText('Статистика/управление сервер(а/ом):')
            })
            .submenu("Моя школа", "admin-my-school")
        bot.use(this.menu)

        this.admin_schools = new Menu("admin-schools")
            .dynamic(() => {
                const range = new MenuRange();
                for (let i = 0; i < SchoolDatabase.length; i++) {
                    range
                        .submenu({text: SchoolDatabase[i].name, payload: SchoolDatabase[i].id},SchoolDatabase[i].id, (ctx)=> {
                            ctx.editMessageText(`Вы выбрали школу "${SchoolDatabase[i].name}". Функция находится в разработке (SAD)`)
                        })
                        .row()
                }
                return range;
            })
            .back("Назад", async ctx => {
                await ctx.editMessageText('Меню:')
            });
        this.menu.register(this.admin_schools)

        this.admin_statistics = new Menu("admin-statistics")
            .back('Назад', async ctx => {
                await ctx.editMessageText('Меню:')
            })
        this.menu.register(this.admin_statistics)

        this.admin_control = new Menu("admin-control")
            .back('Назад', async ctx => {
                await ctx.editMessageText('Меню:')
            })
        this.menu.register(this.admin_control)

        this.admin_server = new Menu("admin-server")
            .text({text:"xdd", payload: Date.now().toString()},
            async (ctx) => {
                await ctx.answerCallbackQuery("Тест");
            })
            .back('Назад', async ctx => {
                await ctx.editMessageText('Меню:')
            })
        this.menu.register(this.admin_server)

        this.admin_my_school = new Menu("admin-my-school")
            .back('Назад')
        this.menu.register(this.admin_my_school)
    }

    async start(ctx: any) {
        return await ctx.reply("Меню:", { reply_markup: this.menu });
    }

    async test(ctx: any) {
        return await ctx.reply("Посмотрите на это меню:", { reply_markup: this.admin_schools });
    }

}

