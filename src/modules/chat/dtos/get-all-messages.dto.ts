import { IsMongoId, IsNotEmpty, IsNumber, IsString } from "class-validator"
import { PaginationQueryDto } from "src/common/dtos/pagination-query.dto"


export class GetAllMessagesDto extends PaginationQueryDto {

    @IsNumber()
    @IsNotEmpty()
    roomId: number

}