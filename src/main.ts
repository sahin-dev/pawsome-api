import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConsoleLogger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger:new ConsoleLogger(
      {
        logLevels:['warn',"debug", "error", "fatal", "log"]
      }
    ),
  });

  
  app.useGlobalPipes(new ValidationPipe({
    transform:true,
    whitelist:true,
    forbidNonWhitelisted:true,
  //  exceptionFactory: (errors) => {
  //     return new BadRequestException(
  //       errors.map(err => ({
  //         field: err.property,
  //         errors: Object.values(err.constraints || {}),
  //       })),
  //     );
  //   },
    
  }))

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
