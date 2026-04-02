import { useState, useRef, useEffect } from 'react';
import { useLocation, useSearchParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, Eye, EyeOff, Chrome, AlertCircle, CheckCircle } from 'lucide-react';

// LINE图标组件
const LineIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M19.365 9.863c.349-1.926.055-3.359-.955-4.183-1.867-1.498-5.73.205-8.427 3.922 0 0-1.631 2.151-2.155 2.886-.59.879-.455 1.922.3 2.529.12.098.237.187.347.268-1.626.269-3.626.879-4.773 1.707-1.516 1.123-1.617 2.764-.3 4.304 1.616 1.932 5.908 1.617 9.613-1.035 0 0 1.632-1.348 2.155-2.155.59-.879.455-1.922-.3-2.529-.12-.098-.237-.187-.347-.268 1.626-.269 3.626-.879 4.773-1.707 1.516-1.123 1.617-2.764.3-4.304zm-9.613 6.73c-2.886 2.155-6.493 2.348-7.609 1.348-.732-.617-.732-2.035.349-3.359 1.081-1.324 3.359-2.035 5.908-2.035.349 0 .698.027 1.047.082-1.081 1.348-1.932 2.886-2.155 3.922-.055.349.027.698.349.879.322.18.698.18.879 0 .18-.18 1.031-1.517 2.112-2.865.592.592.864 1.184.864 1.776 0 .592-.271 1.184-.864 1.776-.592.592-1.184.864-1.776.864-.592 0-1.184-.271-1.776-.864zm7.609-1.348c-.732.617-2.035 1.031-3.584 1.031-.349 0-.698-.027-1.047-.082 1.081-1.348 1.932-2.886 2.155-3.922.055-.349-.027-.698-.349-.879-.322-.18-.698-.18-.879 0-.18.18-1.031 1.517-2.112 2.865-.592-.592-.864-1.184-.864-1.776 0-.592.271-1.184.864-1.776.592-.592 1.184-.864 1.776-.864.592 0 1.184.271 1.776.864 1.081 1.081 1.932 2.613 2.155 3.922.055.349-.027.698-.349.879.322.18.698.18.879 0z" />
  </svg>
);

// 微信图标组件
const WeChatIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M8.5 11.5c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm6 0c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5z" />
    <path d="M12 2C6.48 2 2 5.58 2 10c0 2.54 1.19 4.81 3.04 6.27.21 1.58.67 2.99 1.69 3.95-.02-.01 2.29-1.44 3.27-2.04 1.09.21 2.21.32 3.35.32 5.52 0 10-3.58 10-8s-4.48-8-10-8zm0 14c-1.11 0-2.19-.11-3.25-.32l-1.44.91c-.81.51-1.54 1.01-1.84 1.18-.12-.44-.3-1.12-.42-2.05-1.59-1.2-2.61-2.92-2.61-4.82 0-3.86 3.59-7 8-7s8 3.14 8 7-3.59 7-8 7z" />
  </svg>
);

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
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(() => {
    const paramEmail = searchParams.get('email');
    if (paramEmail) return paramEmail;
    // 从localStorage读取记住的邮箱
    if (typeof window !== 'undefined') {
      return localStorage.getItem('rememberedEmail') || '';
    }
    return '';
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('rememberMe') === 'true';
    }
    return false;
  });
  const [mousePos, setMousePos] = useState<MousePosition>({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const spiritRef = useRef<HTMLDivElement>(null);
  const leftSectionRef = useRef<HTMLDivElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const [stars, setStars] = useState<Star[]>([]);

  // 验证邮箱格式
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 当邮箱自动填充时，焦点移到密码输入框
  useEffect(() => {
    if (searchParams.get('email') && passwordInputRef.current) {
      setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 100);
    }
  }, [searchParams]);

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
    const newErrors: Record<string, string> = {};

    // 验证邮箱
    if (!email) {
      newErrors.email = '请输入邮箱地址';
    } else if (!validateEmail(email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }

    // 验证密码
    if (!password) {
      newErrors.password = '请输入密码';
    } else if (password.length < 6) {
      newErrors.password = '密码至少6位';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    
    // 处理"记住我"功能
    if (rememberMe) {
      // 保存邮箱和记住我状态
      localStorage.setItem('rememberedEmail', email);
      localStorage.setItem('rememberMe', 'true');
      localStorage.setItem('rememberMeTimestamp', new Date().toISOString());
    } else {
      // 清除已记住的邮箱
      localStorage.removeItem('rememberedEmail');
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('rememberMeTimestamp');
    }
    
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
    setIsLoading(true);
    
    // 模拟第三方登录
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      
      // 登录成功后1.5秒跳转到首页
      setTimeout(() => {
        navigate('/');
      }, 1500);
    }, 2000);
  };

  // 邮箱输入变化处理
  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (errors.email) {
      setErrors({ ...errors, email: '' });
    }
  };

  // 密码输入变化处理
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (errors.password) {
      setErrors({ ...errors, password: '' });
    }
  };

  // 检查邮箱是否有效
  const isEmailValid = email && validateEmail(email);
  const isPasswordValid = password && password.length >= 6;

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
                onChange={(e) => handleEmailChange(e.target.value)}
                className={`bg-slate-50 border-2 text-slate-900 placeholder:text-slate-400 pl-10 h-12 rounded-lg transition-all ${
                  errors.email 
                    ? 'border-red-500 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-500/20' 
                    : isEmailValid
                    ? 'border-green-500 focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-500/20'
                    : 'border-slate-200 focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/20'
                }`}
                required
              />
              <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
              {isEmailValid && !errors.email && (
                <CheckCircle className="absolute right-3 top-3.5 w-5 h-5 text-green-500" />
              )}
              {errors.email && (
                <AlertCircle className="absolute right-3 top-3.5 w-5 h-5 text-red-500" />
              )}
              {errors.email && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* 密码输入 */}
            <div className="relative">
              <Input
                ref={passwordInputRef}
                type={showPassword ? 'text' : 'password'}
                placeholder="请输入密码"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                className={`bg-slate-50 border-2 text-slate-900 placeholder:text-slate-400 pl-10 pr-10 h-12 rounded-lg transition-all ${
                  errors.password 
                    ? 'border-red-500 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-500/20' 
                    : isPasswordValid
                    ? 'border-green-500 focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-500/20'
                    : 'border-slate-200 focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/20'
                }`}
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
              {isPasswordValid && !errors.password && (
                <div className="absolute right-12 top-3.5">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              )}
              {errors.password && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* 记住我 */}
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
              <div className="flex items-center gap-3">
                {localStorage.getItem('rememberMe') === 'true' && (
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem('rememberedEmail');
                      localStorage.removeItem('rememberMe');
                      localStorage.removeItem('rememberMeTimestamp');
                      setEmail('');
                      setRememberMe(false);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                    title="清除已记住的邮箱"
                  >
                    清除
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-sm text-purple-600 hover:text-purple-700 transition-colors"
                >
                  忘记密码？
                </button>
              </div>
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
              <LineIcon className="w-5 h-5 text-slate-600" />
            </button>
            <button
              type="button"
              onClick={() => handleThirdPartyLogin('wechat')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              title="微信登录"
            >
              <WeChatIcon className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* 注册链接 */}
          <div className="text-center">
            <p className="text-slate-600 text-sm">
              还没有账号？
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="text-purple-600 hover:text-purple-700 font-semibold transition-colors ml-1 bg-none border-none cursor-pointer p-0"
              >
                立即注册
              </button>
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
