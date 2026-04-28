import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ServiceService } from './service.service';
import { ServiceController } from './service.controller';
import { CacheModuleConfig } from 'src/common/modules/cache.module';

@Module({
  imports: [PrismaModule],
  providers: [ServiceService],
  controllers: [ServiceController],
  exports: [ServiceService],
})
export class ServiceModule {}
