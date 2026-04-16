import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './modules/prisma/prisma.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import dbConfig from './config/db.config';
import smtpConfig from './config/smtp.config';

@Module({
  imports: [ConfigModule.forRoot({load:[dbConfig, smtpConfig], isGlobal:true}), PrismaModule,AuthModule, UserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
