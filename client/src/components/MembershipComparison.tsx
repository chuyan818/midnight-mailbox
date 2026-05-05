/**
 * 会员对比卡片组件
 * 展示免费版和会员版的功能对比
 */

import React from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface MembershipComparisonProps {
  currentTier?: 'free' | 'premium';
  onUpgrade?: () => void;
  onDowngrade?: () => void;
  className?: string;
}

const FEATURES = [
  { name: '每日写信次数', free: '1封', premium: '无限' },
  { name: 'AI温暖回信', free: '✓', premium: '✓' },
  { name: '情绪报告', free: '简单', premium: '完整' },
  { name: '情绪趋势', free: '无', premium: '7天' },
  { name: '信件收藏', free: '10封', premium: '无限' },
  { name: '主题解锁', free: '基础', premium: '全部' },
  { name: '优先客服', free: '无', premium: '✓' },
];

export const MembershipComparison: React.FC<MembershipComparisonProps> = ({
  currentTier = 'free',
  onUpgrade,
  onDowngrade,
  className = '',
}) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* 标题 */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">选择适合你的版本</h2>
        <p className="text-gray-600">随时升级或降级，没有隐藏费用</p>
      </div>

      {/* 对比卡片 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* 免费版 */}
        <div
          className={`rounded-lg border-2 p-6 transition-all ${
            currentTier === 'free'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">免费版</h3>
            <div className="text-4xl font-bold text-gray-900">
              ¥<span className="text-5xl">0</span>
            </div>
            <p className="text-gray-600 text-sm mt-2">永久免费</p>
          </div>

          {/* 功能列表 */}
          <div className="space-y-3 mb-6">
            {FEATURES.map(feature => (
              <div key={feature.name} className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-gray-700">{feature.name}</span>
                  <span className="text-gray-500 text-sm ml-2">({feature.free})</span>
                </div>
              </div>
            ))}
          </div>

          {/* 按钮 */}
          {currentTier === 'free' ? (
            <Button
              onClick={onUpgrade}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              升级到会员版
            </Button>
          ) : (
            <Button
              onClick={onDowngrade}
              variant="outline"
              className="w-full"
            >
              降级到免费版
            </Button>
          )}
        </div>

        {/* 会员版 */}
        <div
          className={`rounded-lg border-2 p-6 transition-all relative ${
            currentTier === 'premium'
              ? 'border-amber-500 bg-amber-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          {/* 推荐标签 */}
          {currentTier !== 'premium' && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                推荐
              </span>
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">会员版</h3>
            <div className="text-4xl font-bold text-gray-900">
              ¥<span className="text-5xl">29</span>
              <span className="text-lg text-gray-600 font-normal">/月</span>
            </div>
            <p className="text-gray-600 text-sm mt-2">或 ¥288/年（省20%）</p>
          </div>

          {/* 功能列表 */}
          <div className="space-y-3 mb-6">
            {FEATURES.map(feature => (
              <div key={feature.name} className="flex items-center gap-3">
                <Check className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-gray-700">{feature.name}</span>
                  <span className="text-gray-500 text-sm ml-2">({feature.premium})</span>
                </div>
              </div>
            ))}
          </div>

          {/* 按钮 */}
          {currentTier === 'premium' ? (
            <Button
              disabled
              className="w-full bg-gray-300 text-gray-600 cursor-not-allowed"
            >
              当前版本
            </Button>
          ) : (
            <Button
              onClick={onUpgrade}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            >
              升级到会员版
            </Button>
          )}
        </div>
      </div>

      {/* 底部说明 */}
      <div className="bg-gray-50 rounded-lg p-4 text-center text-sm text-gray-600">
        <p>
          升级后立即享受所有会员权益。取消订阅后，当前计费周期内仍可继续使用会员功能。
        </p>
      </div>
    </div>
  );
};

export default MembershipComparison;
