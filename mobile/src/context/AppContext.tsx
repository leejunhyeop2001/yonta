import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { apiFetch, getSocketBaseUrl } from '../lib/api';
import { decodeJwtPayload, isTokenExpired } from '../lib/jwt';
import { formatKST, toNextSlotStartMs, toSlotStartMs } from '../lib/slots';
import type { FixedPlace, PartyMembership, PartySummary, UserProfile } from '../lib/types';

type AppContextValue = {
  email: string;
  setEmail: (v: string) => void;
  otp: string;
  setOtp: (v: string) => void;
  accessToken: string | null;
  userEmail: string | null;
  userId: string | null;
  profile: UserProfile | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (body: Partial<Pick<UserProfile, 'fullName' | 'gender' | 'prefersQuiet'>>) => Promise<void>;
  createPreferSameGender: boolean;
  setCreatePreferSameGender: (v: boolean) => void;
  createPreferQuiet: boolean;
  setCreatePreferQuiet: (v: boolean) => void;
  socketConnected: boolean;
  loading: boolean;
  message: string | null;
  setMessage: (v: string | null) => void;
  slotMs: number;
  setSlotMs: React.Dispatch<React.SetStateAction<number>>;
  fixedPlaces: FixedPlace[];
  refreshFixedPlaces: () => Promise<void>;
  routePickupPlaceId: string | null;
  setRoutePickupPlaceId: (v: string | null) => void;
  routeDestPlaceId: string | null;
  setRouteDestPlaceId: (v: string | null) => void;
  capacity: string;
  setCapacity: (v: string) => void;
  parties: PartySummary[];
  myParties: PartyMembership[];
  refreshMyParties: () => Promise<void>;
  activePartyForArrival: PartyMembership | null;
  selectedPartyId: string | null;
  setSelectedPartyId: (v: string | null) => void;
  loginMode: 'password' | 'otp';
  setLoginMode: (v: 'password' | 'otp') => void;
  needsPasswordSetup: boolean;
  requestOtp: () => Promise<void>;
  verifyOtp: () => Promise<void>;
  loginWithPassword: (password: string) => Promise<void>;
  setAccountPassword: (password: string, confirm: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshParties: () => Promise<void>;
  createParty: () => Promise<void>;
  joinParty: (partyId: string) => Promise<boolean>;
  leaveParty: (partyId: string) => Promise<boolean>;
  confirmArrival: () => Promise<void>;
  formatKST: typeof formatKST;
  toSlotStartMs: typeof toSlotStartMs;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState('2020000000@yonsei.ac.kr');
  const [otp, setOtp] = useState('');
  const [loginMode, setLoginMode] = useState<'password' | 'otp'>('otp');
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [slotMs, setSlotMs] = useState(() => toNextSlotStartMs(Date.now()));
  const [fixedPlaces, setFixedPlaces] = useState<FixedPlace[]>([]);
  const [routePickupPlaceId, setRoutePickupPlaceId] = useState<string | null>(null);
  const [routeDestPlaceId, setRouteDestPlaceId] = useState<string | null>(null);
  const [capacity, setCapacity] = useState('4');
  const [parties, setParties] = useState<PartySummary[]>([]);
  const [myParties, setMyParties] = useState<PartyMembership[]>([]);
  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [createPreferSameGender, setCreatePreferSameGender] = useState(false);
  const [createPreferQuiet, setCreatePreferQuiet] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const slotMsRef = useRef(slotMs);
  slotMsRef.current = slotMs;

  const jwtPayload = useMemo(() => (accessToken ? decodeJwtPayload(accessToken) : {}), [accessToken]);
  const userEmail = jwtPayload.email ?? null;
  const userId = jwtPayload.sub ?? null;

  const activePartyForArrival = useMemo((): PartyMembership | null => {
    const bySelected = myParties.find((p) => p.partyId === selectedPartyId);
    if (bySelected) return bySelected;
    return myParties[0] ?? null;
  }, [myParties, selectedPartyId]);

  useEffect(() => {
    AsyncStorage.getItem('accessToken')
      .then((v) => {
        if (v && isTokenExpired(v)) {
          void AsyncStorage.removeItem('accessToken');
          setAccessToken(null);
          setMessage('로그인이 만료되었습니다. 다시 로그인해 주세요.');
          return;
        }
        setAccessToken(v);
      })
      .catch(() => {});
  }, []);

  const applyAuthResult = useCallback(
    async (token: string, requiresPasswordSetup: boolean) => {
      await AsyncStorage.setItem('accessToken', token);
      setAccessToken(token);
      setNeedsPasswordSetup(requiresPasswordSetup);
      setMessage(null);
    },
    [],
  );

  const refreshFixedPlaces = useCallback(async () => {
    try {
      const res = await apiFetch<{ places: FixedPlace[] }>('/places');
      setFixedPlaces(res.places);
    } catch {
      setFixedPlaces([]);
    }
  }, []);

  const refreshParties = useCallback(async () => {
    if (!accessToken) return;
    const pickup = fixedPlaces.find((p) => p.id === routePickupPlaceId);
    const dest = fixedPlaces.find((p) => p.id === routeDestPlaceId);
    if (!pickup || !dest) {
      setParties([]);
      return;
    }
    try {
      const res = await apiFetch<{ parties: PartySummary[] }>('/parties/search', {
        token: accessToken,
        query: {
          startTime: new Date(slotMs).toISOString(),
          pickupLat: pickup.lat,
          pickupLng: pickup.lng,
          destinationLat: dest.lat,
          destinationLng: dest.lng,
          limit: 30,
        },
      });
      setParties(res.parties);
    } catch (e) {
      setMessage((e as Error).message);
    }
  }, [accessToken, slotMs, fixedPlaces, routePickupPlaceId, routeDestPlaceId]);

  const refreshMyParties = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await apiFetch<{ parties: PartyMembership[] }>('/parties/me', { token: accessToken });
      setMyParties(res.parties);
    } catch {
      setMyParties([]);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken || isTokenExpired(accessToken)) {
      if (accessToken && isTokenExpired(accessToken)) {
        void AsyncStorage.removeItem('accessToken');
        setAccessToken(null);
        setMessage('로그인이 만료되었습니다. 다시 OTP 로그인해 주세요.');
      }
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocketConnected(false);
      return;
    }

    const SOCKET_BASE_URL = getSocketBaseUrl();
    if (!SOCKET_BASE_URL) return;

    const s = io(SOCKET_BASE_URL, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = s;

    const onConnect = () => {
      setSocketConnected(true);
      s.emit('join-slot', { startTimeSlotMs: slotMsRef.current });
    };
    const onDisconnect = () => setSocketConnected(false);
    const onConnectError = (err: Error) => {
      setSocketConnected(false);
      const msg = err?.message ?? '';
      if (msg.toLowerCase().includes('jwt') || msg.toLowerCase().includes('expired')) {
        void logout();
        setMessage('로그인이 만료되었습니다. 다시 OTP 로그인해 주세요.');
      }
    };

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('connect_error', onConnectError);
    const onPartyEvent = () => {
      void refreshParties();
      void refreshMyParties();
    };
    s.on('PARTY_CREATED', onPartyEvent);
    s.on('PARTY_JOINED', onPartyEvent);
    s.on('PARTY_DEPARTED', onPartyEvent);
    s.on('PARTY_CANCELLED', onPartyEvent);

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('connect_error', onConnectError);
      s.off('PARTY_CREATED', onPartyEvent);
      s.off('PARTY_JOINED', onPartyEvent);
      s.off('PARTY_DEPARTED', onPartyEvent);
      s.off('PARTY_CANCELLED', onPartyEvent);
      s.disconnect();
      socketRef.current = null;
    };
    // slotMs handled in separate effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, refreshParties, refreshMyParties]);

  useEffect(() => {
    const s = socketRef.current;
    if (!s?.connected) return;
    s.emit('join-slot', { startTimeSlotMs: slotMs });
  }, [slotMs]);

  useEffect(() => {
    if (!accessToken) return;
    void refreshParties();
  }, [accessToken, slotMs, refreshParties]);

  useEffect(() => {
    void refreshMyParties();
  }, [accessToken, refreshMyParties]);

  useEffect(() => {
    void refreshFixedPlaces();
  }, [refreshFixedPlaces]);

  useEffect(() => {
    if (routePickupPlaceId) {
      const p = fixedPlaces.find((x) => x.id === routePickupPlaceId);
      if (!p || p.destOnly) setRoutePickupPlaceId(null);
    }
    if (routeDestPlaceId) {
      const d = fixedPlaces.find((x) => x.id === routeDestPlaceId);
      if (!d || d.pickupOnly) setRouteDestPlaceId(null);
    }
  }, [fixedPlaces, routePickupPlaceId, routeDestPlaceId]);

  const refreshProfile = useCallback(async () => {
    if (!accessToken) {
      setProfile(null);
      return;
    }
    try {
      const p = await apiFetch<UserProfile>('/users/me', { token: accessToken });
      setProfile(p);
      setNeedsPasswordSetup(!p.hasPassword);
    } catch {
      setProfile(null);
    }
  }, [accessToken]);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  const updateProfile = useCallback(
    async (body: Partial<Pick<UserProfile, 'fullName' | 'gender' | 'prefersQuiet'>>) => {
      if (!accessToken) return;
      const p = await apiFetch<UserProfile>('/users/me', { method: 'PATCH', token: accessToken, body });
      setProfile(p);
    },
    [accessToken],
  );

  const requestOtp = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await apiFetch<{ delivery?: 'email' | 'debug' }>('/auth/request-otp', {
        method: 'POST',
        body: { email },
      });
      if (res.delivery === 'debug') {
        setMessage('OTP 요청 완료(개발 모드). 서버 터미널 로그에서 인증번호를 확인하세요.');
      } else {
        setMessage(
          '인증번호를 발송했습니다. 연세 메일은 스팸함·지연(수 분)이 있을 수 있어요. 안 오면 backend/.env 에 OTP_ECHO_LOG=true 후 터미널을 확인하세요.',
        );
      }
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const data = await apiFetch<{
        accessToken: string;
        requiresPasswordSetup?: boolean;
      }>('/auth/verify-otp', {
        method: 'POST',
        body: { email, otp },
      });
      await applyAuthResult(data.accessToken, Boolean(data.requiresPasswordSetup));
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const loginWithPassword = async (password: string) => {
    setLoading(true);
    setMessage(null);
    try {
      const data = await apiFetch<{
        accessToken: string;
        requiresPasswordSetup?: boolean;
      }>('/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      await applyAuthResult(data.accessToken, Boolean(data.requiresPasswordSetup));
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const setAccountPassword = async (newPassword: string, confirm: string) => {
    if (newPassword.length < 8) {
      setMessage('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    if (newPassword !== confirm) {
      setMessage('비밀번호 확인이 일치하지 않습니다.');
      return;
    }
    if (!accessToken) return;
    setLoading(true);
    setMessage(null);
    try {
      await apiFetch('/auth/set-password', {
        method: 'POST',
        token: accessToken,
        body: { password: newPassword },
      });
      setNeedsPasswordSetup(false);
      void refreshProfile();
      setMessage('비밀번호가 설정되었습니다.');
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('accessToken');
    setAccessToken(null);
    setNeedsPasswordSetup(false);
    setSocketConnected(false);
    setSelectedPartyId(null);
    setParties([]);
    setMyParties([]);
    setRoutePickupPlaceId(null);
    setRouteDestPlaceId(null);
    setProfile(null);
    setMessage(null);
  };

  const createParty = async () => {
    if (!accessToken) return;
    if (!routePickupPlaceId || !routeDestPlaceId) {
      setMessage('출발·도착 장소를 모두 선택해 주세요.');
      return;
    }
    if (routePickupPlaceId === routeDestPlaceId) {
      setMessage('출발과 도착은 서로 다른 장소여야 합니다.');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      // 슬롯에 표시된 시간 그대로를 파티 시작 시간으로 사용
      const startTime = new Date(slotMs).toISOString();
      const created = await apiFetch<PartySummary>('/parties', {
        method: 'POST',
        token: accessToken,
        body: {
          startTime,
          pickupPlaceId: routePickupPlaceId,
          destinationPlaceId: routeDestPlaceId,
          capacity: Number(capacity),
          preferSameGender: createPreferSameGender,
          preferQuiet: createPreferQuiet,
        },
      });
      setParties((prev) => [created, ...prev.filter((p) => p.partyId !== created.partyId)]);
      setSelectedPartyId(created.partyId);
      void refreshParties();
      void refreshMyParties();
      setMessage('파티 생성 완료');
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const joinParty = async (partyId: string): Promise<boolean> => {
    if (!accessToken) return false;
    setLoading(true);
    setMessage(null);
    try {
      await apiFetch(`/parties/${partyId}/join`, { method: 'POST', token: accessToken });
      setSelectedPartyId(partyId);
      await refreshParties();
      await refreshMyParties();
      setMessage('파티 참여 완료');
      return true;
    } catch (e) {
      setMessage((e as Error).message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const leaveParty = async (partyId: string): Promise<boolean> => {
    if (!accessToken) return false;
    setLoading(true);
    setMessage(null);
    try {
      const res = await apiFetch<{ outcome?: 'LEFT' | 'CANCELLED' }>(`/parties/${partyId}/leave`, {
        method: 'POST',
        token: accessToken,
      });
      if (selectedPartyId === partyId) setSelectedPartyId(null);
      await refreshMyParties();
      await refreshParties();
      setMessage(res.outcome === 'CANCELLED' ? '파티를 취소했습니다.' : '파티에서 나왔습니다.');
      return true;
    } catch (e) {
      setMessage((e as Error).message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const confirmArrival = async () => {
    const partyId = activePartyForArrival?.partyId ?? selectedPartyId;
    if (!accessToken || !partyId) return;
    setLoading(true);
    setMessage(null);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') throw new Error('위치 권한이 필요합니다.');
      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;
      const res = await apiFetch<{ status?: string }>(`/parties/${partyId}/confirm-arrival`, {
        method: 'POST',
        token: accessToken,
        body: { arrivalLat: latitude, arrivalLng: longitude },
      });
      setMessage(`도착 인증 결과: ${res.status ?? 'OK'}`);
      void refreshMyParties();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const value: AppContextValue = {
    email,
    setEmail,
    otp,
    setOtp,
    accessToken,
    userEmail,
    userId,
    profile,
    refreshProfile,
    updateProfile,
    createPreferSameGender,
    setCreatePreferSameGender,
    createPreferQuiet,
    setCreatePreferQuiet,
    socketConnected,
    loading,
    message,
    setMessage,
    slotMs,
    setSlotMs,
    fixedPlaces,
    refreshFixedPlaces,
    routePickupPlaceId,
    setRoutePickupPlaceId,
    routeDestPlaceId,
    setRouteDestPlaceId,
    capacity,
    setCapacity,
    parties,
    myParties,
    refreshMyParties,
    activePartyForArrival,
    selectedPartyId,
    setSelectedPartyId,
    loginMode,
    setLoginMode,
    needsPasswordSetup,
    requestOtp,
    verifyOtp,
    loginWithPassword,
    setAccountPassword,
    logout,
    refreshParties,
    createParty,
    joinParty,
    leaveParty,
    confirmArrival,
    formatKST,
    toSlotStartMs,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
