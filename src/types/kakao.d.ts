/**
 * TypeScript type declarations for the Kakao JavaScript SDK.
 * @see https://developers.kakao.com/docs/latest/en/message/js-link
 */

interface KakaoShareLink {
  webUrl?: string;
  mobileWebUrl?: string;
}

interface KakaoShareContent {
  title: string;
  description?: string;
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  link: KakaoShareLink;
}

interface KakaoShareButton {
  title: string;
  link: KakaoShareLink;
}

interface KakaoFeedSettings {
  objectType: 'feed';
  content: KakaoShareContent;
  buttons?: KakaoShareButton[];
  buttonTitle?: string;
}

interface KakaoShareModule {
  sendDefault(settings: KakaoFeedSettings): void;
}

interface KakaoStatic {
  init(appKey: string): void;
  isInitialized(): boolean;
  Share: KakaoShareModule;
}

interface Window {
  Kakao?: KakaoStatic;
}
