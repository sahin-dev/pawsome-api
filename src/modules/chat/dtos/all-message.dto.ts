import { PaginationQueryDto } from "src/common/dtos/pagination-query.dto";
import { SingleMessageDto } from "./single-message.dto";
import { Expose, Type } from "class-transformer";
import { ValidateNested } from "class-validator";

export class AllMessageDto extends PaginationQueryDto {

    @Expose()
    @ValidateNested({ each: true })
    @Type(() => SingleMessageDto)
    messages: SingleMessageDto[]


}