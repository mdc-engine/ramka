import { IsIn, IsString, Length } from 'class-validator';

export class AddMessageDto {
  @IsIn(['therapist', 'client', 'system'])
  role!: 'therapist' | 'client' | 'system';

  @IsString()
  @Length(1, 5000)
  content!: string;
}
