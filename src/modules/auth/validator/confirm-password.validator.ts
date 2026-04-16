import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";

@ValidatorConstraint({name:"confirmPassword", async:false})
export class ConfirmPassword implements ValidatorConstraintInterface {

    validate(confirmPassword: string, validationArguments?: ValidationArguments): Promise<boolean> | boolean {

        const [passwordProperty] = validationArguments?.constraints || []
        const password = validationArguments?.object[passwordProperty] as string
        
        return password === confirmPassword;
    }
    defaultMessage?(validationArguments?: ValidationArguments): string {
        
        return `${validationArguments?.property} must match with ${validationArguments?.constraints[0]}`
    }
    
}