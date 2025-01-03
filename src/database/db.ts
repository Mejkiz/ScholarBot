import { DataSource } from "typeorm"
import { config } from "../config";
import { User } from "./test/user";
import { School } from "./test/schools";
import { Group } from "./test/groups";

export const appDataSource = new DataSource({
    type: "mongodb",
    url: config.auth.mongo.url,
    database: config.auth.mongo.database,
    entities: [User, School, Group]
})

export class DataBase {
    async connect() {
        await appDataSource.initialize()
        console.log("DataBase Initializited")
    }
}