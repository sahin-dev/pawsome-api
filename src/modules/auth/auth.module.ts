import { Module } from "@nestjs/common";
import { UserModule } from "../user/user.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { SmtpProvider } from "src/common/providers/smtp.provider";
import { UserService } from "../user/user.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
    imports: [UserModule, PrismaModule],
    controllers: [AuthController],
    providers: [AuthService, SmtpProvider],
    exports: [AuthService]
})
export class AuthModule {

}