// Community board taxonomy, benchmarked from Remember (community.rememberapp.co.kr)'s
// "関心事・テーマ" sidebar and translated to Japanese. Curated statically rather than
// stored in Firestore — see the comment on CommunityBoard in src/types/db.ts.
import type { CommunityBoard } from '../types/db';

export const COMMUNITY_BOARDS: CommunityBoard[] = [
  { id: 'company-life', type: 'topic', key: 'company-life', nameJa: '会社生活', description: '会社での日常やエピソードを共有しましょう' },
  { id: 'resume-interview', type: 'topic', key: 'resume-interview', nameJa: '書類・面接のコツ', description: '履歴書・面接対策のノウハウを交換しましょう' },
  { id: 'married-life', type: 'topic', key: 'married-life', nameJa: '結婚生活', description: '結婚生活にまつわる悩みや話題' },
  { id: 'dating', type: 'topic', key: 'dating', nameJa: '恋愛', description: '恋愛にまつわる悩みや話題' },
  { id: 'drinking', type: 'topic', key: 'drinking', nameJa: 'お酒の話', description: 'お酒にまつわるエピソード' },
  { id: 'bragging', type: 'topic', key: 'bragging', nameJa: '自慢話', description: 'ちょっとした自慢を聞いてください' },
  { id: 'free-talk', type: 'topic', key: 'free-talk', nameJa: 'フリートーク', description: '自由に話せる雑談スペース' },
  { id: 'issue-debate', type: 'topic', key: 'issue-debate', nameJa: '議論・イシュー', description: '気になる社会的な話題を議論しましょう' },
  { id: 'finance', type: 'topic', key: 'finance', nameJa: '財テク', description: '資産形成・投資の情報交換' },
  { id: 'hobby', type: 'topic', key: 'hobby', nameJa: '趣味生活', description: '趣味の話題で盛り上がりましょう' },
  { id: 'career-change', type: 'topic', key: 'career-change', nameJa: '転職・キャリア', description: '転職やキャリアプランの相談' },
];

export const COMMUNITY_BOARD_EMOJI: Record<string, string> = {
  'company-life': '🎁',
};

export function getCommunityBoard(boardId: string): CommunityBoard | undefined {
  return COMMUNITY_BOARDS.find((b) => b.id === boardId);
}

export function getCommunityBoardLabel(boardId: string): string {
  const board = getCommunityBoard(boardId);
  if (!board) return boardId;
  const emoji = COMMUNITY_BOARD_EMOJI[board.id];
  return emoji ? `${board.nameJa}${emoji}` : board.nameJa;
}
