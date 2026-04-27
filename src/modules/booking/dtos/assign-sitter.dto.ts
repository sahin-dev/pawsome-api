import {
  IsNumber,
  IsNotEmpty,
  Min,
} from 'class-validator';

export class AssignSitterDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  sitterId: number;
}
