import { Entity, ObjectId, ObjectIdColumn, Column } from "typeorm"

@Entity('Bells')
export class Bell {

    @ObjectIdColumn()
    _id: ObjectId | undefined

    @Column()
    id: Number  

    @Column()
    schoolId: Number 

    @Column()
    num: Number

    @Column()
    interval: String | undefined
    
    @Column()
    isEmpty: Boolean
}