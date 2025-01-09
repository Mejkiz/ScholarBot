import { Entity, ObjectId, ObjectIdColumn, Column } from "typeorm"

@Entity('Groups')
export class Group {

    @ObjectIdColumn()
    _id: ObjectId | undefined

    @Column()
    id: Number

    @Column()
    Name: String

    @Column()
    nametag: String | undefined

    @Column()
    schoolId: Number
}