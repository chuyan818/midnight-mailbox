import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, Eye, EyeOff, Chrome, MessageCircle, Smartphone } from 'lucide-react';

interface MousePosition {
  x: number;
  y: number;
}

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
}

export default function UserLogin() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [mousePos, setMousePos] = useState<MousePosition>({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const spiritRef = useRef<HTMLDivElement>(null);
  const leftSectionRef = useRef<HTMLDivElement>(null);
  const [stars, setStars] = useState<Star[]>([]);

  // 初始化星空
  useEffect(() => {
    const generatedStars: Star[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.5 + 0.3,
      duration: Math.random() * 3 + 2,
    }));
    setStars(generatedStars);
  }, []);

  // 计算精灵位置
  const calculateSpiritPosition = (mouseX: number, mouseY: number) => {
    if (!spiritRef.current || !leftSectionRef.current) return { x: 0, y: 0 };
    
    const rect = leftSectionRef.current.getBoundingClientRect();
    const spiritRect = spiritRef.current.getBoundingClientRect();
    
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = mouseX - centerX;
    const deltaY = mouseY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // 限制移动范围
    const maxMove = 40;
    const moveX = (deltaX / distance) * Math.min(maxMove, distance / 10);
    const moveY = (deltaY / distance) * Math.min(maxMove, distance / 10);
    
    return { x: moveX, y: moveY };
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
    
    // 模拟登录请求
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      
      // 登录成功后1.5秒跳转到首页
      setTimeout(() => {
        navigate('/');
      }, 1500);
    }, 1500);
  };

  // 处理第三方登录
  const handleThirdPartyLogin = (provider: string) => {
    console.log(`Logging in with ${provider}`);
    // TODO: 实现第三方登录逻辑
  };

  const spiritPos = calculateSpiritPosition(mousePos.x, mousePos.y);

  return (
    <div className="min-h-screen bg-white flex overflow-hidden">
      {/* 左侧动画区 */}
      <div 
        ref={leftSectionRef}
        className="hidden lg:flex w-1/2 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden flex-col items-center justify-center"
      >
        {/* 星空背景 */}
        <div className="absolute inset-0 overflow-hidden">
          {stars.map((star) => (
            <div
              key={star.id}
              className="absolute rounded-full bg-white animate-pulse"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                opacity: star.opacity,
                animation: `twinkle ${star.duration}s infinite`,
              }}
            />
          ))}
        </div>

        {/* 装饰圆形 */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />

        {/* 夜谈精灵角色 */}
        <div className="relative z-10">
          <div 
            ref={spiritRef}
            className="transition-transform duration-300 ease-out"
            style={{ 
              transform: `translate(${spiritPos.x}px, ${spiritPos.y}px)`,
            }}
          >
            {/* 精灵头部 */}
            <div className="w-24 h-24 bg-gradient-to-b from-purple-300 to-purple-400 rounded-full relative shadow-2xl mx-auto mb-2">
              {/* 眼睛 */}
              <div className="absolute top-7 left-0 right-0 flex justify-center gap-4">
                <div className="w-3 h-3 rounded-full bg-white shadow-inner">
                  <div className="w-1.5 h-1.5 bg-purple-900 rounded-full ml-0.75 mt-0.75" />
                </div>
                <div className="w-3 h-3 rounded-full bg-white shadow-inner">
                  <div className="w-1.5 h-1.5 bg-purple-900 rounded-full ml-0.75 mt-0.75" />
                </div>
              </div>

              {/* 嘴巴 */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <div className="w-6 h-1 bg-purple-600 rounded-full" />
              </div>

              {/* 光晕 */}
              <div className="absolute -inset-4 rounded-full border-2 border-purple-300/30 animate-pulse" />
            </div>

            {/* 精灵身体 */}
            <div className="w-16 h-20 bg-gradient-to-b from-purple-300/80 to-purple-400/60 rounded-3xl mx-auto relative">
              {/* 翅膀 */}
              <div className="absolute top-2 -left-6 w-6 h-10 bg-purple-200/60 rounded-full blur-sm animate-bounce" />
              <div className="absolute top-2 -right-6 w-6 h-10 bg-purple-200/60 rounded-full blur-sm animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>

            {/* 魔法光效 */}
            <div className="absolute -inset-8 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-2xl animate-pulse" />
          </div>
        </div>

        {/* 底部文案 */}
        <div className="absolute bottom-12 text-center z-10">
          <p className="text-white/80 text-sm font-medium">夜谈精灵在这里陪伴你</p>
          <p className="text-white/50 text-xs mt-1">每个夜晚都不会孤独</p>
        </div>
      </div>

      {/* 右侧登录区 */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col items-center justify-center p-8 md:p-12">
        <div className="w-full max-w-md">
          {/* Logo 和标题 */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">深</span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900">深夜信箱</h1>
            </div>
            <p className="text-slate-600 text-sm">一个温暖的深夜陪伴</p>
          </div>

          {/* 登录表单 */}
          <form onSubmit={handleLogin} className="space-y-4 mb-6">
            {/* 邮箱输入 */}
            <div className="relative">
              <Input
                type="email"
                placeholder="请输入邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 pl-10 h-12 rounded-lg focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/20 transition-all"
                required
              />
              <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
            </div>

            {/* 密码输入 */}
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 pl-10 pr-10 h-12 rounded-lg focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/20 transition-all"
                required
              />
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* 记住密码 */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-purple-500 focus:ring-purple-500"
                />
                <span className="text-sm text-slate-600">记住我</span>
              </label>
              <a href="#" className="text-sm text-purple-600 hover:text-purple-700 transition-colors">
                忘记密码？
              </a>
            </div>

            {/* 登录按钮 */}
            <Button
              type="submit"
              disabled={isLoading || isSuccess}
              className="w-full h-12 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '登录中...' : isSuccess ? '✓ 登录成功' : '登录'}
            </Button>
          </form>

          {/* 分割线 */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">或者</span>
            </div>
          </div>

          {/* 第三方登录 */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <button
              type="button"
              onClick={() => handleThirdPartyLogin('google')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              title="Google登录"
            >
              <Chrome className="w-5 h-5 text-slate-600" />
            </button>
            <button
              type="button"
              onClick={() => handleThirdPartyLogin('line')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              title="LINE登录"
            >
              <MessageCircle className="w-5 h-5 text-slate-600" />
            </button>
            <button
              type="button"
              onClick={() => handleThirdPartyLogin('wechat')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              title="微信登录"
            >
              <Smartphone className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* 注册链接 */}
          <div className="text-center">
            <p className="text-slate-600 text-sm">
              还没有账号？
              <a href="#" className="text-purple-600 hover:text-purple-700 font-semibold transition-colors ml-1">
                立即注册
              </a>
            </p>
          </div>
        </div>

        {/* 底部Footer */}
        <div className="absolute bottom-6 left-0 right-0 text-center text-xs text-slate-500">
          <p>© 2026 深夜信箱 · <a href="#" className="hover:text-slate-700">隐私政策</a> · <a href="#" className="hover:text-slate-700">服务条款</a></p>
        </div>
      </div>

      {/* 星空闪烁动画 */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
