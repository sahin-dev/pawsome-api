import {  Module, OnModuleInit } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';
import { SocketGateway } from './gateway/chat.gateway';
import { UserModule } from '../user/user.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SocketRegistryService } from './services/socket-registry.service';
import { SocketAuthService } from './services/socket-auth.service';

@Module({
    imports:[UserModule, PrismaModule],
    controllers:[ChatController],
    providers:[ChatService, SocketGateway, SocketRegistryService, SocketAuthService],
    exports:[ChatService, SocketGateway, SocketRegistryService, SocketAuthService]
})
export class ChatModule implements OnModuleInit{

    onModuleInit() {
        
    }
}
