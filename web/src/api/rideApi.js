import api from './axiosInstance';
import {
  buildSearchQuery,
  mapCreateFormToNestDto,
  mapNestDetailToWeb,
  mapNestPartyToWeb,
  mannerTempFromScore,
  passesDirectionFilter,
} from '../lib/partyAdapter';
import { loadFixedPlaces } from '../lib/places';
import { getKstDateString } from '../utils/formatters';

function wrap(data) {
  return { data: { data, message: 'ok' } };
}

let lastSearchContext = {
  direction: 'TO_CITY',
  selectedLocation: 'ALL',
  selectedDate: getKstDateString(),
  selectedSlot: '12:00',
};

export const getAvailableParties = async (params = {}) => {
  const direction =
    params.direction
    ?? (params.departure === 'CAMPUS' ? 'TO_CITY' : params.destination === 'CAMPUS' ? 'TO_CAMPUS' : 'TO_CITY');
  const selectedLocation = params.destination && direction === 'TO_CITY'
    ? params.destination
    : params.departure && direction !== 'TO_CITY'
      ? params.departure
      : 'ALL';

  const selectedDate = params.selectedDate ?? getKstDateString();
  const selectedSlot = params.selectedSlot ?? '12:00';

  lastSearchContext = { direction, selectedLocation, selectedDate, selectedSlot };

  const query = await buildSearchQuery({
    direction,
    selectedLocation,
    selectedDate,
    selectedSlot,
  });

  const res = await api.get('/parties/search', {
    params: {
      startTime: query.startTime,
      pickupLat: query.pickupLat,
      pickupLng: query.pickupLng,
      destinationLat: query.destinationLat,
      destinationLng: query.destinationLng,
      limit: 50,
    },
  });

  const places = await loadFixedPlaces();
  const mapped = await Promise.all(
    (res.data?.parties ?? []).map((p) => mapNestPartyToWeb(p, places)),
  );

  const filtered = mapped.filter((p) => passesDirectionFilter(p, direction, query.campusKey));

  return wrap(filtered);
};

export const getPartyDetail = async (id) => {
  const res = await api.get(`/parties/${id}`);
  const places = await loadFixedPlaces();
  const detail = await mapNestDetailToWeb(res.data, places);
  const members = (res.data.allMembers ?? res.data.members ?? []).map((m) => ({
    userId: m.userId,
    alias: m.alias ?? m.emailMasked,
    isHost: m.isHost ?? false,
  }));
  return wrap({
    ...detail,
    id: res.data.partyId,
    isHost: res.data.isHost ?? false,
    isMember: res.data.isMember ?? false,
    mine: res.data.isMember ?? false,
    canJoin: res.data.canJoin ?? false,
    canLeave: res.data.canLeave ?? false,
    canDissolve: res.data.canDissolve ?? false,
    members,
    anonymousParticipants: members.map((m) => m.alias),
    currentCount: res.data.currentMembers,
    maxCount: res.data.capacity,
    totalTaxiFare: res.data.totalTaxiFare ?? null,
    perPersonFare: res.data.perPersonFare ?? null,
    taxiFareRemainder: res.data.taxiFareRemainder ?? 0,
    canSetTaxiFare: res.data.canSetTaxiFare ?? false,
  });
};

export const setPartyTaxiFare = async (partyId, totalTaxiFare) => {
  const res = await api.patch(`/parties/${partyId}/taxi-fare`, { totalTaxiFare });
  return wrap(res.data);
};

export const createParty = async (form) => {
  const places = await loadFixedPlaces();
  const dto = mapCreateFormToNestDto(form, places);
  const res = await api.post('/parties', dto);
  const mapped = await mapNestPartyToWeb(res.data, places);
  return wrap(mapped);
};

export const joinParty = async (id) => {
  await api.post(`/parties/${id}/join`);
  return wrap({ ok: true });
};

export const leaveParty = async (id) => {
  const res = await api.post(`/parties/${id}/leave`);
  return wrap(res.data);
};

export const dissolveParty = async (id) => {
  const res = await api.post(`/parties/${id}/leave`);
  return wrap(res.data);
};

export const transferHost = async (id, targetUserId) => {
  const res = await api.post(`/parties/${id}/transfer-host`, null, {
    params: { targetUserId },
  });
  return wrap(res.data);
};

export const getMyParties = async () => {
  const res = await api.get('/parties/me');
  const places = await loadFixedPlaces();
  const mapped = await Promise.all(
    (res.data?.parties ?? []).map((p) => mapNestPartyToWeb(p, places)),
  );
  return wrap(mapped);
};

export const getMyPartyHistory = async () => {
  const res = await api.get('/parties/me/history');
  return wrap(res.data?.items ?? []);
};

export const submitPartyReview = async (id, payload) => {
  const res = await api.post(`/parties/${id}/reviews`, payload);
  return wrap(res.data, '파티 평가가 저장되었습니다.');
};

export function setRideSearchContext(ctx) {
  lastSearchContext = { ...lastSearchContext, ...ctx };
}

export function getRideSearchContext() {
  return lastSearchContext;
}
