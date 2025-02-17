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
    itemId: Number

    @Column()
    text: String | null

    @Column()
    date: Number
}