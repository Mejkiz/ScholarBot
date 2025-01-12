import { Menu, MenuRange } from "@grammyjs/menu";
import { bot } from "../misc/connections";
import { MyContext } from "../misc/connections";
import { confirm_edit_school_name_menu, confirm_add_new_item, confirm_edit_item_name_menu } from "../roles/creator";

bot.on('message', async (ctx) => {
    if (["group", "supergroup"].includes(ctx.update.message?.chat.type || '')) return
    await ctx.api.deleteMessage(ctx.chat.id, ctx.msgId)
    if (ctx.session.step === 'edit-school-name') {
        ctx.session.data = {};
        ctx.session.step = '';
        if (ctx.session.timeoutHandle) {
            clearTimeout(ctx.session.timeoutHandle);
            ctx.session.timeoutHandle = null; // Очистим таймер после его удаления
        }
        ctx.session.data.schoolName = ctx.message.text;
        return await ctx.api.editMessageText(
            ctx.chat.id,
            ctx.session.editMsgId || 1,
            `Новое имя школы: ${ctx.message.text}`,
            { reply_markup: confirm_edit_school_name_menu }
        );
    }
    if (ctx.session.step == 'create-item') {
        ctx.session.data = {};
        ctx.session.step = '';
        if (ctx.session.timeoutHandle) {
            clearTimeout(ctx.session.timeoutHandle);
            ctx.session.timeoutHandle = null; // Очистим таймер после его удаления
        }
        ctx.session.data.itemName = ctx.message.text;
        return await ctx.api.editMessageText(
            ctx.chat.id,
            ctx.session.editMsgId || 1,
            `Новый предмет: ${ctx.message.text}`,
            { reply_markup: confirm_add_new_item }
        );
    }
    if(ctx.session.step == 'edit-item-name') {
        ctx.session.data = {};
        ctx.session.step = '';
        if (ctx.session.timeoutHandle) {
            clearTimeout(ctx.session.timeoutHandle);
            ctx.session.timeoutHandle = null; // Очистим таймер после его удаления
        }
        ctx.session.data.itemName = ctx.message.text;
        return await ctx.api.editMessageText(
            ctx.chat.id,
            ctx.session.editMsgId || 1,
            `Новое имя предмета: ${ctx.message.text}`,
            { reply_markup: confirm_edit_item_name_menu }
        );
    }
});
