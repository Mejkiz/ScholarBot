import { Entity, ObjectId, ObjectIdColumn, Column } from "typeorm"

@Entity('Days')
export class Day {

    @ObjectIdColumn()
    _id: ObjectId | undefined

    @Column()
    id: Number

    @Column()
    schoolId: Number

    @Column()
    dayId: Number

    @Column()
    Name: String

    @Column()
    isStudy: Boolean 
}