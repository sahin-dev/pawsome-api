import { Module } from "@nestjs/common";
import { UserModule } from "../user/user.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { SmtpProvider } from "src/common/providers/smtp.provider";
import { PrismaModule } from "../prisma/prisma.module";
import { CacheModuleConfig } from "src/common/modules/cache.module";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
    imports: [UserModule, PrismaModule, CacheModuleConfig],
    controllers: [AuthController],
    providers: [AuthService, SmtpProvider, JwtService],
    exports: [AuthService]
})
export class AuthModule {

}