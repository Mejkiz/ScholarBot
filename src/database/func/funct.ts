import { User } from "../test/user";
import { appDataSource } from "../db";
import { EntityManager } from "typeorm"
// import { User as IUser } from "typeorm/util";

export class DBFunc {

    async getbyid(userId: number) {
        return await appDataSource.getRepository(User).findOneBy({ id: userId })
    }

    async createuser(Author: any, role: string) { // change any eh
        if(await this.checkuser(Author)) return console.error(new Error("Такой юзер уже существует!"))
        let user = new User()
        user = { firstName: Author.user.first_name, lastName: Author.user?.last_name || undefined, id: Author.user.id, nametag: Author.user?.username || undefined, role: role }
        await appDataSource.getRepository(User).save(user)
    }

    async checkuser(Author: any) { // change any eh
        return await this.getbyid(Author.user.id) != null ? true : false
    }

    async edituser(Author: any, tochange: any) { // change any eh
        if(!await this.checkuser(Author)) return console.error(new Error("Такой юзер не существует!"))
        await appDataSource.getRepository(User).update({id:Author.user.id}, tochange)
    }
}