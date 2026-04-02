/**
 * 会员徽章组件
 * 显示用户的会员等级和身份标识
 */

import React from 'react';
import { MembershipTier } from '../../../server/membership-config';

interface MembershipBadgeProps {
  tier: MembershipTier;
  size?: 'small' | 'medium' | 'large';
  showTooltip?: boolean;
  className?: string;
}

const BADGE_CONFIG = {
  free: {
    name: '普通用户',
    icon: '👤',
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
    borderColor: 'border-slate-300',
    tooltip: '普通用户 - 每天可发送1封回信',
  },
  standard: {
    name: '标准会员',
    icon: '⭐',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-300',
    tooltip: '标准会员 - 每天可发送5封回信，享受优先投递服务',
  },
  premium: {
    name: '高级会员',
    icon: '👑',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-300',
    tooltip: '高级会员 - 无限回信，享受AI深度分析和优先客服支持',
  },
};

const SIZE_CONFIG = {
  small: {
    padding: 'px-2 py-1',
    fontSize: 'text-xs',
    iconSize: 'text-sm',
    gap: 'gap-1',
  },
  medium: {
    padding: 'px-3 py-1.5',
    fontSize: 'text-sm',
    iconSize: 'text-base',
    gap: 'gap-2',
  },
  large: {
    padding: 'px-4 py-2',
    fontSize: 'text-base',
    iconSize: 'text-lg',
    gap: 'gap-2',
  },
};

export const MembershipBadge: React.FC<MembershipBadgeProps> = ({
  tier,
  size = 'medium',
  showTooltip = true,
  className = '',
}) => {
  const badge = BADGE_CONFIG[tier];
  const sizeClass = SIZE_CONFIG[size];

  const badgeElement = (
    <div
      className={`
        inline-flex items-center rounded-lg border font-semibold
        ${sizeClass.padding} ${sizeClass.fontSize} ${sizeClass.gap}
        ${badge.bgColor} ${badge.borderColor} ${badge.color}
        ${className}
      `}
    >
      <span className={sizeClass.iconSize}>{badge.icon}</span>
      <span>{badge.name}</span>
    </div>
  );

  if (!showTooltip) {
    return badgeElement;
  }

  return (
    <div className="relative group inline-block">
      {badgeElement}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        {badge.tooltip}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
};

export default MembershipBadge;
