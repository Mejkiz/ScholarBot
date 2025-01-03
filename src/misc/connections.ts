import { Bot, Context } from "grammy";
import { Menu } from "@grammyjs/menu";
import { config } from "../config";
import { Admin } from "../modules/admin.js"
import { DataBase } from "../database/db";

interface BotConfig {
    isDeveloper: boolean;
}

type MyContext = Context & {
    config: BotConfig;
};
let db = new DataBase()

db.connect()

export const bot = new Bot<MyContext>(config.auth.telegram.token);

bot.use(async (ctx, next) => {
    ctx.config = {
        isDeveloper: config.admins.includes(ctx.from?.id),
    };
    await next();
});

export class Connections {
    test: any
    constructor() {
        this.test = {}
    }
}
