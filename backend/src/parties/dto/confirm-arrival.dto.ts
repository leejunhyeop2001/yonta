import { IsNumber, Max, Min } from 'class-validator';

export class ConfirmArrivalDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  arrivalLat!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  arrivalLng!: number;
}

