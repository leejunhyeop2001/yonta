import { IsInt, Max, Min } from 'class-validator';

export class SetTaxiFareDto {
  /** 총 택시 요금 (원). 0이면 삭제 */
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  totalTaxiFare!: number;
}
