export const LOCATIONS = [
  { key: 'ALL', label: '전체', icon: '📍' },
  { key: 'WONJU_STATION', label: '원주역', icon: '🚉' },
  { key: 'TERMINAL', label: '시외버스터미널', icon: '🚌' },
  { key: 'HEUNGEOP', label: '흥업 사거리', icon: '🏘️' },
  { key: 'CAMPUS', label: '미래캠퍼스', icon: '🏫' },
  { key: 'WONJU_DOWNTOWN', label: '원주 시내', icon: '🏙️' },
  { key: 'ENTERPRISE_CITY', label: '기업도시', icon: '🏢' },
  { key: 'MUNMAK', label: '문막', icon: '🗺️' },
];

export const GENDER_OPTIONS = {
  ANY: { label: '누구나', icon: '👥', color: 'text-gray-500' },
  MALE_ONLY: { label: '남성만', icon: '👨', color: 'text-blue-500' },
  FEMALE_ONLY: { label: '여성만', icon: '👩', color: 'text-pink-500' },
};

export const RIDE_OPTIONS = {
  QUIET: { label: '조용히 가기', icon: '🤫' },
  LUGGAGE: { label: '짐 많아요', icon: '🧳' },
  HURRY: { label: '급해요', icon: '⚡' },
};

export const PARTY_STATUS = {
  RECRUITING: { label: '모집중', color: 'bg-green-100 text-green-700' },
  FULL: { label: '마감', color: 'bg-gray-100 text-gray-500' },
  DEPARTED: { label: '출발', color: 'bg-blue-100 text-blue-600' },
  SETTLED: { label: '정산완료', color: 'bg-purple-100 text-purple-600' },
};

export const DIRECTION = {
  TO_CITY: { label: '학교 → 시내', emoji: '🏫 → 🏙️' },
  TO_CAMPUS: { label: '시내 → 학교', emoji: '🏙️ → 🏫' },
};
