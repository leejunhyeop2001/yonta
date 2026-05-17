import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class CreatePartyDto {
  @Type(() => Date)
  @IsDate()
  startTime!: Date;

  @IsUUID()
  pickupPlaceId!: string;

  @IsUUID()
  destinationPlaceId!: string;

  @IsInt()
  @Min(2)
  @Max(6)
  capacity!: number;

  @IsOptional()
  @IsBoolean()
  preferSameGender?: boolean;

  @IsOptional()
  @IsBoolean()
  preferQuiet?: boolean;
}
