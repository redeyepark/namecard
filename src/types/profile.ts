/**
 * User profile types for the community feature (SPEC-COMMUNITY-001).
 */

export interface UserProfile {
  id: string;            // UUID, auth.users FK
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProfilePageData {
  profile: UserProfile;
  cardCount: number;
  totalLikes: number;
  themeDistribution: { theme: string; count: number }[];
}
