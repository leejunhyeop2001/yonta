/** 서버 `GET /places` 고정 목록과 동일 */
export type FixedPlace = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  pickupOnly?: boolean;
  destOnly?: boolean;
};

export type PartyMessage = {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  displayName: string;
};

export type PartyMembership = PartySummary & {
  role: 'HOST' | 'MEMBER';
  myArrivalStatus: 'PENDING' | 'ARRIVED' | 'NOSHOW';
};

export type PartySummary = {
  partyId: string;
  startTime: string;
  startTimeSlotMs: number;
  capacity: number;
  currentMembers: number;
  availableSlots: number;
  pickupLat: number;
  pickupLng: number;
  destinationLat: number;
  destinationLng: number;
  pickupName: string;
  destinationName: string;
  preferSameGender: boolean;
  preferQuiet: boolean;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
};

export type UserProfile = {
  hasPassword?: boolean;
  id: string;
  email: string;
  fullName: string | null;
  gender: 'UNSPECIFIED' | 'MALE' | 'FEMALE';
  prefersQuiet: boolean;
  mannerTemperature: number;
  verifiedAt: string | null;
};

export type PartyDetail = {
  partyId: string;
  startTime: string;
  startTimeSlotMs: number;
  capacity: number;
  currentMembers: number;
  availableSlots: number;
  pickupLat: number;
  pickupLng: number;
  destinationLat: number;
  destinationLng: number;
  pickupName: string;
  destinationName: string;
  preferSameGender: boolean;
  preferQuiet: boolean;
  status: string;
  host: {
    id: string;
    emailMasked: string;
    gender: string;
    mannerTemperature: number;
  };
  members: {
    userId: string;
    role: string;
    arrivalStatus: string;
    emailMasked: string;
    gender: string;
  }[];
  isHost?: boolean;
  isMember?: boolean;
  totalTaxiFare?: number | null;
  perPersonFare?: number | null;
  taxiFareRemainder?: number;
  canSetTaxiFare?: boolean;
};
