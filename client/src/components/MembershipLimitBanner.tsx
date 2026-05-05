/**
 * 会员限制提示横幅组件
 * 在免费用户达到功能限制时显示升级提示
 */

import React from 'react';
import { AlertCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface MembershipLimitBannerProps {
  type: 'daily-letter-limit' | 'collection-limit' | 'report-limit' | 'theme-limit';
  onUpgrade?: () => void;
  className?: string;
}

const BANNER_CONFIG = {
  'daily-letter-limit': {
    title: '每日写信次数已达上限',
    description: '免费版每天只能写1封信。升级到会员版可无限写信！',
    icon: '📝',
    upgradeText: '升级到会员版',
  },
  'collection-limit': {
    title: '收藏数量已达上限',
    description: '免费版最多收藏10封信。升级到会员版可无限收藏！',
    icon: '⭐',
    upgradeText: '升级到会员版',
  },
  'report-limit': {
    title: '需要升级查看完整报告',
    description: '免费版只能查看简单情绪报告。升级到会员版可查看完整的7天情绪趋势！',
    icon: '📊',
    upgradeText: '升级到会员版',
  },
  'theme-limit': {
    title: '主题需要升级解锁',
    description: '此主题仅限会员使用。升级到会员版解锁所有主题！',
    icon: '🎨',
    upgradeText: '升级到会员版',
  },
};

export const MembershipLimitBanner: React.FC<MembershipLimitBannerProps> = ({
  type,
  onUpgrade,
  className = '',
}) => {
  const config = BANNER_CONFIG[type];

  return (
    <div className={`bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        {/* 图标 */}
        <div className="text-2xl mt-1">{config.icon}</div>

        {/* 内容 */}
        <div className="flex-1">
          <h3 className="font-semibold text-amber-900 mb-1">{config.title}</h3>
          <p className="text-sm text-amber-800 mb-3">{config.description}</p>

          {/* 升级按钮 */}
          <Button
            size="sm"
            onClick={onUpgrade}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
          >
            <Zap className="w-4 h-4 mr-2" />
            {config.upgradeText}
          </Button>
        </div>

        {/* 关闭按钮 */}
        <button
          className="text-amber-400 hover:text-amber-600 transition-colors"
          aria-label="关闭"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default MembershipLimitBanner;
