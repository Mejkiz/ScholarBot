import { Bot, Context, session, MemorySessionStorage, SessionFlavor } from "grammy";
import { config } from "../config";
import { DataBase } from "../database/db";

interface BotConfig {
    isDeveloper: boolean;
}

interface SessionData {
    step: string;
    data: Record<string, any>;
}


export type MyContext = Context & {
    config: BotConfig;
} & SessionFlavor<SessionData>;
let db = new DataBase()

db.connect()

export const bot = new Bot<MyContext>(config.auth.telegram.token);

bot.use(async (ctx, next) => {
    ctx.config = {
        isDeveloper: config.admins.includes(ctx.from?.id),
    };
    await next();
});

bot.use(session({
    initial: (): SessionData => ({
        step: '',
        data: {},
    }),
}));

