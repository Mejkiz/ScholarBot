import { Entity, ObjectId, ObjectIdColumn, Column } from "typeorm"

@Entity('Homeworks')
export class Homework {

    @ObjectIdColumn()
    _id: ObjectId | undefined 

    @Column()
    id: Number

    @Column()
    schoolId: Number

    @Column()
    editorId: Number

    @Column()
    item: String

    @Column()
    text: String

    @Column()
    date: Date
}