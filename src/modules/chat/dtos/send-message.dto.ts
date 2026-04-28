import { IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import type{ FileBuffer } from "../types/file-buffer.type";

export class SendMessageDto {

    @IsNumber()
    @IsNotEmpty()
    @IsOptional()
    room_id?:number

    @IsNumber()
    @IsNotEmpty()
    @IsOptional()
    receiver_id?:number


    @IsString()
    @IsNotEmpty()
    @IsOptional()
    message:string

    @IsOptional()
    @IsNotEmpty()
    file:FileBuffer
}