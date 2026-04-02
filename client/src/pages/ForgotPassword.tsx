import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';

export default function ForgotPassword() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<'email' | 'verification' | 'security' | 'reset' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [securityAttempts, setSecurityAttempts] = useState(3);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [verificationCountdown, setVerificationCountdown] = useState(0);
  const [dailyCodeCount, setDailyCodeCount] = useState(0);
  const [emailValidationMessage, setEmailValidationMessage] = useState('');
  const [emailValidationStatus, setEmailValidationStatus] = useState<'valid' | 'invalid' | 'empty'>('empty');
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // 安全问题列表
  const securityQuestions = [
    '您最喜欢的电影是什么？',
    '您的宠物名字是什么？',
    '您出生地的城市是什么？',
    '您第一份工作的公司名称是什么？',
    '您最喜欢的书籍是什么？',
    '您的高中名称是什么？',
  ];

  // 验证邮箱格式
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 邮箱实时校验
  const handleEmailChange = (value: string) => {
    setEmail(value);
    
    if (!value) {
      setEmailValidationStatus('empty');
      setEmailValidationMessage('');
      setErrors({ ...errors, email: '' });
      return;
    }

    if (validateEmail(value)) {
      setEmailValidationStatus('valid');
      setEmailValidationMessage('邮箱格式正确');
      setErrors({ ...errors, email: '' });
    } else {
      setEmailValidationStatus('invalid');
      setEmailValidationMessage('邮箱格式不正确');
      setErrors({ ...errors, email: '请输入有效的邮箱地址' });
    }
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
        // 随机选择一个安全问题
        const randomQuestion = securityQuestions[Math.floor(Math.random() * securityQuestions.length)];
        setSecurityQuestion(randomQuestion);
        setStep('security');
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      setErrors({ submit: '验证失败，请重试' });
      setIsLoading(false);
    }
  };

  // 验证安全问题
  const handleVerifySecurity = () => {
    if (!securityAnswer.trim()) {
      setErrors({ ...errors, securityAnswer: '请输入安全问题的答案' });
      return;
    }

    // 模拟验证（实际应用中应比较与数据库中存储的答案）
    if (securityAnswer.toLowerCase() === 'test') {
      setStep('reset');
      setErrors({});
      setSecurityAnswer('');
    } else {
      const attemptsLeft = securityAttempts - 1;
      setSecurityAttempts(attemptsLeft);

      if (attemptsLeft <= 0) {
        setErrors({ ...errors, securityAnswer: '尝试次数已用尽，请稍后再试' });
        setStep('email');
        setSecurityAttempts(3);
        setSecurityAnswer('');
      } else {
        setErrors({ ...errors, securityAnswer: `答案错误，还有 ${attemptsLeft} 次尝试机会` });
        setSecurityAnswer('');
      }
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
        
        // 1.5秒后自动跳转到登录页面并预填邮箱
        setTimeout(() => {
          const encodedEmail = encodeURIComponent(email);
          navigate(`/user-login?email=${encodedEmail}`);
        }, 1500);
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
            {step === 'security' && '请回答安全问题以验证身份'}
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
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="请输入注册邮箱"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className={`bg-white/5 border-white/20 text-white placeholder:text-gray-500 ${
                      emailValidationStatus === 'valid' ? 'border-green-500' : emailValidationStatus === 'invalid' ? 'border-red-500' : ''
                    }`}
                  />
                  {emailValidationStatus === 'valid' && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-400">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  )}
                  {emailValidationStatus === 'invalid' && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-400">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                  )}
                </div>
                {emailValidationMessage && (
                  <p className={`text-xs mt-1 ${
                    emailValidationStatus === 'valid' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {emailValidationMessage}
                  </p>
                )}
                {errors.email && !emailValidationMessage && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
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
                    maxLength={6}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setVerificationCode(value);
                      if (errors.verificationCode) setErrors({ ...errors, verificationCode: '' });
                    }}
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 flex-1"
                  />
                  <Button
                    onClick={handleSendVerificationCode}
                    disabled={isLoading || verificationCountdown > 0 || emailValidationStatus !== 'valid'}
                    className={`px-4 whitespace-nowrap ${
                      emailValidationStatus === 'valid'
                        ? 'bg-blue-500 hover:bg-blue-600 text-white'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
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
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-2 rounded-lg transition-all duration-200"
              >
                {isLoading ? '验证中...' : '下一步'}
              </Button>
            </>
          )}

          {/* 第二步：安全问题验证 */}
          {step === 'security' && (
            <>
              <div>
                <label className="flex items-center text-white text-sm mb-2">
                  <HelpCircle className="w-4 h-4 mr-2 text-purple-400" />
                  安全问题
                </label>
                <div className="bg-white/5 border border-white/20 rounded-lg p-4 mb-4">
                  <p className="text-white font-medium">{securityQuestion}</p>
                </div>
              </div>

              <div>
                <label className="flex items-center text-white text-sm mb-2">
                  <Lock className="w-4 h-4 mr-2 text-purple-400" />
                  您的答案
                </label>
                <Input
                  type="text"
                  placeholder="请输入答案"
                  value={securityAnswer}
                  onChange={(e) => {
                    setSecurityAnswer(e.target.value);
                    if (errors.securityAnswer) setErrors({ ...errors, securityAnswer: '' });
                  }}
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-500"
                />
                {errors.securityAnswer && <p className="text-red-400 text-xs mt-1">{errors.securityAnswer}</p>}
                {securityAttempts < 3 && (
                  <p className="text-yellow-400 text-xs mt-1">
                    还有 {securityAttempts} 次尝试机会
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setStep('email');
                    setSecurityAnswer('');
                    setSecurityAttempts(3);
                    setErrors({});
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
                >
                  返回
                </Button>
                <Button
                  onClick={handleVerifySecurity}
                  disabled={isLoading || !securityAnswer.trim()}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold"
                >
                  {isLoading ? '验证中...' : '验证答案'}
                </Button>
              </div>
            </>
          )}

          {/* 第三步：重置密码 */}
          {step === 'reset' && (
            <>
              <div>
                <label className="flex items-center text-white text-sm mb-2">
                  <Lock className="w-4 h-4 mr-2 text-purple-400" />
                  新密码
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="请设置新密码"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (errors.newPassword) setErrors({ ...errors, newPassword: '' });
                    }}
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.newPassword && <p className="text-red-400 text-xs mt-1">{errors.newPassword}</p>}
                {newPassword && (
                  <p className={`text-xs mt-1 ${getStrengthColor(passwordStrength)}`}>
                    密码强度：{getStrengthText(passwordStrength)}
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-center text-white text-sm mb-2">
                  <Lock className="w-4 h-4 mr-2 text-purple-400" />
                  确认密码
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="请再次输入密码"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                    }}
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>

              <Button
                onClick={handleResetPassword}
                disabled={isLoading || !newPassword || !confirmPassword}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-2 rounded-lg transition-all duration-200"
              >
                {isLoading ? '重置中...' : '重置密码'}
              </Button>
            </>
          )}

          {/* 第四步：成功 */}
          {step === 'success' && (
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center animate-pulse">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">密码重置成功</h2>
              <p className="text-gray-400 text-sm">正在跳转到登录页面...</p>
            </div>
          )}
        </div>

        {/* 返回登录链接 */}
        {step !== 'success' && (
          <div className="text-center">
            <button
              onClick={() => navigate('/user-login')}
              className="text-blue-400 hover:text-blue-300 text-sm flex items-center justify-center gap-1 mx-auto"
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
