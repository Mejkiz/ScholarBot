import { Entity, ObjectId, ObjectIdColumn, Column } from "typeorm"

@Entity('Lessons')
export class Lesson {

    @ObjectIdColumn()
    _id: ObjectId | undefined

    @Column()
    id: Number  

    @Column()
    itemId: Number | null

    @Column()
    schoolId: Number 

    @Column()
    dayId: Number

    @Column()
    num: Number
    
    @Column()
    isEmpty: Boolean
}