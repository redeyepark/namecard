'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import Script from 'next/script';

// SDK CDN URL (pinned version for stability)
const KAKAO_SDK_URL = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js';

// Timeout duration for SDK loading (milliseconds)
const SDK_LOAD_TIMEOUT_MS = 5000;

interface KakaoContextValue {
  isLoaded: boolean;
  isInitialized: boolean;
  error: string | null;
}

const KakaoContext = createContext<KakaoContextValue>({
  isLoaded: false,
  isInitialized: false,
  error: null,
});

/**
 * Hook to access the Kakao SDK context.
 * Returns loading state, initialization status, and any errors.
 */
export function useKakao(): KakaoContextValue {
  const context = useContext(KakaoContext);
  if (!context) {
    throw new Error('useKakao must be used within a KakaoProvider');
  }
  return context;
}

interface KakaoProviderProps {
  children: ReactNode;
}

/**
 * Provider component that loads and initializes the Kakao JavaScript SDK.
 * If NEXT_PUBLIC_KAKAO_JS_KEY is not set, the provider becomes a no-op
 * and simply renders children without loading the SDK.
 */
export function KakaoProvider({ children }: KakaoProviderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Set up loading timeout when key exists but SDK has not loaded yet
  useEffect(() => {
    if (!kakaoKey || isLoaded) {
      return;
    }

    timeoutRef.current = setTimeout(() => {
      if (!isLoaded) {
        const message = 'Kakao SDK loading timed out after 5 seconds';
        console.error(message);
        setError(message);
      }
    }, SDK_LOAD_TIMEOUT_MS);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [kakaoKey, isLoaded]);

  // Handle successful SDK script load
  const handleLoad = useCallback(() => {
    // Clear the timeout since the script loaded successfully
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setIsLoaded(true);

    try {
      if (window.Kakao && !window.Kakao.isInitialized() && kakaoKey) {
        window.Kakao.init(kakaoKey);
        setIsInitialized(true);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to initialize Kakao SDK';
      console.error('Kakao SDK initialization error:', message);
      setError(message);
    }
  }, [kakaoKey]);

  // Handle SDK script load error
  const handleError = useCallback(() => {
    // Clear the timeout since we already know it failed
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const message = 'Failed to load Kakao SDK script';
    console.error(message);
    setError(message);
  }, []);

  const value: KakaoContextValue = {
    isLoaded,
    isInitialized,
    error,
  };

  // If no Kakao key is configured, skip SDK loading entirely (graceful degradation)
  if (!kakaoKey) {
    return (
      <KakaoContext.Provider value={value}>
        {children}
      </KakaoContext.Provider>
    );
  }

  return (
    <KakaoContext.Provider value={value}>
      <Script
        src={KAKAO_SDK_URL}
        strategy="afterInteractive"
        onLoad={handleLoad}
        onError={handleError}
      />
      {children}
    </KakaoContext.Provider>
  );
}
