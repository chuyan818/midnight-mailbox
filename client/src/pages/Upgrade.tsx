/**
 * 会员升级页面
 * 展示会员版本对比和升级选项
 */

import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { MembershipComparison } from '@/components/MembershipComparison';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const Upgrade: React.FC = () => {
  const [location, navigate] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpgrade = async () => {
    setIsProcessing(true);
    try {
      // 调用升级API
      // const response = await trpc.membership.upgrade.mutate({
      //   plan: 'premium',
      //   billingCycle: 'monthly',
      // });
      // 重定向到支付页面或成功页面
      navigate('/mailbox', { replace: true });
    } catch (error) {
      console.error('升级失败:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDowngrade = async () => {
    setIsProcessing(true);
    try {
      // 调用降级API
      // const response = await trpc.membership.downgrade.mutate({});
      navigate('/mailbox', { replace: true });
    } catch (error) {
      console.error('降级失败:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/mailbox')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">升级会员</h1>
          <div className="w-20" />
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <MembershipComparison
          currentTier="free"
          onUpgrade={handleUpgrade}
          onDowngrade={handleDowngrade}
        />
      </div>

      {/* FAQ部分 */}
      <div className="bg-white mt-12 py-12 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">常见问题</h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* 问题1 */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                升级后可以随时取消吗？
              </h3>
              <p className="text-gray-600">
                可以。您可以随时取消订阅，当前计费周期内仍可继续使用会员功能。
              </p>
            </div>

            {/* 问题2 */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                支持哪些支付方式？
              </h3>
              <p className="text-gray-600">
                我们支持支付宝、微信支付、银行卡等多种支付方式。
              </p>
            </div>

            {/* 问题3 */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                年付有优惠吗？
              </h3>
              <p className="text-gray-600">
                有的。年付仅需¥288，相比月付可节省20%。
              </p>
            </div>

            {/* 问题4 */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                升级后数据会丢失吗？
              </h3>
              <p className="text-gray-600">
                不会。升级不会影响您的任何数据，所有信件和报告都会保留。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 底部CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">准备好升级了吗？</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            加入数千名用户，享受无限写信、完整情绪报告和优先客服支持。
          </p>
          <Button
            size="lg"
            onClick={handleUpgrade}
            disabled={isProcessing}
            className="bg-white text-blue-600 hover:bg-blue-50"
          >
            {isProcessing ? '处理中...' : '立即升级'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Upgrade;
