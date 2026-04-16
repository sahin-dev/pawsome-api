import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserDto } from "./dtos/create-user.dto";
import { UserRole } from "generated/prisma/enums";

@Injectable()
export class UserService {

    constructor(private readonly prismaService:PrismaService){}
    
    async addUser(createUserDto:CreateUserDto){
     
        const data = await this.prismaService.user.create({
            data:{...createUserDto, role:UserRole.USER}
        })

        return data
    }
}