'use client';

import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, Eye, EyeOff, Chrome, Check } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { getPasswordStrength as getSharedPasswordStrength, isValidEmail, isValidRegistrationPassword } from '@/lib/auth-validation';

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

export default function Register() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [verificationCodeSent, setVerificationCodeSent] = useState(false);
  const [verificationCountdown, setVerificationCountdown] = useState(0);
  const [dailyCodeCount, setDailyCodeCount] = useState(0);

  // 验证邮箱格式
  const validateEmail = (email: string) => {
    return isValidEmail(email);
  };

  // 验证密码规则
  const validatePassword = (pwd: string) => {
    return isValidRegistrationPassword(pwd);
  };

  // 检查密码强度
  const getPasswordStrength = (pwd: string) => {
    return getSharedPasswordStrength(pwd);
  };

  // 获取密码强度颜色
  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'weak':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-500';
      case 'strong':
        return 'text-green-500';
      default:
        return 'text-gray-400';
    }
  };

  // 获取密码强度中文
  const getStrengthText = (strength: string) => {
    switch (strength) {
      case 'weak':
        return '弱';
      case 'medium':
        return '中';
      case 'strong':
        return '强';
      default:
        return '';
    }
  };

  // 发送验证码
  const handleSendVerificationCode = async () => {
    if (!validateEmail(email)) {
      setErrors({ ...errors, email: '请输入有效的邮箱地址' });
      return;
    }

    if (verificationCountdown > 0) {
      setErrors({ ...errors, verificationCode: '请等待倒计时结束后再发送' });
      return;
    }

    if (dailyCodeCount >= 10) {
      setErrors({ ...errors, verificationCode: '今天已达到发送上限（10次）' });
      return;
    }

    setIsLoading(true);
    try {
      // 模拟发送验证码
      // 实际应调用后端API
      setVerificationCodeSent(true);
      setVerificationCountdown(60);
      setDailyCodeCount(dailyCodeCount + 1);
      setErrors({ ...errors, verificationCode: '' });

      // 倒计时
      const interval = setInterval(() => {
        setVerificationCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理注册
  const handleRegister = async () => {
    const newErrors: Record<string, string> = {};

    // 验证邮箱
    if (!email) {
      newErrors.email = '请输入邮箱地址';
    } else if (!validateEmail(email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }

    // 验证验证码
    if (!verificationCode) {
      newErrors.verificationCode = '请输入验证码';
    }

    // 验证密码
    if (!password) {
      newErrors.password = '请设置密码';
    } else if (!validatePassword(password)) {
      newErrors.password = '密码至少6位，包含字母和数字';
    }

    // 验证确认密码
    if (!confirmPassword) {
      newErrors.confirmPassword = '请确认密码';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }

    // 验证协议
    if (!agreeTerms) {
      newErrors.agreeTerms = '请同意用户协议和隐私政策';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      // 处理"记住我"功能
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('rememberMeTimestamp', new Date().toISOString());
      } else {
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('rememberMeTimestamp');
      }
      
      // 调用注册接口
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsSuccess(true);

      setTimeout(() => {
        // 注册成功后自动跳转到首页
        navigate('/');
      }, 1500);
    } catch (error) {
      setErrors({ submit: '注册失败，请重试' });
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(password);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">创建你的账号</h1>
          <p className="text-gray-400 text-sm">今晚，让情绪有个地方安放。</p>
        </div>

        {/* 表单 */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 space-y-4">
          {/* 邮箱地址 */}
          <div>
            <label className="flex items-center text-white text-sm mb-2">
              <Mail className="w-4 h-4 mr-2 text-blue-400" />
              邮箱地址
            </label>
            <Input
              type="email"
              placeholder="请输入邮箱地址"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
              className="bg-white/5 border-white/20 text-white placeholder:text-gray-500"
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            {email && !validateEmail(email) && (
              <p className="text-red-400 text-xs mt-1">请输入有效的邮箱地址</p>
            )}
            {email && validateEmail(email) && (
              <p className="text-green-400 text-xs mt-1 flex items-center gap-1">
                <Check className="w-3 h-3" />
                邮箱格式正确
              </p>
            )}
          </div>

          {/* 验证码 */}
          <div>
            <label className="flex items-center text-white text-sm mb-2">
              <Mail className="w-4 h-4 mr-2 text-blue-400" />
              验证码
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="输入验证码"
                value={verificationCode}
                onChange={(e) => {
                  setVerificationCode(e.target.value);
                  if (errors.verificationCode) setErrors({ ...errors, verificationCode: '' });
                }}
                className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 flex-1"
              />
              <Button
                onClick={handleSendVerificationCode}
                disabled={isLoading || verificationCountdown > 0 || !validateEmail(email)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 whitespace-nowrap"
              >
                {verificationCountdown > 0 ? `${verificationCountdown}s` : '发送验证码'}
              </Button>
            </div>
            {errors.verificationCode && <p className="text-red-400 text-xs mt-1">{errors.verificationCode}</p>}
            {verificationCode && verificationCode.length !== 6 && (
              <p className="text-red-400 text-xs mt-1">验证码应为6位数字</p>
            )}
            {verificationCode && verificationCode.length === 6 && /^\d{6}$/.test(verificationCode) && (
              <p className="text-green-400 text-xs mt-1 flex items-center gap-1">
                <Check className="w-3 h-3" />
                验证码格式正确
              </p>
            )}
            {dailyCodeCount > 0 && (
              <p className="text-gray-400 text-xs mt-1">
                今天已发送 {dailyCodeCount}/10 次
              </p>
            )}
          </div>

          {/* 设置密码 */}
          <div>
            <label className="flex items-center text-white text-sm mb-2">
              <Lock className="w-4 h-4 mr-2 text-blue-400" />
              设置密码
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="至少6位"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: '' });
                }}
                className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 pr-10"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}

            {/* 密码强度提示 */}
            {password && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-gray-400 text-xs">密码强度：</span>
                <div className="flex gap-1">
                  <span className={`text-xs font-medium ${getStrengthColor('weak')} ${passwordStrength === 'weak' ? 'opacity-100' : 'opacity-40'}`}>
                    弱
                  </span>
                  <span className="text-gray-500">|</span>
                  <span className={`text-xs font-medium ${getStrengthColor('medium')} ${passwordStrength === 'medium' ? 'opacity-100' : 'opacity-40'}`}>
                    中
                  </span>
                  <span className="text-gray-500">|</span>
                  <span className={`text-xs font-medium ${getStrengthColor('strong')} ${passwordStrength === 'strong' ? 'opacity-100' : 'opacity-40'}`}>
                    强
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 确认密码 */}
          <div>
            <label className="flex items-center text-white text-sm mb-2">
              <Lock className="w-4 h-4 mr-2 text-blue-400" />
              确认密码
            </label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="再输入一次密码"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                }}
                className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 pr-10"
              />
              <button
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
            {confirmPassword && password !== confirmPassword && (
              <p className="text-red-400 text-xs mt-1">两次输入的密码不一致</p>
            )}
            {confirmPassword && password === confirmPassword && (
              <p className="text-green-400 text-xs mt-1 flex items-center gap-1">
                <Check className="w-3 h-3" />
                密码一致
              </p>
            )}
          </div>

          {/* 记住我 */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500"
            />
            <label htmlFor="rememberMe" className="text-gray-400 text-sm">
              记住我
            </label>
          </div>

          {/* 协议勾选 */}
          <div className="flex items-start gap-2 pt-2">
            <input
              type="checkbox"
              id="terms"
              checked={agreeTerms}
              onChange={(e) => {
                setAgreeTerms(e.target.checked);
                if (errors.agreeTerms) setErrors({ ...errors, agreeTerms: '' });
              }}
              className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500"
            />
            <label htmlFor="terms" className="text-gray-300 text-sm">
              我已阅读并同意
              <a href="#" className="text-blue-400 hover:text-blue-300 mx-1">
                《用户协议》
              </a>
              和
              <a href="#" className="text-blue-400 hover:text-blue-300 mx-1">
                《隐私政策》
              </a>
            </label>
          </div>
          {errors.agreeTerms && <p className="text-red-400 text-xs">{errors.agreeTerms}</p>}

          {/* 创建账号按钮 */}
          <Button
            onClick={handleRegister}
            disabled={isLoading || isSuccess}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 rounded-lg mt-6"
          >
            {isSuccess ? (
              <span className="flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                注册成功
              </span>
            ) : isLoading ? (
              '创建中...'
            ) : (
              '创建账号'
            )}
          </Button>

          {/* 已有账号链接 */}
          <div className="text-center pt-4">
            <span className="text-gray-400 text-sm">
              已有账号？
              <a href="/user-login" className="text-blue-400 hover:text-blue-300 ml-1">
                立即登录 →
              </a>
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-xs">
          <p>© 2026 深夜信箱 · 隐私政策 · 服务条款</p>
        </div>
      </div>
    </div>
  );
}
