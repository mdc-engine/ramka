import { IsIn, IsString, MinLength } from 'class-validator';

export class ChallengeDto {
  @IsString()
  @MinLength(8)
  phone: string = '';

  @IsIn(['sms'])
  channel = 'sms' as const;
}
