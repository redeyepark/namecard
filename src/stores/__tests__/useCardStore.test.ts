import { describe, it, expect, beforeEach } from 'vitest';
import { useCardStore } from '../useCardStore';

// Reset the store before each test
beforeEach(() => {
  useCardStore.getState().resetCard();
  useCardStore.setState({ activeSide: 'front' });
});

describe('useCardStore', () => {
  it('should have default card data', () => {
    const state = useCardStore.getState();
    expect(state.card.front.displayName).toBe('YOUR NAME');
    expect(state.card.front.backgroundColor).toBe('#E53E3E');
    expect(state.card.back.fullName).toBe('FULL NAME');
    expect(state.activeSide).toBe('front');
  });

  it('should update front data', () => {
    useCardStore.getState().updateFront({ displayName: 'John Doe' });
    const state = useCardStore.getState();
    expect(state.card.front.displayName).toBe('John Doe');
    // Other fields should remain unchanged
    expect(state.card.front.backgroundColor).toBe('#E53E3E');
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
