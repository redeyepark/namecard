export interface SocialLink {
  platform: 'facebook' | 'instagram' | 'linkedin' | 'email' | 'custom';
  url: string;
  label: string;
}

export interface CardFrontData {
  displayName: string;
  avatarImage: string | null;
  backgroundColor: string;
  textColor: string;
}

export interface CardBackData {
  fullName: string;
  title: string;
  hashtags: string[];
  socialLinks: SocialLink[];
  backgroundColor: string;
  textColor: string;
}

export interface CardData {
  front: CardFrontData;
  back: CardBackData;
}

export type CardSide = 'front' | 'back';
