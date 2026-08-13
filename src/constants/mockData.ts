import type { Meishi, Post } from '../types/app';

export const MOCK_MEISHI: Meishi[] = [
  { id: '1', name: '田中 健一', company: '株式会社トヨタ', position: '営業部長', email: 'tanaka@toyota.jp', phone: '090-1234-5678', updatedAt: '2024.03.20' },
  { id: '2', name: '佐藤 由衣', company: 'ソフトバンクグループ', position: 'パートナーシップマネージャー', email: 'yui.sato@softbank.co.jp', phone: '080-8765-4321', updatedAt: '2024.03.18' },
  { id: '3', name: '伊藤 涼介', company: '電通', position: '企画チーム', email: 'ito@dentsu.co.jp', phone: '070-1111-2222', updatedAt: '2024.03.15' },
];

export const MOCK_POSTS: Post[] = [
  { id: '1', category: 'キャリア', title: '30代後半での転職、正直どうですか？', content: '現在大手メーカーで営業をしていますが、スタートアップへの転職を考えています...', authorCompany: '大手メーカー', likes: 124, comments: 45, createdAt: '10分前' },
  { id: '2', category: '給与・年収', title: 'コンサル業界のボーナス事情', content: '今年のボーナス、去年に比べてかなり上がった気がします。皆さんのところはどうですか？', authorCompany: '外資系コンサル', likes: 89, comments: 32, createdAt: '1時間前' },
  { id: '3', category: '職場環境', title: 'リモートワーク廃止の動きについて', content: 'うちの会社も週5出社に戻るという噂が...。モチベーション維持が難しいです。', authorCompany: 'IT企業', likes: 210, comments: 156, createdAt: '3時間前' },
];
