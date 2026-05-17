import api from '../api/axiosInstance';

/** @type {import('./partyAdapter').FixedPlace[] | null} */
let cachedPlaces = null;

const LEGACY_KEY_BY_LABEL = {
  '연세대 정문': 'CAMPUS',
  '원주역 버스정류장': 'WONJU_STATION',
  '고속버스터미널': 'TERMINAL',
  '고속버스터미널 앞 스타벅스': 'TERMINAL',
  '흥업 사거리 버스정류장': 'HEUNGEOP',
  '무실동 롯데시네마 버스정류장': 'WONJU_DOWNTOWN',
  '현대아파트(CU)': 'WONJU_DOWNTOWN',
  '청솔아파트(GS25)': 'WONJU_DOWNTOWN',
  '학교 정문 세븐일레븐 앞 버스정류장': 'CAMPUS',
  '연세플라자 앞 버스정류장': 'CAMPUS',
  '학생회관': 'CAMPUS',
  '창조관': 'CAMPUS',
};

export function legacyKeyForPlace(place) {
  if (!place) return 'OTHER';
  return LEGACY_KEY_BY_LABEL[place.label] ?? place.id;
}

export function isCampusPlace(place) {
  return legacyKeyForPlace(place) === 'CAMPUS';
}

export async function loadFixedPlaces() {
  if (cachedPlaces) return cachedPlaces;
  const { data } = await api.get('/places');
  cachedPlaces = data?.places ?? data ?? [];
  return cachedPlaces;
}

export function getCachedPlaces() {
  return cachedPlaces ?? [];
}

export function getCampusPlace(places) {
  return (
    places.find((p) => p.label === '연세대 정문')
    ?? places.find((p) => isCampusPlace(p))
    ?? places[0]
  );
}

export function findPlaceByLegacyKey(places, key) {
  if (key === 'ALL') return null;
  if (key === 'CAMPUS') return getCampusPlace(places);
  const found = places.find((p) => legacyKeyForPlace(p) === key);
  return found ?? null;
}

export function findPlaceById(places, id) {
  return places.find((p) => p.id === id) ?? null;
}

export function buildLocationFilters(places) {
  const campus = getCampusPlace(places);
  const seen = new Set(['ALL']);
  const items = [{ key: 'ALL', label: '전체', icon: '📍', placeId: null }];

  for (const p of places) {
    const key = legacyKeyForPlace(p);
    if (seen.has(key) || isCampusPlace(p)) continue;
    seen.add(key);
    items.push({
      key,
      label: p.label.replace(/ 버스정류장$/, ''),
      icon: key === 'WONJU_STATION' ? '🚉' : key === 'TERMINAL' ? '🚌' : '📍',
      placeId: p.id,
    });
  }

  if (campus) {
    items.push({ key: 'CAMPUS', label: '미래캠퍼스', icon: '🏫', placeId: campus.id });
  }

  return items;
}
