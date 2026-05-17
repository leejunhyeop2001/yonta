import {
  findPlaceById,
  findPlaceByLegacyKey,
  getCampusPlace,
  legacyKeyForPlace,
  loadFixedPlaces,
} from './places';

export function mannerTempFromScore(score) {
  const n = Number(score ?? 100);
  return 36.5 + (n - 100) * 0.05;
}

function mapStatus(nestStatus, currentMembers, capacity) {
  if (nestStatus === 'CANCELLED') return 'SETTLED';
  if (nestStatus === 'COMPLETED') return 'SETTLED';
  if (nestStatus === 'ACTIVE') return 'DEPARTED';
  if (currentMembers >= capacity) return 'FULL';
  return 'RECRUITING';
}

function genderOptionFromParty(party) {
  if (party.preferSameGender) {
    if (party.host?.gender === 'MALE') return 'MALE_ONLY';
    if (party.host?.gender === 'FEMALE') return 'FEMALE_ONLY';
    return 'MALE_ONLY';
  }
  return 'ANY';
}

export async function mapNestPartyToWeb(party, places = null) {
  const list = places ?? (await loadFixedPlaces());
  const pickup = list.find(
    (p) => Math.abs(p.lat - party.pickupLat) < 0.0001 && Math.abs(p.lng - party.pickupLng) < 0.0001,
  );
  const dest = list.find(
    (p) => Math.abs(p.lat - party.destinationLat) < 0.0001 && Math.abs(p.lng - party.destinationLng) < 0.0001,
  );

  const departure = pickup ? legacyKeyForPlace(pickup) : 'OTHER';
  const destination = dest ? legacyKeyForPlace(dest) : 'OTHER';
  const startIso =
    party.startTime instanceof Date ? party.startTime.toISOString() : String(party.startTime);

  return {
    id: party.partyId ?? party.id,
    departure,
    destination,
    pickupName: party.pickupName || pickup?.label || '',
    destinationName: party.destinationName || dest?.label || '',
    departureTime: startIso,
    currentCount: party.currentMembers ?? 0,
    maxCount: party.capacity ?? 4,
    genderOption: genderOptionFromParty(party),
    rideOptions: party.preferQuiet ? ['QUIET'] : [],
    status: mapStatus(party.status, party.currentMembers ?? 0, party.capacity ?? 4),
    host: {
      mannerTemp: mannerTempFromScore(party.host?.mannerTemperature),
    },
    participants: [],
    anonymousParticipants: [],
    preferSameGender: Boolean(party.preferSameGender),
    preferQuiet: Boolean(party.preferQuiet),
    nestStatus: party.status,
    role: party.role,
  };
}

export async function mapNestDetailToWeb(detail, places = null) {
  const base = await mapNestPartyToWeb(detail, places);
  const members = (detail.members ?? []).map((m, i) => ({
    id: m.userId,
    userId: m.userId,
    name: m.emailMasked?.split('@')[0] ?? `멤버${i + 1}`,
    alias: m.emailMasked,
    gender: m.gender,
    arrivalStatus: m.arrivalStatus,
  }));

  return {
    ...base,
    host: {
      id: detail.host.id,
      mannerTemp: mannerTempFromScore(detail.host.mannerTemperature),
      gender: detail.host.gender,
    },
    participants: members,
    isHost: false,
    isMember: false,
    canJoin: detail.status === 'PENDING' && (detail.availableSlots ?? 0) > 0,
    canLeave: false,
    canDissolve: false,
  };
}

export async function buildSearchQuery({ direction, selectedLocation, selectedDate, selectedSlot }) {
  const places = await loadFixedPlaces();
  const campus = getCampusPlace(places);

  let pickupPlace;
  let destPlace;

  if (direction === 'TO_CITY') {
    pickupPlace = campus;
    destPlace =
      selectedLocation === 'ALL'
        ? findPlaceByLegacyKey(places, 'WONJU_STATION') ?? campus
        : findPlaceByLegacyKey(places, selectedLocation);
  } else {
    destPlace = campus;
    pickupPlace =
      selectedLocation === 'ALL'
        ? findPlaceByLegacyKey(places, 'WONJU_STATION') ?? campus
        : findPlaceByLegacyKey(places, selectedLocation);
  }

  if (!pickupPlace || !destPlace) {
    throw new Error('장소 정보를 불러오지 못했습니다.');
  }

  const timePart = selectedSlot ?? '12:00';
  const startTime = new Date(`${selectedDate}T${timePart}:00`);

  return {
    startTime: startTime.toISOString(),
    pickupLat: pickupPlace.lat,
    pickupLng: pickupPlace.lng,
    destinationLat: destPlace.lat,
    destinationLng: destPlace.lng,
    campusKey: legacyKeyForPlace(campus),
    pickupPlace,
    destPlace,
  };
}

export function passesDirectionFilter(party, direction, campusKey = 'CAMPUS') {
  if (direction === 'TO_CITY') return party.departure === campusKey;
  return party.destination === campusKey;
}

export function mapCreateFormToNestDto(form, places) {
  const pickup = findPlaceByLegacyKey(places, form.departure)
    ?? findPlaceById(places, form.departure);
  const dest = findPlaceByLegacyKey(places, form.destination)
    ?? findPlaceById(places, form.destination);

  if (!pickup || !dest) {
    throw new Error('출발지/도착지를 선택해주세요.');
  }

  const startTime =
    typeof form.departureTime === 'string' && form.departureTime.endsWith('Z')
      ? form.departureTime
      : new Date(form.departureTime).toISOString();

  return {
    startTime,
    pickupPlaceId: pickup.id,
    destinationPlaceId: dest.id,
    capacity: form.maxCount,
    preferSameGender: form.genderOption === 'MALE_ONLY' || form.genderOption === 'FEMALE_ONLY',
    preferQuiet: (form.rideOptions ?? []).includes('QUIET'),
  };
}
