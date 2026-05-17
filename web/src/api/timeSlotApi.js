function wrap(data) {
  return Promise.resolve({ data: { data, message: 'ok' } });
}

/** 슬롯은 웹·앱 모두 10분 단위 클라이언트 계산을 사용합니다. */
export const getTimeSlots = () => wrap([]);
