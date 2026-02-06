import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateProgressDto {
  @IsOptional()
  @IsString()
  @Length(1, 64)
  currentStageId?: string;

  @IsOptional()
  @IsString()
  @Length(1, 64)
  completeStageId?: string;
}
