import { Entity, ObjectId, ObjectIdColumn, Column } from "typeorm"

@Entity('Users')
export class User {
    @ObjectIdColumn()
    id: Number

    @Column()
    firstName: String

    @Column()
    lastName: String | undefined

    @Column()
    nametag: String | undefined

    @Column()
    role: String
}