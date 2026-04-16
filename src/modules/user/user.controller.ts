import { Body, Controller, Post } from "@nestjs/common";
import { UserService } from "./user.service";
import { CreateUserDto } from "./dtos/create-user.dto";

@Controller("users")
export class UserController {

    constructor(private readonly userService:UserService){}

    @Post()
    async addUser(@Body()createUserDto:CreateUserDto){
        console.log(createUserDto)
        const data = await this.userService.addUser(createUserDto)

        return data
    }

}