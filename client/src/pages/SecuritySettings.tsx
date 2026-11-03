import { useEffect, useState } from "react";
import { AlertCircle, Check, Edit2, Lock, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

const SECURITY_QUESTIONS = [
  "你最喜欢的宠物叫什么名字？",
  "你出生的城市是哪里？",
  "你母亲的娘家姓氏是什么？",
  "你第一个朋友的名字是什么？",
  "你最喜欢的书籍或电影是什么？",
  "你高中就读的学校名称是什么？",
];

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export default function SecuritySettings() {
  const utils = trpc.useUtils();
  const settingsQuery = trpc.security.get.useQuery();
  const verifyMutation = trpc.security.verify.useMutation();
  const updateMutation = trpc.security.update.useMutation();
  const resetMutation = trpc.security.reset.useMutation();
  const configured = settingsQuery.data?.configured ?? false;

  const [step, setStep] = useState<"verify" | "change">("verify");
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [newQuestion, setNewQuestion] = useState(SECURITY_QUESTIONS[1]);
  const [newAnswer, setNewAnswer] = useState("");
  const [confirmAnswer, setConfirmAnswer] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!settingsQuery.isLoading) {
      setStep(configured ? "verify" : "change");
    }
  }, [configured, settingsQuery.isLoading]);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    clearMessages();
    if (currentAnswer.trim().length < 2) {
      setError("请输入至少 2 个字符的当前答案");
      return;
    }
    try {
      const result = await verifyMutation.mutateAsync({ answer: currentAnswer });
      if (!result.verified) {
        setError("当前安全问题答案不正确");
        return;
      }
      setStep("change");
    } catch (err) {
      setError(getErrorMessage(err, "验证失败，请稍后重试"));
    }
  };

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    clearMessages();
    if (newAnswer.trim().length < 2) {
      setError("新答案至少需要 2 个字符");
      return;
    }
    if (newAnswer !== confirmAnswer) {
      setError("两次输入的新答案不一致");
      return;
    }
    try {
      await updateMutation.mutateAsync({
        currentAnswer: configured ? currentAnswer : undefined,
        question: newQuestion,
        answer: newAnswer,
      });
      await utils.security.get.invalidate();
      setSuccess("安全问题已保存，答案已使用密码哈希加密存储");
      setNewAnswer("");
      setConfirmAnswer("");
      setCurrentAnswer("");
      setStep("verify");
    } catch (err) {
      setError(getErrorMessage(err, "保存失败，请检查当前答案后重试"));
    }
  };

  const handleReset = async () => {
    const currentPassword = window.prompt("请输入当前登录密码以确认重置安全问题");
    if (!currentPassword) return;
    clearMessages();
    try {
      await resetMutation.mutateAsync({ currentPassword });
      await utils.security.get.invalidate();
      setCurrentAnswer("");
      setNewAnswer("");
      setConfirmAnswer("");
      setSuccess("安全问题已重置");
    } catch (err) {
      setError(getErrorMessage(err, "重置失败，请确认当前密码正确"));
    }
  };

  const isLoading = settingsQuery.isLoading || verifyMutation.isPending || updateMutation.isPending || resetMutation.isPending;
  const question = settingsQuery.data?.question || "尚未设置安全问题";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-blue-400 mr-2" />
            <h1 className="text-3xl font-bold text-white">安全问题管理</h1>
          </div>
          <p className="text-gray-400 text-sm">安全问题答案只保存密码哈希，不会以明文写入数据库。</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
          {settingsQuery.isLoading ? (
            <p className="py-8 text-center text-gray-300">正在读取安全设置…</p>
          ) : settingsQuery.isError ? (
            <p className="py-8 text-center text-red-300">无法读取安全设置，请确认已登录后重试。</p>
          ) : success ? (
            <div className="text-center py-8">
              <Check className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <p className="text-white text-lg font-medium">{success}</p>
              <Button type="button" onClick={() => { setSuccess(""); setStep(configured ? "verify" : "change"); }} className="mt-6 bg-blue-600 hover:bg-blue-700">继续</Button>
            </div>
          ) : step === "verify" && configured ? (
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="flex items-center text-white text-sm mb-2"><Lock className="w-4 h-4 mr-2 text-blue-400" />当前安全问题</label>
                <div className="bg-white/5 border border-white/20 rounded-lg p-4"><p className="text-white font-medium">{question}</p></div>
              </div>
              <Input type="password" autoComplete="off" placeholder="输入当前答案" value={currentAnswer} onChange={(e) => setCurrentAnswer(e.target.value)} className="bg-white/5 border-white/20 text-white placeholder:text-gray-500" />
              <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium py-3 rounded-lg">{verifyMutation.isPending ? "验证中…" : "验证答案"}</Button>
            </form>
          ) : (
            <form onSubmit={handleUpdate} className="space-y-4">
              {configured && <p className="text-sm text-gray-300">验证通过后可以更新当前安全问题。</p>}
              <div>
                <label className="flex items-center text-white text-sm mb-2"><Edit2 className="w-4 h-4 mr-2 text-blue-400" />选择安全问题</label>
                <select value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} className="w-full bg-white/5 border border-white/20 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-blue-400">
                  {SECURITY_QUESTIONS.map((item) => <option key={item} value={item} className="bg-slate-900">{item}</option>)}
                </select>
              </div>
              <Input type="password" autoComplete="new-password" placeholder="输入新答案" value={newAnswer} onChange={(e) => setNewAnswer(e.target.value)} className="bg-white/5 border-white/20 text-white placeholder:text-gray-500" />
              <Input type="password" autoComplete="new-password" placeholder="再次确认新答案" value={confirmAnswer} onChange={(e) => setConfirmAnswer(e.target.value)} className="bg-white/5 border-white/20 text-white placeholder:text-gray-500" />
              {error && <p className="text-red-300 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" />{error}</p>}
              <div className="flex gap-3">
                {configured && <Button type="button" onClick={() => { clearMessages(); setStep("verify"); }} disabled={isLoading} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white">返回</Button>}
                <Button type="submit" disabled={isLoading} className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white">{updateMutation.isPending ? "保存中…" : "保存安全问题"}</Button>
              </div>
              {configured && <Button type="button" onClick={handleReset} disabled={isLoading} className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-600/30"><RotateCcw className="w-4 h-4 mr-2" />使用当前密码重置</Button>}
            </form>
          )}
          {error && !success && step === "verify" && <p className="mt-4 text-red-300 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" />{error}</p>}
        </div>

        <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <p className="text-blue-300 text-sm"><strong>提示：</strong>安全问题用于账户身份验证。请使用只有你知道、但不容易被猜到的答案。</p>
        </div>
      </div>
    </div>
  );
}
