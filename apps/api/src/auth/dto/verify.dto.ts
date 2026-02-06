import { IsString, MinLength } from 'class-validator';

export class VerifyDto {
  @IsString()
  @MinLength(8)
  phone: string = '';

  @IsString()
  @MinLength(4)
  code: string = '';
}
