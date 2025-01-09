import { User } from "../entities/user";
import { appDataSource } from "../db";
import { User as IUser } from "grammy/types";
import { School } from "../entities/school";

export class DBFunc {
    // User
    async getUserById(userId: number) {
        return await appDataSource.getRepository(User).findOneBy({ id: userId })
    }

    async createuser(Author: IUser, role: string, schoolId: Number) {
        if (await this.checkuser(Author)) return console.error(new Error("Такой юзер уже существует!"))
        let user = new User()
        user = { _id: undefined, firstName: Author.first_name, lastName: Author?.last_name || undefined, id: Author.id, nametag: Author?.username || undefined, role: role, schoolId }
        await appDataSource.getRepository(User).save(user)
    }

    async checkuser(Author: IUser) {
        return await this.getUserById(Author.id) != null ? true : false
    }

    async edituser(Author: IUser, tochange: any) {
        if (!await this.checkuser(Author)) return console.error(new Error("Такой юзер не существует!"))
        await appDataSource.getRepository(User).update({ id: Author.id }, tochange)
    }

    //School 

    async createSchool(name: string | undefined, nametag: String | undefined, groupId: Number | undefined) {
        let school = new School()
        school = { _id: undefined, id: (await this.getSchools()).length + 1, Name: name, nametag, groupId }
        await appDataSource.getRepository(School).save(school)
    }

    async getSchools() {
        return await appDataSource.getRepository(School).find()
    }

    async getSchoolById(id: Number) {
        return await appDataSource.getRepository(School).findOneBy({ id })
    }

    async editSchool() {

    }
}