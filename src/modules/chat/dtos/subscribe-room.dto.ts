import { IsNotEmpty, IsNumber, IsOptional } from "class-validator";

export class SubscribeToRoomDto {

    @IsNotEmpty()
    @IsNumber()
    roomId: number
}