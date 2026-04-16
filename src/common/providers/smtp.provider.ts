import { Inject, Injectable, Logger } from "@nestjs/common";
import type { ConfigType } from "@nestjs/config";
import nodemailer,{Transporter} from 'nodemailer'
import smpConfigToken,{smtpConfig} from "src/config/smtp.config";

@Injectable()
export class SmtpProvider {
    private readonly transporter:Transporter
    private readonly logger = new Logger(SmtpProvider.name)

    constructor( @Inject(smpConfigToken.KEY)private readonly smtpConfiguration:ConfigType<typeof smtpConfig>){
        try{
            this.transporter = nodemailer.createTransport({
            host:this.smtpConfiguration.host,
            port:this.smtpConfiguration.port,
            auth:{
                user:this.smtpConfiguration.user,
                pass:this.smtpConfiguration.password
            }
        })
        this.transporter.verify()
        this.logger.log("Smtp transporter verified")
        } catch(err){
            this.logger.log("smtp transporter connection failled!")
        }
        
    }



    
}