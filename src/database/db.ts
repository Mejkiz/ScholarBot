import { DataSource } from "typeorm"
import { config } from "../config";
import { User } from "./entities/user";
import { School } from "./entities/school";
import { Group } from "./entities/group";
import { Homework } from "./entities/homework";
import { Item } from "./entities/item";
import { Day } from "./entities/day";
import { Lesson } from "./entities/lesson";
import { Bell } from "./entities/bell";

export const appDataSource = new DataSource({
    type: "mongodb",
    url: config.auth.mongo.url,
    database: config.auth.mongo.database,
    entities: [User, School, Group, Homework, Item, Day, Lesson, Bell]
})

export class DataBase {
    async connect() {
        await appDataSource.initialize()
        console.log("DataBase Initializited")
    }
}