import { Injectable, Logger } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "generated/prisma/client";


@Injectable()
export class PrismaService extends PrismaClient {
    private readonly logger = new Logger(PrismaService.name)

    constructor(){
             
        const adapter = new PrismaPg({user:"postgres",password:"sah#1122SIR", database:"pawsome"})
        super({adapter})

        this.logger.log("Database connected successfully!")
    }

    
}