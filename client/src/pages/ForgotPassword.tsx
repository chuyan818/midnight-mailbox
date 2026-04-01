import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<'email' | 'verification' | 'reset' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [verificationCountdown, setVerificationCountdown] = useState(0);
  const [dailyCodeCount, setDailyCodeCount] = useState(0);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // 验证邮箱格式
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 验证密码规则
  const validatePassword = (pwd: string) => {
    return pwd.length >= 6 && /[a-zA-Z]/.test(pwd) && /\d/.test(pwd);
  };

  // 获取密码强度
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return 'none';
    if (pwd.length < 6) return 'weak';
    if (pwd.length < 8) return 'medium';
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd) && /\d/.test(pwd) && /[!@#$%^&*]/.test(pwd)) {
      return 'strong';
    }
    return 'medium';
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

  // 倒计时效果
  useEffect(() => {
    if (verificationCountdown <= 0) return;

    const timer = setInterval(() => {
      setVerificationCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [verificationCountdown]);

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
      setErrors({ ...errors, verificationCode: '今天发送次数已达上限（10次）' });
      return;
    }

    setIsLoading(true);
    try {
      // 模拟发送验证码
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setVerificationCountdown(60);
      setDailyCodeCount((prev) => prev + 1);
      setErrors({ ...errors, verificationCode: '' });
    } catch (error) {
      setErrors({ ...errors, verificationCode: '发送验证码失败，请重试' });
    } finally {
      setIsLoading(false);
    }
  };

  // 验证邮箱和验证码
  const handleVerifyEmail = () => {
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = '请输入邮箱地址';
    } else if (!validateEmail(email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }

    if (!verificationCode) {
      newErrors.verificationCode = '请输入验证码';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      // 模拟验证验证码
      setTimeout(() => {
        setStep('reset');
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      setErrors({ submit: '验证失败，请重试' });
      setIsLoading(false);
    }
  };

  // 重置密码
  const handleResetPassword = () => {
    const newErrors: Record<string, string> = {};

    if (!newPassword) {
      newErrors.newPassword = '请设置新密码';
    } else if (!validatePassword(newPassword)) {
      newErrors.newPassword = '密码至少6位，包含字母和数字';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = '请确认密码';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      // 模拟重置密码
      setTimeout(() => {
        setStep('success');
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      setErrors({ submit: '重置密码失败，请重试' });
      setIsLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">重置密码</h1>
          <p className="text-gray-400 text-sm">
            {step === 'email' && '请输入注册邮箱，我们将发送验证码到您的邮箱'}
            {step === 'verification' && '请输入发送到您邮箱的验证码'}
            {step === 'reset' && '请设置新密码'}
            {step === 'success' && '密码重置成功'}
          </p>
        </div>

        {/* 表单 */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 space-y-4 mb-6">
          {/* 第一步：输入邮箱 */}
          {step === 'email' && (
            <>
              <div>
                <label className="flex items-center text-white text-sm mb-2">
                  <Mail className="w-4 h-4 mr-2 text-blue-400" />
                  邮箱地址
                </label>
                <Input
                  type="email"
                  placeholder="请输入注册邮箱"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-500"
                />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
              </div>

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
                {dailyCodeCount > 0 && (
                  <p className="text-gray-400 text-xs mt-1">
                    今天已发送 {dailyCodeCount}/10 次
                  </p>
                )}
              </div>

              <Button
                onClick={handleVerifyEmail}
                disabled={isLoading || !email || !verificationCode}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-2 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '验证中...' : '下一步'}
              </Button>
            </>
          )}

          {/* 第二步：重置密码 */}
          {step === 'reset' && (
            <>
              <div>
                <label className="flex items-center text-white text-sm mb-2">
                  <Lock className="w-4 h-4 mr-2 text-blue-400" />
                  新密码
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="至少6位"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (errors.newPassword) setErrors({ ...errors, newPassword: '' });
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
                {errors.newPassword && <p className="text-red-400 text-xs mt-1">{errors.newPassword}</p>}

                {/* 密码强度提示 */}
                {newPassword && (
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
              </div>

              <Button
                onClick={handleResetPassword}
                disabled={isLoading || !newPassword || !confirmPassword}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-2 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '重置中...' : '重置密码'}
              </Button>
            </>
          )}

          {/* 第三步：成功提示 */}
          {step === 'success' && (
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-16 h-16 text-green-400" />
              </div>
              <h2 className="text-white text-xl font-semibold mb-2">密码重置成功</h2>
              <p className="text-gray-400 text-sm mb-6">您的密码已成功重置，请使用新密码登录</p>
              <Button
                onClick={() => navigate('/user-login')}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-2 rounded-lg transition-all duration-300"
              >
                返回登录
              </Button>
            </div>
          )}
        </div>

        {/* 返回登录链接 */}
        {step !== 'success' && (
          <div className="text-center">
            <button
              onClick={() => navigate('/user-login')}
              className="flex items-center justify-center gap-2 text-purple-400 hover:text-purple-300 text-sm transition-colors mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              返回登录
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
