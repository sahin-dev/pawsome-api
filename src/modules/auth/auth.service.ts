import { UserService } from "../user/user.service";
import { RegisterUserDto } from "./dtos/register-user.dto";
import bcrypt from 'bcrypt'


export class AuthService {

    constructor(private readonly userService:UserService){}

    async registerUser(registerUserDto:RegisterUserDto){
        
        
    }

    async hash(data:string){
        return await bcrypt.hash(data, 10)
    }
}