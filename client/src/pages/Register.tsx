import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, Eye, EyeOff, Chrome, Check, ChevronDown } from 'lucide-react';
import { trpc } from '@/lib/trpc';

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
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPasswordRules, setShowPasswordRules] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 验证邮箱格式
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 验证密码规则
  const validatePassword = (pwd: string) => {
    return pwd.length >= 8 && /[a-zA-Z]/.test(pwd) && /\d/.test(pwd);
  };

  // 检查密码强度
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return 'none';
    if (pwd.length < 8) return 'weak';
    if (/[a-zA-Z]/.test(pwd) && /\d/.test(pwd) && /[!@#$%^&*]/.test(pwd)) return 'strong';
    if (/[a-zA-Z]/.test(pwd) && /\d/.test(pwd)) return 'medium';
    return 'weak';
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    // 验证邮箱
    if (!email) {
      newErrors.email = '请输入邮箱';
    } else if (!validateEmail(email)) {
      newErrors.email = '邮箱格式不正确';
    }

    // 验证密码
    if (!password) {
      newErrors.password = '请设置密码';
    } else if (!validatePassword(password)) {
      newErrors.password = '密码至少8位，需包含字母和数字';
    }

    // 验证确认密码
    if (!confirmPassword) {
      newErrors.confirmPassword = '请再次输入密码';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }

    // 验证协议
    if (!agreeTerms) {
      newErrors.terms = '请同意用户协议和隐私政策';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      try {
        // 调用注册接口
        const result = await trpc.auth.register.useMutation().mutateAsync({
          email,
          password,
          confirmPassword,
        });
        
        if (result.success) {
          setIsSuccess(true);
          // 1.5秒后跳转到首页
          setTimeout(() => {
            navigate('/');
          }, 1500);
        }
      } catch (error: any) {
        const errorMessage = error?.message || '注册失败，请重试';
        setErrors({ submit: errorMessage });
      } finally {
        setIsLoading(false);
      }
    }
  };

  // 处理第三方登录
  const handleThirdPartyRegister = (provider: string) => {
    console.log(`使用 ${provider} 注册`);
    // TODO: 实现第三方注册逻辑
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthColors = {
    none: 'bg-slate-200',
    weak: 'bg-red-500',
    medium: 'bg-yellow-500',
    strong: 'bg-green-500',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* 顶部标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">创建账户</h1>
          <p className="text-slate-400 text-sm">仅需几秒即可完成注册</p>
        </div>

        {/* 注册表单 */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          {/* 邮箱输入 */}
          <div>
            <div className="relative">
              <Input
                type="email"
                placeholder="请输入邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 pl-10 h-12 rounded-lg focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/20 transition-all ${
                  errors.email ? 'border-red-500' : ''
                }`}
              />
              <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* 密码设置 */}
          <div>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="请设置密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 pl-10 pr-10 h-12 rounded-lg focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/20 transition-all ${
                  errors.password ? 'border-red-500' : ''
                }`}
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
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}

            {/* 密码强度指示 */}
            {password && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full ${strengthColors[passwordStrength]} transition-all`} style={{
                      width: passwordStrength === 'none' ? '0%' : passwordStrength === 'weak' ? '33%' : passwordStrength === 'medium' ? '66%' : '100%'
                    }} />
                  </div>
                  <span className="text-xs text-slate-500">
                    {passwordStrength === 'weak' && '弱'}
                    {passwordStrength === 'medium' && '中'}
                    {passwordStrength === 'strong' && '强'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 确认密码 */}
          <div>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="再次输入密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 pl-10 pr-10 h-12 rounded-lg focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/20 transition-all ${
                  errors.confirmPassword ? 'border-red-500' : ''
                }`}
              />
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
          </div>

          {/* 密码规则提示 */}
          <div className="bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setShowPasswordRules(!showPasswordRules)}
              className="w-full flex items-center justify-between px-4 py-3 text-slate-700 hover:bg-slate-200 transition-colors rounded-lg"
            >
              <span className="text-sm font-medium">密码规则</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showPasswordRules ? 'rotate-180' : ''}`} />
            </button>
            {showPasswordRules && (
              <div className="px-4 pb-3 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>至少 8 位字符</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>包含字母（A-Z, a-z）</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>包含数字（0-9）</span>
                </div>
              </div>
            )}
          </div>

          {/* 隐私协议勾选 */}
          <div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-purple-500 focus:ring-purple-500 mt-0.5 flex-shrink-0"
              />
              <span className="text-sm text-slate-600">
                我已阅读并同意
                <a href="#" className="text-purple-600 hover:text-purple-700 font-semibold mx-1">《用户协议》</a>
                和
                <a href="#" className="text-purple-600 hover:text-purple-700 font-semibold mx-1">《隐私政策》</a>
              </span>
            </label>
            {errors.terms && <p className="text-red-500 text-xs mt-1">{errors.terms}</p>}
          </div>

          {/* 注册按钮 */}
          <Button
            type="submit"
            disabled={isLoading || isSuccess}
            className={`w-full h-12 rounded-lg font-semibold text-white transition-all ${
              isSuccess
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'
            }`}
          >
            {isLoading ? '注册中...' : isSuccess ? '✓ 注册成功' : '立即注册'}
          </Button>
        </form>

        {/* 切换登录链接 */}
        <div className="text-center mb-6">
          <p className="text-slate-600 text-sm">
            已有账号？
            <a href="/user-login" className="text-purple-600 hover:text-purple-700 font-semibold transition-colors ml-1">
              去登录 →
            </a>
          </p>
        </div>

        {/* 分隔线 */}
        <div className="relative flex justify-center text-sm mb-6">
          <span className="px-2 bg-slate-800 text-slate-500">或使用其他账号注册</span>
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-slate-700" />
        </div>

        {/* 第三方登录 */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button
            type="button"
            onClick={() => handleThirdPartyRegister('google')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors"
            title="Google注册"
          >
            <Chrome className="w-5 h-5 text-slate-400" />
          </button>
          <button
            type="button"
            onClick={() => handleThirdPartyRegister('line')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors"
            title="LINE注册"
          >
            <LineIcon className="w-5 h-5 text-slate-400" />
          </button>
          <button
            type="button"
            onClick={() => handleThirdPartyRegister('wechat')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors"
            title="微信注册"
          >
            <WeChatIcon className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* 底部Footer */}
        <div className="text-center text-xs text-slate-500">
          <p>© 2026 深夜信箱 · <a href="#" className="hover:text-slate-400">隐私政策</a> · <a href="#" className="hover:text-slate-400">服务条款</a></p>
        </div>
      </div>
    </div>
  );
}
