import { Module } from "@nestjs/common";
import { UserModule } from "../user/user.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { SmtpProvider } from "src/common/providers/smtp.provider";

@Module({
    imports:[UserModule],
    controllers:[AuthController],
    providers:[AuthService, SmtpProvider]
})
export class AuthModule {

}