import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './modules/prisma/prisma.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { PetModule } from './modules/pet/pet.module';
import { ServiceModule } from './modules/service/service.module';
import { BookingModule } from './modules/booking/booking.module';
import { FileUploadModule } from './modules/file-upload/file-upload.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModuleConfig } from './common/modules/cache.module';
import dbConfig from './config/db.config';
import smtpConfig from './config/smtp.config';
import { RolesGuard } from './common/guards/roles.guard';
import { APP_GUARD } from '@nestjs/core';
import { JwtGuard } from './modules/auth/guards/jwt.guard';
import jwtConfig from './config/jwt.config';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    ConfigModule.forRoot({ load: [dbConfig, smtpConfig, jwtConfig], isGlobal: true }),
    JwtModule.registerAsync({
        imports: [ConfigModule],
        inject: [ConfigService],   
        useFactory: async (configService: ConfigService) => {
  const secret = configService.get<string>('jwt.jwt_secret');
  const expires = configService.get<any>('jwt.expires_in');

  console.log('SECRET:', secret);
  console.log('EXPIRES:', expires);

  return {
    secret,
    signOptions: { expiresIn: expires },
    global:true
  }}}),
    CacheModuleConfig,
    PrismaModule,
    AuthModule,
    UserModule,
    PetModule,
    ServiceModule,
    BookingModule,
    FileUploadModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ]
})
export class AppModule {}
