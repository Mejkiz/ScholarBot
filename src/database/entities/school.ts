import { Entity, ObjectId, ObjectIdColumn, Column } from "typeorm"

@Entity('Schools')
export class School {

    @ObjectIdColumn()
    _id: ObjectId | undefined

    @Column()
    id: Number | undefined

    @Column()
    Name: String | undefined

    @Column()
    nametag: String | undefined

    @Column()
    groupId: Number | undefined
}