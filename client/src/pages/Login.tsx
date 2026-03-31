import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Eye, EyeOff } from 'lucide-react';

interface MousePosition {
  x: number;
  y: number;
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mousePos, setMousePos] = useState<MousePosition>({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const characterRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
    
    // 模拟登录延迟
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      
      // 2秒后重置
      setTimeout(() => {
        setIsSuccess(false);
      }, 2000);
    }, 1500);
  };

  const headRotation = calculateRotation(mousePos.x, mousePos.y);
  const isPasswordFocused = password.length > 0;

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-[#020617] flex items-center justify-center p-4 overflow-hidden"
    >
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-[#6366F1]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-[#38BDF8]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* 标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">深夜信箱</h1>
          <p className="text-[#38BDF8] text-sm">一个温暖的深夜陪伴</p>
        </div>

        {/* 小信使角色 */}
        <div className="flex justify-center mb-12">
          <div 
            ref={characterRef}
            className="relative w-48 h-56"
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
                <div className="w-20 h-24 bg-gradient-to-b from-[#6366F1] to-[#6366F1]/80 rounded-3xl relative shadow-lg">
                  {/* 眼睛 */}
                  <div className="absolute top-6 left-0 right-0 flex justify-center gap-3">
                    <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      isPasswordFocused ? 'bg-[#020617] translate-y-2' : 'bg-white'
                    }`} />
                    <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      isPasswordFocused ? 'bg-[#020617] translate-y-2' : 'bg-white'
                    }`} />
                  </div>

                  {/* 嘴巴 */}
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                    <div className={`w-6 h-1 bg-white rounded-full transition-all duration-300 ${
                      isSuccess ? 'scale-y-150' : ''
                    }`} />
                  </div>

                  {/* 信封遮挡眼睛动画 */}
                  {isPasswordFocused && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-8 bg-white rounded-sm shadow-md transform -rotate-12 animate-bounce" />
                    </div>
                  )}
                </div>

                {/* 围巾 */}
                <div className="w-24 h-6 bg-gradient-to-r from-[#38BDF8] to-[#38BDF8]/60 rounded-b-2xl -mt-2 relative">
                  <div className="absolute -left-2 top-1/2 w-3 h-3 bg-[#38BDF8]/60 rounded-full" />
                  <div className="absolute -right-2 top-1/2 w-3 h-3 bg-[#38BDF8]/60 rounded-full" />
                </div>
              </div>

              {/* 身体 */}
              <div className="w-16 h-20 bg-gradient-to-b from-[#6366F1]/60 to-[#6366F1]/40 rounded-2xl mt-2 relative">
                {/* 手臂 */}
                <div className="absolute top-4 -left-4 w-4 h-12 bg-[#6366F1]/50 rounded-full" />
                <div className="absolute top-4 -right-4 w-4 h-12 bg-[#6366F1]/50 rounded-full" />
              </div>

              {/* 信封（手中） */}
              <div className={`absolute bottom-8 right-0 w-12 h-8 bg-white rounded-sm shadow-lg transition-all duration-500 ${
                isSuccess ? 'animate-bounce translate-y-2 opacity-0' : 'opacity-100'
              }`}>
                <div className="w-full h-1/2 bg-gradient-to-b from-white to-[#E5E7EB]" />
                <div className="w-full h-1/2 bg-[#F3F4F6]" />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-2 bg-[#38BDF8]" />
              </div>

              {/* 抛出的信封动画 */}
              {isSuccess && (
                <>
                  <div className="absolute top-0 right-0 w-8 h-6 bg-white rounded-sm shadow-lg animate-[fly_1s_ease-out_forwards]" />
                  <div className="absolute top-2 right-2 w-8 h-6 bg-white rounded-sm shadow-lg animate-[fly_1.2s_ease-out_0.1s_forwards]" />
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
              placeholder="请输入邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/10 border-[#38BDF8]/30 text-white placeholder:text-white/40 pl-10 h-12 rounded-lg focus:border-[#38BDF8] focus:bg-white/15 transition-colors"
              required
            />
            <Mail className="absolute left-3 top-3.5 w-5 h-5 text-[#38BDF8]" />
          </div>

          {/* 密码输入 */}
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white/10 border-[#38BDF8]/30 text-white placeholder:text-white/40 pl-10 pr-10 h-12 rounded-lg focus:border-[#38BDF8] focus:bg-white/15 transition-colors"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-[#38BDF8] hover:text-[#38BDF8]/80 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* 登录按钮 */}
          <Button
            type="submit"
            disabled={isLoading || isSuccess}
            className="w-full h-12 bg-gradient-to-r from-[#6366F1] to-[#6366F1]/80 hover:from-[#6366F1]/90 hover:to-[#6366F1]/70 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50"
          >
            {isLoading ? '登录中...' : isSuccess ? '✓ 登录成功' : '登录'}
          </Button>
        </form>

        {/* 底部链接 */}
        <div className="mt-6 text-center text-sm text-white/60">
          <p>还没有账号？<a href="#" className="text-[#38BDF8] hover:text-[#38BDF8]/80 transition-colors">立即注册</a></p>
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
            transform: translateX(100px) translateY(-200px) rotate(45deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
