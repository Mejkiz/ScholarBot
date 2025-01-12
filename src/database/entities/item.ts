import { Entity, ObjectId, ObjectIdColumn, Column } from "typeorm"

@Entity('Items')
export class Item {

    @ObjectIdColumn()
    _id: ObjectId | undefined

    @Column()
    id: Number  | undefined

    @Column()
    schoolId: Number | undefined

    @Column()
    editorId: Number | undefined

    @Column()
    Name: String 
    
}