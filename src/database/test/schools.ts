import { Entity, ObjectId, ObjectIdColumn, Column } from "typeorm"

@Entity('Schools')
export class School {

    @Column()
    id: Number

    @Column()
    Name: String

    @Column()
    nametag: String | undefined

    @Column()
    groupId: String | undefined
}