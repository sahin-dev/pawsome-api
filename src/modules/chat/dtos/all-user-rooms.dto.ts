import { Expose, Type } from "class-transformer";
import { RoomDto } from "./room.dto";
import { ValidateNested } from "class-validator";
import { PaginationQueryDto } from "src/common/dtos/pagination-query.dto";

export class AllUserRoomsDto extends PaginationQueryDto{

    @Expose()
    @ValidateNested({ each: true })
    @Type(() => RoomDto)
    rooms:RoomDto[]

    
}