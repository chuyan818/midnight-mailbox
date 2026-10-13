import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { canAccessAdmin } from '@/lib/admin-access';

interface MousePosition {
  x: number;
  y: number;
}

export default function Login() {
  const { user, loading, refresh, logout } = useAuth();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mousePos, setMousePos] = useState<MousePosition>({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const characterRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading || !user) return;
    if (canAccessAdmin(user)) {
      navigate('/admin');
    } else {
      toast.error('当前账号没有管理员权限');
    }
  }, [loading, navigate, user]);

  useEffect(() => {
    const error = new URLSearchParams(window.location.search).get('error');
    if (error === 'oauth_failed') {
      toast.error('第三方登录失败，请使用管理员邮箱和密码登录');
    } else if (error === 'oauth_state_invalid') {
      toast.error('第三方登录状态已失效，请重试');
    }
  }, []);

  // 计算头部旋转角度
  const calculateRotation = (mouseX: number, mouseY: number) => {
    if (!characterRef.current) return 0;
    
    const rect = characterRef.current.getBoundingClientRect();
    const characterCenterX = rect.left + rect.width / 2;
    const characterCenterY = rect.top + rect.height / 2;
    
    const deltaX = mouseX - characterCenterX;
    const distance = Math.sqrt(deltaX * deltaX);
    
    // 限制旋转范围在±10°
    const maxRotation = 10;
    const rotation = Math.max(-maxRotation, Math.min(maxRotation, (deltaX / distance) * maxRotation));
    
    return isNaN(rotation) ? 0 : rotation;
  };

  // 监听鼠标移动
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // 处理登录
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/email/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const result = await response.json().catch(() => null) as {
        success?: boolean;
        error?: string;
        user?: { role?: string };
      } | null;

      if (!response.ok || !result?.success || !result.user) {
        throw new Error(result?.error || '登录失败，请稍后重试');
      }
      if (!canAccessAdmin(result.user)) {
        await logout();
        throw new Error('当前账号没有管理员权限');
      }

      await refresh();
      setIsSuccess(true);
      navigate('/admin');
    } catch (error) {
      setIsSuccess(false);
      toast.error(error instanceof Error ? error.message : '登录失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const headRotation = calculateRotation(mousePos.x, mousePos.y);
  const isPasswordFocused = password.length > 0;

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 overflow-hidden"
    >
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* 顶部管理员标识 */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-400 font-medium">管理员后台</span>
          </div>
        </div>

        {/* 标题 */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white mb-2">深夜信箱</h1>
          <p className="text-slate-400 text-sm">管理员登录</p>
        </div>

        {/* 小信使角色（简化版本） */}
        <div className="flex justify-center mb-12">
          <div 
            ref={characterRef}
            className="relative w-32 h-40"
          >
            {/* 角色容器 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {/* 头部 */}
              <div 
                className="transition-transform duration-200 ease-out"
                style={{ 
                  transform: `rotateZ(${headRotation}deg)`,
                }}
              >
                {/* 头部主体 */}
                <div className="w-16 h-20 bg-gradient-to-b from-blue-400 to-blue-500 rounded-2xl relative shadow-lg">
                  {/* 眼睛 */}
                  <div className="absolute top-5 left-0 right-0 flex justify-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                      isPasswordFocused ? 'bg-slate-900 translate-y-1' : 'bg-white'
                    }`} />
                    <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                      isPasswordFocused ? 'bg-slate-900 translate-y-1' : 'bg-white'
                    }`} />
                  </div>

                  {/* 嘴巴 */}
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                    <div className={`w-4 h-0.5 bg-white rounded-full transition-all duration-300 ${
                      isSuccess ? 'scale-y-150' : ''
                    }`} />
                  </div>

                  {/* 信封遮挡眼睛动画 */}
                  {isPasswordFocused && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-6 bg-white rounded-sm shadow-md transform -rotate-12 animate-bounce" />
                    </div>
                  )}
                </div>

                {/* 围巾 */}
                <div className="w-20 h-5 bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-b-xl -mt-1 relative">
                  <div className="absolute -left-1.5 top-1/2 w-2 h-2 bg-cyan-400 rounded-full" />
                  <div className="absolute -right-1.5 top-1/2 w-2 h-2 bg-cyan-400 rounded-full" />
                </div>
              </div>

              {/* 身体 */}
              <div className="w-12 h-14 bg-gradient-to-b from-blue-400/60 to-blue-500/40 rounded-xl mt-1 relative">
                {/* 手臂 */}
                <div className="absolute top-3 -left-3 w-3 h-10 bg-blue-400/50 rounded-full" />
                <div className="absolute top-3 -right-3 w-3 h-10 bg-blue-400/50 rounded-full" />
              </div>

              {/* 信封（手中） */}
              <div className={`absolute bottom-6 right-0 w-10 h-6 bg-white rounded-sm shadow-lg transition-all duration-500 ${
                isSuccess ? 'animate-bounce translate-y-2 opacity-0' : 'opacity-100'
              }`}>
                <div className="w-full h-1/2 bg-gradient-to-b from-white to-slate-100" />
                <div className="w-full h-1/2 bg-slate-50" />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-0.5 h-1.5 bg-blue-400" />
              </div>

              {/* 抛出的信封动画 */}
              {isSuccess && (
                <>
                  <div className="absolute top-0 right-0 w-7 h-5 bg-white rounded-sm shadow-lg animate-[fly_1s_ease-out_forwards]" />
                  <div className="absolute top-1 right-1 w-7 h-5 bg-white rounded-sm shadow-lg animate-[fly_1.2s_ease-out_0.1s_forwards]" />
                </>
              )}
            </div>
          </div>
        </div>

        {/* 登录表单 */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* 邮箱输入 */}
          <div className="relative">
            <Input
              type="email"
              placeholder="管理员邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 pl-10 h-11 rounded-lg focus:border-blue-500 focus:bg-slate-800/80 focus:ring-1 focus:ring-blue-500/50 transition-colors"
              required
            />
            <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
          </div>

          {/* 密码输入 */}
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="管理员密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 pl-10 pr-10 h-11 rounded-lg focus:border-blue-500 focus:bg-slate-800/80 focus:ring-1 focus:ring-blue-500/50 transition-colors"
              required
            />
            <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-slate-500 hover:text-slate-400 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* 登录按钮 */}
          <Button
            type="submit"
            disabled={isLoading || isSuccess}
            className="w-full h-11 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '登录中...' : isSuccess ? '✓ 登录成功' : '管理员登录'}
          </Button>
        </form>

        {/* 底部提示 */}
        <div className="mt-6 text-center text-xs text-slate-500">
          <p>仅限授权管理员访问</p>
        </div>
      </div>

      {/* 飞行动画样式 */}
      <style>{`
        @keyframes fly {
          0% {
            transform: translateX(0) translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateX(80px) translateY(-160px) rotate(45deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
