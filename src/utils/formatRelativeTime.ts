// Formats a Firestore Timestamp (or Date/ISO string) as a Japanese relative-time
// string, e.g. "3分前" / "2時間前" / "5日前" — matches Remember's post timestamps.
export function formatRelativeTime(value: any): string {
  if (!value) return '';

  const date: Date = typeof value?.toDate === 'function' ? value.toDate() : new Date(value);
  if (isNaN(date.getTime())) return '';

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'たった今';
  if (diffMin < 60) return `${diffMin}分前`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}時間前`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}日前`;

  return date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
}
