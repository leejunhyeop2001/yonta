export type TrustDashboardData = {
  mannerTemp: number;
  trustLevel: string;
  trustLevelLabel: string;
  suspended: boolean;
  suspendedUntil: string | null;
  totalReviewsReceived: number;
  averageRatingReceived: number | null;
  totalPartiesJoined: number;
  noShowCount: number;
  recentReviewsReceived: {
    id: string;
    rating: number;
    comment: string | null;
    reviewerAlias: string;
  }[];
};

export type HistoryParty = {
  id: string;
  departureTime: string;
  pickupName: string;
  destinationName: string;
  currentCount: number;
  maxCount: number;
};

export type HistoryMember = {
  userId: string;
  alias: string;
  isHost: boolean;
  reviewedByMe: boolean;
  noShowReportedByMe: boolean;
};

export type HistoryItem = {
  party: HistoryParty;
  reviewed: boolean;
  myRating: number | null;
  receivedReviews: {
    id: string;
    rating: number;
    comment: string | null;
    reviewerAlias: string;
  }[];
  otherMembers: HistoryMember[];
};
