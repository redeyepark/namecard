import type { CardData } from '@/types/card';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `지원하지 않는 파일 형식입니다. (${ALLOWED_IMAGE_TYPES.map(t => t.split('/')[1]).join(', ')} 만 가능)`,
    };
  }
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `파일 크기가 5MB를 초과합니다. (현재: ${(file.size / 1024 / 1024).toFixed(1)}MB)`,
    };
  }
  return { valid: true };
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function validateWizardStep(
  step: number,
  card: CardData
): { valid: boolean; error?: string } {
  if (step === 1) {
    if (!card.front.displayName || card.front.displayName.trim() === '') {
      return { valid: false, error: '필수 입력 항목입니다' };
    }
  }
  return { valid: true };
}
