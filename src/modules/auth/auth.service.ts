import {  SmtpProvider } from "src/common/providers/smtp.provider";
import { CreateUserDto } from "../user/dtos/create-user.dto";
import { UserService } from "../user/user.service";
import { RegisterUserDto } from "./dtos/register-user.dto";
import bcrypt from 'bcrypt'
import {createReadStream} from 'fs'
import { Injectable } from "@nestjs/common";

@Injectable()
export class AuthService {

    constructor(private readonly userService:UserService, private readonly smtpSrevice:SmtpProvider){}

    async registerUser(registerUserDto:RegisterUserDto){

        const hashedPassword = await this.hash(registerUserDto.password)

        const createUserDto:CreateUserDto = {
            fullName:registerUserDto.fullName,
            email:registerUserDto.email,
            password:hashedPassword
        }
  
        const createdUser = await this.userService.addUser(createUserDto)
        this.sendWelcomeMail(createdUser.email)
        return createdUser
    }

    async sendWelcomeMail(to:string){
        const welcomeFileStream = createReadStream(process.cwd()+"/src/templates/welcome.template.html")

        this.smtpSrevice.sendMail({
            to,
            subject:"Welcome to PAWSOME!",
            html:welcomeFileStream
        })
    }

    async hash(data:string){

        return await bcrypt.hash(data, 10)
    }
}