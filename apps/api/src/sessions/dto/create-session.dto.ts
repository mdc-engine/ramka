import { IsString, Length } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  @Length(1, 64)
  caseId!: string;
}
