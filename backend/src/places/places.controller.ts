import { Controller, Get } from '@nestjs/common';
import { FIXED_PLACES } from './fixed-places';

@Controller('places')
export class PlacesController {
  /** 고정 장소 목록 (로그인 없이 조회 가능) */
  @Get()
  list() {
    return { places: [...FIXED_PLACES] };
  }
}
