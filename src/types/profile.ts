/**
 * User profile types for the community feature (SPEC-COMMUNITY-001).
 */

export type SocialPlatform =
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'email'
  | 'website'
  | 'github'
  | 'youtube'
  | 'twitter';

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
}

export interface UserLink {
  id: string;
  userId: string;
  title: string;
  url: string;
  icon: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;            // UUID, auth.users FK
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  isPublic: boolean;
  socialLinks?: SocialLink[];
  createdAt: string;
  updatedAt: string;
}

export interface ProfilePageData {
  profile: UserProfile;
  cardCount: number;
  totalLikes: number;
  themeDistribution: { theme: string; count: number }[];
  links?: UserLink[];
}
