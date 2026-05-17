import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Login: undefined;
  SetPassword: undefined;
  Main: undefined;
};

export type MatchingStackParamList = {
  MatchingList: undefined;
  PartyDetail: { partyId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Matching: NavigatorScreenParams<MatchingStackParamList> | undefined;
  Arrival: undefined;
  Profile: undefined;
};
