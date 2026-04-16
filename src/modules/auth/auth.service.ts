import { CreateUserDto } from "../user/dtos/create-user.dto";
import { UserService } from "../user/user.service";
import { RegisterUserDto } from "./dtos/register-user.dto";
import bcrypt from 'bcrypt'


export class AuthService {

    constructor(private readonly userService:UserService){}

    async registerUser(registerUserDto:RegisterUserDto){

     

        const hashedPassword = await this.hash(registerUserDto.password)

        const createUserDto:CreateUserDto = {
            fullName:registerUserDto.fullName,
            email:registerUserDto.email,
            password:hashedPassword
        }

        const createdUser = await this.userService.addUser(createUserDto)

        return createdUser
        
        
    }

    async hash(data:string){
        return await bcrypt.hash(data, 10)
    }
}