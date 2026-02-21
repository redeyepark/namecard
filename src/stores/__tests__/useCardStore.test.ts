import { describe, it, expect, beforeEach } from 'vitest';
import { useCardStore } from '../useCardStore';
import { validateWizardStep } from '@/lib/validation';

// Reset the store before each test
beforeEach(() => {
  useCardStore.getState().resetCard();
  useCardStore.setState({ activeSide: 'front', wizardStep: 1, wizardCompleted: false });
});

describe('useCardStore', () => {
  it('should have default card data', () => {
    const state = useCardStore.getState();
    expect(state.card.front.displayName).toBe('YOUR NAME');
    expect(state.card.front.backgroundColor).toBe('#b21b3c');
    expect(state.card.back.fullName).toBe('FULL NAME');
    expect(state.activeSide).toBe('front');
  });

  it('should update front data', () => {
    useCardStore.getState().updateFront({ displayName: 'John Doe' });
    const state = useCardStore.getState();
    expect(state.card.front.displayName).toBe('John Doe');
    // Other fields should remain unchanged
    expect(state.card.front.backgroundColor).toBe('#b21b3c');
  });

  it('should update back data', () => {
    useCardStore.getState().updateBack({ fullName: 'Jane Smith', title: 'Developer' });
    const state = useCardStore.getState();
    expect(state.card.back.fullName).toBe('Jane Smith');
    expect(state.card.back.title).toBe('Developer');
  });

  it('should set active side', () => {
    useCardStore.getState().setActiveSide('back');
    expect(useCardStore.getState().activeSide).toBe('back');
  });

  it('should add a social link', () => {
    useCardStore.getState().addSocialLink({
      platform: 'linkedin',
      url: 'https://linkedin.com/in/test',
      label: 'LinkedIn',
    });
    const links = useCardStore.getState().card.back.socialLinks;
    expect(links).toHaveLength(1);
    expect(links[0].platform).toBe('linkedin');
  });

  it('should remove a social link', () => {
    useCardStore.getState().addSocialLink({
      platform: 'linkedin',
      url: 'https://linkedin.com/in/test',
      label: 'LinkedIn',
    });
    useCardStore.getState().addSocialLink({
      platform: 'email',
      url: 'mailto:test@example.com',
      label: 'Email',
    });
    useCardStore.getState().removeSocialLink(0);
    const links = useCardStore.getState().card.back.socialLinks;
    expect(links).toHaveLength(1);
    expect(links[0].platform).toBe('email');
  });

  it('should update a social link', () => {
    useCardStore.getState().addSocialLink({
      platform: 'linkedin',
      url: 'https://linkedin.com/in/old',
      label: 'Old LinkedIn',
    });
    useCardStore.getState().updateSocialLink(0, {
      platform: 'linkedin',
      url: 'https://linkedin.com/in/new',
      label: 'New LinkedIn',
    });
    const links = useCardStore.getState().card.back.socialLinks;
    expect(links[0].url).toBe('https://linkedin.com/in/new');
    expect(links[0].label).toBe('New LinkedIn');
  });

  it('should add a hashtag', () => {
    useCardStore.getState().addHashtag('#NewTag');
    const hashtags = useCardStore.getState().card.back.hashtags;
    expect(hashtags).toContain('#NewTag');
    expect(hashtags).toHaveLength(3); // 2 default + 1 new
  });

  it('should remove a hashtag', () => {
    useCardStore.getState().removeHashtag(0);
    const hashtags = useCardStore.getState().card.back.hashtags;
    expect(hashtags).toHaveLength(1);
    expect(hashtags[0]).toBe('#Keyword2');
  });

  it('should reset card to defaults', () => {
    useCardStore.getState().updateFront({ displayName: 'Changed' });
    useCardStore.getState().updateBack({ fullName: 'Changed' });
    useCardStore.getState().resetCard();
    const state = useCardStore.getState();
    expect(state.card.front.displayName).toBe('YOUR NAME');
    expect(state.card.back.fullName).toBe('FULL NAME');
  });
});

describe('useCardStore - Wizard State', () => {
  it('should have default wizard state', () => {
    const state = useCardStore.getState();
    expect(state.wizardStep).toBe(1);
    expect(state.wizardCompleted).toBe(false);
  });

  it('should set wizard step directly', () => {
    useCardStore.getState().setWizardStep(3);
    expect(useCardStore.getState().wizardStep).toBe(3);
  });

  it('should clamp wizard step to minimum 1', () => {
    useCardStore.getState().setWizardStep(0);
    expect(useCardStore.getState().wizardStep).toBe(1);

    useCardStore.getState().setWizardStep(-5);
    expect(useCardStore.getState().wizardStep).toBe(1);
  });

  it('should clamp wizard step to maximum 5', () => {
    useCardStore.getState().setWizardStep(6);
    expect(useCardStore.getState().wizardStep).toBe(5);

    useCardStore.getState().setWizardStep(100);
    expect(useCardStore.getState().wizardStep).toBe(5);
  });

  it('should increment step with nextStep', () => {
    useCardStore.getState().nextStep();
    expect(useCardStore.getState().wizardStep).toBe(2);
  });

  it('should not exceed step 5 with nextStep', () => {
    useCardStore.getState().setWizardStep(5);
    useCardStore.getState().nextStep();
    expect(useCardStore.getState().wizardStep).toBe(5);
  });

  it('should set wizardCompleted to true when reaching step 5', () => {
    useCardStore.getState().setWizardStep(4);
    expect(useCardStore.getState().wizardCompleted).toBe(false);
    useCardStore.getState().nextStep();
    expect(useCardStore.getState().wizardStep).toBe(5);
    expect(useCardStore.getState().wizardCompleted).toBe(true);
  });

  it('should decrement step with prevStep', () => {
    useCardStore.getState().setWizardStep(3);
    useCardStore.getState().prevStep();
    expect(useCardStore.getState().wizardStep).toBe(2);
  });

  it('should not go below step 1 with prevStep', () => {
    useCardStore.getState().prevStep();
    expect(useCardStore.getState().wizardStep).toBe(1);
  });

  it('should reset wizard state and card data with resetWizard', () => {
    useCardStore.getState().setWizardStep(4);
    useCardStore.getState().updateFront({ displayName: 'Changed Name' });
    useCardStore.getState().updateBack({ fullName: 'Changed Full' });
    useCardStore.setState({ wizardCompleted: true });

    useCardStore.getState().resetWizard();

    const state = useCardStore.getState();
    expect(state.wizardStep).toBe(1);
    expect(state.wizardCompleted).toBe(false);
    expect(state.card.front.displayName).toBe('YOUR NAME');
    expect(state.card.back.fullName).toBe('FULL NAME');
  });
});

describe('validateWizardStep', () => {
  const defaultCard = useCardStore.getState().card;

  it('should return invalid for empty displayName on step 1', () => {
    const card = {
      ...defaultCard,
      front: { ...defaultCard.front, displayName: '' },
    };
    const result = validateWizardStep(1, card);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('필수 입력 항목입니다');
  });

  it('should return invalid for whitespace-only displayName on step 1', () => {
    const card = {
      ...defaultCard,
      front: { ...defaultCard.front, displayName: '   ' },
    };
    const result = validateWizardStep(1, card);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('필수 입력 항목입니다');
  });

  it('should return valid for non-empty displayName on step 1', () => {
    const card = {
      ...defaultCard,
      front: { ...defaultCard.front, displayName: 'John Doe' },
    };
    const result = validateWizardStep(1, card);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should return valid for steps 2-5 regardless of data', () => {
    const card = {
      ...defaultCard,
      front: { ...defaultCard.front, displayName: '' },
    };
    for (const step of [2, 3, 4, 5]) {
      const result = validateWizardStep(step, card);
      expect(result.valid).toBe(true);
    }
  });
});
