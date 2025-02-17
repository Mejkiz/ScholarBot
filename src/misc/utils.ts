import { Bot, Context, session } from "grammy";
import db from "../database/func/funct";
import { bot, MyContext } from "./connections"
import moment from 'moment';
import 'moment/locale/ru';

export default {
    // async checkAndAddUser(ctx: MyContext) {
    //     const user = ctx.from;
    //     if (!user) return;
    //     const { id, username, first_name, last_name } = user;
    //     if(!db.checkuser(id)) return
    //     if (!["group", "supergroup"].includes(ctx.update.message?.chat.type || '')) return
    //     console.log(user)
    
    //     let school = await db.getItemsBySchool({groupId: ctx.chatId})
    //     if(!school[0]?.id) return 
    //     await db.createuser(user, 'user', school[0].id)
    // },
}