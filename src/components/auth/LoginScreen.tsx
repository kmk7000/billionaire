import { MessageSquare, Mail } from 'lucide-react';

export const LoginScreen = ({ onLogin, onLineLogin, onEmailSignup, errorMessage }: { onLogin: () => void; onLineLogin: () => void; onEmailSignup: () => void; errorMessage?: string | null }) => (
  <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12 max-w-md mx-auto shadow-2xl">
    <div className="flex-1 flex flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-2 font-serif">Remember</h1>
      <p className="text-gray-500 font-medium">チャンスが広がる、キャリアブリッジ</p>
      {errorMessage && (
        <p className="mt-4 text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 max-w-xs break-words">{errorMessage}</p>
      )}
    </div>

    <div className="w-full space-y-3 mb-8">
      {/* LINE Login (Equivalent to Kakao in Japan) */}
      <button 
        onClick={onLineLogin}
        className="w-full bg-[#06C755] text-white font-bold py-4 rounded-lg flex items-center justify-center gap-3 shadow-sm active:scale-[0.98] transition-transform"
      >
        <MessageSquare className="w-5 h-5 fill-current" />
        LINEで登録
      </button>

      {/* Social Icons Row */}
      <div className="flex justify-center gap-4 py-4">
        <button onClick={onLogin} className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        </button>
        <button onClick={onEmailSignup} className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50">
          <Mail className="w-5 h-5 text-gray-400" />
        </button>
      </div>
    </div>

    <div className="w-full flex items-center gap-4 mb-8">
      <div className="flex-1 h-[1px] bg-gray-100"></div>
      <span className="text-xs text-gray-400 font-medium">または</span>
      <div className="flex-1 h-[1px] bg-gray-100"></div>
    </div>

    <button 
      onClick={onLogin}
      className="w-full bg-gray-900 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-3 shadow-lg active:scale-[0.98] transition-transform mb-8"
    >
      <span className="font-serif italic text-xl mr-1">C</span>
      既存ユーザーログイン
    </button>

    <div className="text-center">
      <p className="text-xs text-gray-400">
        アカウントをお忘れですか？ <span className="underline font-bold text-gray-500 cursor-pointer">アカウントを探す</span>
      </p>
    </div>
  </div>
);
