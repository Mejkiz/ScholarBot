import { Entity, ObjectId, ObjectIdColumn, Column } from "typeorm"

@Entity('Users')
export class User {
    
    @ObjectIdColumn()
    _id: ObjectId | undefined

    @Column()
    id: Number

    @Column()
    firstName: String

    @Column()
    lastName: String | undefined

    @Column()
    nametag: String | undefined

    @Column()
    role: String

    @Column()
    schoolId: Number
}