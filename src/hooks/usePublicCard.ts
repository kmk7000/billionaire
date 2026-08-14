import { useCallback, useEffect, useMemo, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { digitalCardService, handleService, normalizeHandle } from '../services/firestoreService';
import type { DigitalCard } from '../types/db';
import type { Meishi, UserProfile } from '../types/app';

/** Split a Japanese full name into 姓 / 名 on the first (half- or full-width) space. */
function splitName(fullName: string): { lastName: string; firstName: string } {
  const parts = fullName.trim().split(/[\s　]+/);
  if (parts.length < 2) return { lastName: fullName.trim(), firstName: '' };
  return { lastName: parts[0], firstName: parts.slice(1).join(' ') };
}

/** OCR often lands the same text in both address fields; don't print it twice. */
function joinAddress(address?: string, detail?: string): string {
  const base = (address || '').trim();
  const extra = (detail || '').trim();
  if (!extra || base.includes(extra)) return base;
  if (!base) return extra;
  return `${base} ${extra}`;
}

/** Firestore rejects undefined, so drop empty keys rather than writing them. */
function compact<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== '')
  ) as Partial<T>;
}

export interface PublicCardState {
  card: DigitalCard | null;
  loading: boolean;
  handle: string | null;
  isPublic: boolean;
  publicUrl: string | null;
  /** Reserve a handle and publish the card built from the user's own meishi. */
  saveHandle: (handle: string) => Promise<{ ok: true } | { ok: false; reason: string }>;
  setPublic: (isPublic: boolean) => Promise<void>;
  checkHandle: (handle: string) => Promise<{ ok: true } | { ok: false; reason: string }>;
  /** Re-copy the latest meishi/profile content onto the published card. */
  refreshFromMeishi: () => Promise<void>;
  /** True when the published card no longer matches the source meishi. */
  isStale: boolean;
}

const REASON_MESSAGES: Record<string, string> = {
  format: '半角英数字と _ のみ、3〜30文字で入力してください。',
  reserved: 'このIDは使用できません。別のIDをお試しください。',
  taken: 'このIDは既に使われています。',
};

export function usePublicCard(
  user: FirebaseUser | null,
  userProfile: UserProfile | null,
  myMeishi: Meishi | undefined
): PublicCardState {
  const [card, setCard] = useState<DigitalCard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCard(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = digitalCardService.subscribeMyCard(
      user.uid,
      (fetched) => {
        setCard(fetched);
        setLoading(false);
      },
      (error) => {
        console.warn('Digital card subscription failed:', error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user]);

  /** Card content is derived from the user's own registered meishi + profile. */
  const buildCardData = useCallback(() => {
    const { lastName, firstName } = splitName(
      myMeishi?.name || userProfile?.displayName || user?.displayName || ''
    );
    return compact({
      companyName: myMeishi?.company || userProfile?.company || '',
      department: myMeishi?.department,
      title: myMeishi?.position || userProfile?.position,
      lastName,
      firstName,
      email: myMeishi?.email || userProfile?.email || user?.email || '',
      telCompany: myMeishi?.phone,
      telMobile: myMeishi?.mobile,
      address: joinAddress(myMeishi?.address, myMeishi?.detailedAddress),
      website: userProfile?.websites?.[0],
      introText: userProfile?.introduction,
      templateId: card?.templateId || '1',
    });
  }, [myMeishi, userProfile, user, card?.templateId]);

  const checkHandle = useCallback(
    async (handle: string) => {
      const result = await handleService.check(handle, user?.uid);
      if (result.ok) return { ok: true as const };
      return { ok: false as const, reason: REASON_MESSAGES[result.reason || 'format'] };
    },
    [user]
  );

  const saveHandle = useCallback(
    async (handle: string) => {
      if (!user) return { ok: false as const, reason: 'ログインが必要です。' };

      const claimed = await handleService.claim(handle, user.uid, card?.handle);
      if (!claimed.ok) {
        return { ok: false as const, reason: REASON_MESSAGES[claimed.reason || 'taken'] };
      }

      try {
        await digitalCardService.saveMyCard(user.uid, {
          ...buildCardData(),
          handle: normalizeHandle(handle),
          isPublic: card?.isPublic ?? true,
          viewCount: card?.viewCount ?? 0,
        });
        return { ok: true as const };
      } catch {
        // Roll the reservation back so the handle isn't orphaned.
        await handleService.release(handle);
        return { ok: false as const, reason: '保存に失敗しました。時間をおいてお試しください。' };
      }
    },
    [user, card, buildCardData]
  );

  const setPublic = useCallback(
    async (isPublic: boolean) => {
      if (!user || !card?.handle) return;
      await digitalCardService.saveMyCard(user.uid, { handle: card.handle, isPublic });
    },
    [user, card]
  );

  const refreshFromMeishi = useCallback(async () => {
    if (!user || !card?.handle) return;
    await digitalCardService.saveMyCard(user.uid, {
      ...buildCardData(),
      handle: card.handle,
      isPublic: card.isPublic,
    });
  }, [user, card, buildCardData]);

  // Compare only the fields we copy across, so unrelated card metadata
  // (viewCount, timestamps) never marks the card as stale.
  const isStale = useMemo(() => {
    if (!card?.handle) return false;
    const fresh = buildCardData() as Record<string, unknown>;
    return Object.keys(fresh).some(
      (key) => String(fresh[key] ?? '') !== String((card as Record<string, any>)[key] ?? '')
    );
  }, [card, buildCardData]);

  const publicUrl = useMemo(
    () =>
      card?.handle && typeof window !== 'undefined'
        ? `${window.location.origin}/?c=${card.handle}`
        : null,
    [card?.handle]
  );

  return {
    card,
    loading,
    handle: card?.handle ?? null,
    isPublic: card?.isPublic ?? false,
    publicUrl,
    saveHandle,
    setPublic,
    checkHandle,
    refreshFromMeishi,
    isStale,
  };
}
