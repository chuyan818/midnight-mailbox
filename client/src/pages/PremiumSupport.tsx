/**
 * 高级会员优先客服支持页面
 * 展示优先客服支持的具体内容和联系方式
 */

import React, { useState } from 'react';
import { useAuth } from '../_core/hooks/useAuth';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { AlertCircle, Clock, MessageSquare, Phone, Mail, CheckCircle2 } from 'lucide-react';

interface SupportBenefit {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const SUPPORT_BENEFITS: SupportBenefit[] = [
  {
    id: 'priority-response',
    title: '优先响应',
    description: '我们承诺在24小时内回复您的所有问题，普通用户需要等待48小时',
    icon: <Clock className="w-6 h-6" />,
  },
  {
    id: 'dedicated-support',
    title: '专属客服',
    description: '您将被分配一位专属客服代表，了解您的需求并提供个性化支持',
    icon: <MessageSquare className="w-6 h-6" />,
  },
  {
    id: 'multiple-channels',
    title: '多渠道支持',
    description: '通过站内信、邮件、电话等多种方式联系我们，我们随时准备帮助您',
    icon: <Phone className="w-6 h-6" />,
  },
  {
    id: 'technical-support',
    title: '技术支持',
    description: '获得优先的技术支持，解决任何使用问题或功能建议',
    icon: <AlertCircle className="w-6 h-6" />,
  },
  {
    id: 'feedback-priority',
    title: '反馈优先',
    description: '您的功能建议和反馈将被优先考虑，直接影响产品开发方向',
    icon: <CheckCircle2 className="w-6 h-6" />,
  },
  {
    id: 'vip-treatment',
    title: 'VIP待遇',
    description: '享受VIP用户的特殊待遇，包括优先参与内测和特殊活动',
    icon: <Mail className="w-6 h-6" />,
  },
];

interface ContactForm {
  subject: string;
  category: 'technical' | 'feedback' | 'billing' | 'other';
  message: string;
}

export const PremiumSupport: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<ContactForm>({
    subject: '',
    category: 'technical',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 模拟提交表单
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 实际应该调用后端API
      console.log('提交客服支持请求:', formData);

      setSubmitted(true);
      setFormData({
        subject: '',
        category: 'technical',
        message: '',
      });

      // 3秒后重置提交状态
      setTimeout(() => setSubmitted(false), 3000);
    } catch (error) {
      console.error('提交失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-purple-900 to-indigo-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">高级会员优先客服支持</h1>
          <p className="text-xl text-gray-300">
            享受24小时优先响应和专属客服代表的个性化服务
          </p>
        </div>

        {/* 权益列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {SUPPORT_BENEFITS.map((benefit) => (
            <Card key={benefit.id} className="bg-white/10 backdrop-blur border-white/20 p-6 hover:bg-white/15 transition-colors">
              <div className="flex gap-4">
                <div className="text-yellow-400 flex-shrink-0">{benefit.icon}</div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">{benefit.title}</h3>
                  <p className="text-gray-300 text-sm">{benefit.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* 联系方式 */}
        <Card className="bg-white/10 backdrop-blur border-white/20 p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">联系我们</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <Mail className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">邮件支持</h3>
              <p className="text-gray-300 text-sm">support@midnight-mailbox.com</p>
              <p className="text-gray-400 text-xs mt-2">24小时内回复</p>
            </div>
            <div className="text-center">
              <Phone className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">电话支持</h3>
              <p className="text-gray-300 text-sm">400-800-8888</p>
              <p className="text-gray-400 text-xs mt-2">工作日 9:00-18:00</p>
            </div>
            <div className="text-center">
              <MessageSquare className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">在线客服</h3>
              <p className="text-gray-300 text-sm">站内信沟通</p>
              <p className="text-gray-400 text-xs mt-2">实时响应</p>
            </div>
          </div>
        </Card>

        {/* 客服支持表单 */}
        {user && (
          <Card className="bg-white/10 backdrop-blur border-white/20 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">提交支持请求</h2>

            {submitted && (
              <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
                <p className="text-green-300">✓ 您的请求已成功提交，我们的客服团队将在24小时内与您联系。</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-white font-semibold mb-2">问题分类</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400"
                >
                  <option value="technical" className="bg-gray-900">技术问题</option>
                  <option value="feedback" className="bg-gray-900">功能建议</option>
                  <option value="billing" className="bg-gray-900">账单问题</option>
                  <option value="other" className="bg-gray-900">其他问题</option>
                </select>
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">问题标题</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="请简要描述您的问题"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400"
                  required
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">详细描述</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="请详细描述您的问题或建议"
                  rows={6}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 resize-none"
                  required
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-yellow-400 text-gray-900 font-semibold py-3 rounded-lg hover:bg-yellow-300 transition-colors disabled:opacity-50"
                >
                  {isLoading ? '提交中...' : '提交请求'}
                </Button>
              </div>
            </form>

            <p className="text-gray-400 text-sm mt-6 text-center">
              作为高级会员，您将获得优先处理。我们承诺在24小时内回复您的所有请求。
            </p>
          </Card>
        )}

        {!user && (
          <Card className="bg-white/10 backdrop-blur border-white/20 p-8 text-center">
            <p className="text-gray-300 mb-4">请先登录以提交客服支持请求</p>
            <Button className="bg-yellow-400 text-gray-900 font-semibold px-8 py-2 rounded-lg hover:bg-yellow-300 transition-colors">
              登录
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PremiumSupport;
