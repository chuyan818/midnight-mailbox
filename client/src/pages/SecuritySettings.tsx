import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Edit2, RotateCcw, Check, AlertCircle } from 'lucide-react';

const SECURITY_QUESTIONS = [
  '你最喜欢的宠物叫什么名字？',
  '你出生的城市是哪里？',
  '你母亲的娘家姓氏是什么？',
  '你第一个朋友的名字是什么？',
  '你最喜欢的书籍或电影是什么？',
  '你高中就读的学校名称是什么？',
];

export default function SecuritySettings() {
  const [currentQuestion, setCurrentQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [newQuestion, setNewQuestion] = useState(SECURITY_QUESTIONS[1]);
  const [newAnswer, setNewAnswer] = useState('');
  const [confirmAnswer, setConfirmAnswer] = useState('');
  const [step, setStep] = useState<'verify' | 'change'>('verify');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  // 验证当前安全问题答案
  const handleVerifyCurrentAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!currentAnswer) {
      newErrors.currentAnswer = '请输入当前安全问题的答案';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    
    // 模拟验证
    setTimeout(() => {
      setIsLoading(false);
      // 这里应该调用后端API验证答案
      setStep('change');
    }, 1000);
  };

  // 修改安全问题
  const handleChangeSecurityQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!newQuestion) {
      newErrors.newQuestion = '请选择新的安全问题';
    }

    if (!newAnswer) {
      newErrors.newAnswer = '请输入新问题的答案';
    } else if (newAnswer.length < 2) {
      newErrors.newAnswer = '答案至少需要2个字符';
    }

    if (!confirmAnswer) {
      newErrors.confirmAnswer = '请确认答案';
    } else if (newAnswer !== confirmAnswer) {
      newErrors.confirmAnswer = '两次输入的答案不一致';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    
    // 模拟修改
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);

      // 2秒后重置
      setTimeout(() => {
        setIsSuccess(false);
        setStep('verify');
        setCurrentQuestion(newQuestion);
        setCurrentAnswer('');
        setNewQuestion(SECURITY_QUESTIONS[0]);
        setNewAnswer('');
        setConfirmAnswer('');
        setErrors({});
      }, 2000);
    }, 1500);
  };

  // 重置安全问题
  const handleResetSecurityQuestion = async () => {
    if (!window.confirm('确定要重置安全问题吗？这将清除当前的安全问题设置。')) {
      return;
    }

    setIsLoading(true);
    
    // 模拟重置
    setTimeout(() => {
      setIsLoading(false);
      setStep('verify');
      setCurrentQuestion(SECURITY_QUESTIONS[0]);
      setCurrentAnswer('');
      setNewQuestion(SECURITY_QUESTIONS[1]);
      setNewAnswer('');
      setConfirmAnswer('');
      setErrors({});
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* 标题 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-blue-400 mr-2" />
            <h1 className="text-3xl font-bold text-white">安全问题管理</h1>
          </div>
          <p className="text-gray-400 text-sm">管理您的账户安全问题，用于密码重置时的身份验证</p>
        </div>

        {/* 表单 */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
          {isSuccess ? (
            <div className="text-center py-8">
              <Check className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <p className="text-white text-lg font-medium">安全问题已更新</p>
              <p className="text-gray-400 text-sm mt-2">您的安全问题已成功修改</p>
            </div>
          ) : step === 'verify' ? (
            <form onSubmit={handleVerifyCurrentAnswer} className="space-y-4">
              <div>
                <label className="flex items-center text-white text-sm mb-2">
                  <Lock className="w-4 h-4 mr-2 text-blue-400" />
                  当前安全问题
                </label>
                <div className="bg-white/5 border border-white/20 rounded-lg p-4">
                  <p className="text-white font-medium">{currentQuestion}</p>
                </div>
              </div>

              <div>
                <label className="flex items-center text-white text-sm mb-2">
                  <Lock className="w-4 h-4 mr-2 text-blue-400" />
                  请输入答案
                </label>
                <Input
                  type="text"
                  placeholder="输入您的答案"
                  value={currentAnswer}
                  onChange={(e) => {
                    setCurrentAnswer(e.target.value);
                    if (errors.currentAnswer) setErrors({ ...errors, currentAnswer: '' });
                  }}
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-500"
                />
                {errors.currentAnswer && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.currentAnswer}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 rounded-lg"
              >
                {isLoading ? '验证中...' : '验证答案'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleChangeSecurityQuestion} className="space-y-4">
              <div>
                <label className="flex items-center text-white text-sm mb-2">
                  <Edit2 className="w-4 h-4 mr-2 text-blue-400" />
                  选择新的安全问题
                </label>
                <select
                  value={newQuestion}
                  onChange={(e) => {
                    setNewQuestion(e.target.value);
                    if (errors.newQuestion) setErrors({ ...errors, newQuestion: '' });
                  }}
                  className="w-full bg-white/5 border border-white/20 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-blue-400"
                >
                  {SECURITY_QUESTIONS.map((q) => (
                    <option key={q} value={q} className="bg-slate-900">
                      {q}
                    </option>
                  ))}
                </select>
                {errors.newQuestion && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.newQuestion}
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-center text-white text-sm mb-2">
                  <Lock className="w-4 h-4 mr-2 text-blue-400" />
                  请输入答案
                </label>
                <Input
                  type="text"
                  placeholder="输入新问题的答案"
                  value={newAnswer}
                  onChange={(e) => {
                    setNewAnswer(e.target.value);
                    if (errors.newAnswer) setErrors({ ...errors, newAnswer: '' });
                  }}
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-500"
                />
                {errors.newAnswer && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.newAnswer}
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-center text-white text-sm mb-2">
                  <Lock className="w-4 h-4 mr-2 text-blue-400" />
                  确认答案
                </label>
                <Input
                  type="text"
                  placeholder="再输入一次答案"
                  value={confirmAnswer}
                  onChange={(e) => {
                    setConfirmAnswer(e.target.value);
                    if (errors.confirmAnswer) setErrors({ ...errors, confirmAnswer: '' });
                  }}
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-500"
                />
                {errors.confirmAnswer && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.confirmAnswer}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => setStep('verify')}
                  disabled={isLoading}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 rounded-lg"
                >
                  返回
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 rounded-lg"
                >
                  {isLoading ? '更新中...' : '更新安全问题'}
                </Button>
              </div>

              <Button
                type="button"
                onClick={handleResetSecurityQuestion}
                disabled={isLoading}
                className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 font-medium py-3 rounded-lg border border-red-600/30"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                重置安全问题
              </Button>
            </form>
          )}
        </div>

        {/* 提示 */}
        <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <p className="text-blue-300 text-sm">
            💡 <strong>提示：</strong>安全问题用于在您忘记密码时验证您的身份。请选择只有您知道答案的问题，并牢记您的答案。
          </p>
        </div>
      </div>
    </div>
  );
}
