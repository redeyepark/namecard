export interface Survey {
  id: string;
  authorId: string;
  question: string;
  selectMode: 'single' | 'multi';
  hashtags: string[];
  isOfficial: boolean;
  totalVotes: number;
  closesAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  options: SurveyOption[];
  isClosed: boolean;
}

export interface SurveyOption {
  id: string;
  label: string;
  position: number;
  voteCount: number;
}

export interface SurveyDetail extends Survey {
  userVotes: string[];
  hasVoted: boolean;
}

export interface CreateSurveyInput {
  question: string;
  options: string[];
  selectMode: 'single' | 'multi';
  hashtags?: string[];
  closesAt?: string;
}

export interface VoteInput {
  optionIds: string[];
}

export interface SurveyListResponse {
  data: Survey[];
  nextCursor: string | null;
  hasMore: boolean;
}
