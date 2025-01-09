import { Menu, MenuRange } from "@grammyjs/menu";
import { bot } from "../misc/connections";
import { MyContext } from "../misc/connections";
import {confirm_edit_school_name_menu} from "./creator";

bot.on('message', async (ctx) => {
    await ctx.api.deleteMessage(ctx.chat.id, ctx.msgId)
    if (ctx.session.step === 'edit-school-name') {
        ctx.session.data = {};
        ctx.session.step = '';
        if (ctx.session.timeoutHandle) {
            clearTimeout(ctx.session.timeoutHandle);
            ctx.session.timeoutHandle = null; // Очистим таймер после его удаления
        }
        ctx.session.data.schoolName = ctx.message.text;
        await ctx.api.editMessageText(
            ctx.chat.id,
            ctx.session.editMsgId || 1,
            `Новое имя школы: ${ctx.message.text}`,
            { reply_markup: confirm_edit_school_name_menu }
        );
    }
});
