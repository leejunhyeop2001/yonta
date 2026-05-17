import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class NoShowReportDto {
  @IsUUID()
  reportedUserId!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(500)
  reason!: string;
}
