import { DataSource } from "typeorm"
import { config } from "../config";
import { User } from "./entities/user";
import { School } from "./entities/school";
import { Group } from "./entities/group";
import { Homework } from "./entities/homework";
import { Item } from "./entities/item";

export const appDataSource = new DataSource({
    type: "mongodb",
    url: config.auth.mongo.url,
    database: config.auth.mongo.database,
    entities: [User, School, Group, Homework, Item]
})

export class DataBase {
    async connect() {
        await appDataSource.initialize()
        console.log("DataBase Initializited")
    }
}