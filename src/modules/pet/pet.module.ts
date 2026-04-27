import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { PetService } from "./pet.service";
import { PetController } from "./pet.controller";

@Module({
    imports: [PrismaModule],
    providers: [PetService],
    controllers: [PetController],
    exports: [PetService]
})
export class PetModule { }