import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function MembershipCenter() {
  const [, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');

  const features = [
    {
      icon: '✉️',
      title: '医名倾诉',
      description: '完全匿名，没有评判，只有理解',
    },
    {
      icon: '💬',
      title: '情绪回信',
      description: 'AI会真诚地倾听，给予温暖的回应',
    },
    {
      icon: '⭐',
      title: '今日一句',
      description: '每天一句话，最温暖的陪伴',
    },
    {
      icon: '📊',
      title: '情绪轨迹',
      description: '记录你的情绪变化，陪你一起成长',
    },
  ];

  const functionCards = [
    {
      icon: '💌',
      title: '写给过去的自己',
      description: '回顾过去，治愈自己',
    },
    {
      icon: '✈️',
      title: '写给一个未回复的人',
      description: '说出来就放下了',
    },
    {
      icon: '🎁',
      title: '写给未来的自己',
      description: '给未来的你一份信',
    },
    {
      icon: '🪶',
      title: '随便说说',
      description: '记心事随便讲述',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* 背景装饰 */}
      <div className="fixed inset-0 pointer-events-none">
        {/* 月亮 */}
        <div className="absolute top-20 right-20 w-24 h-24 rounded-full bg-yellow-200 opacity-20 blur-2xl"></div>
        {/* 星星 */}
        <div className="absolute top-10 left-1/4 w-1 h-1 bg-white rounded-full opacity-60 animate-pulse"></div>
        <div className="absolute top-32 right-1/3 w-1 h-1 bg-white rounded-full opacity-40 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-white rounded-full opacity-50 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* 顶部导航 */}
      <div className="relative z-10 flex justify-between items-center px-6 py-4 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📬</span>
          <span className="text-lg font-semibold">深夜信箱</span>
        </div>
        <button className="text-yellow-400 hover:text-yellow-300 transition">会员中心</button>
      </div>

      {/* 主内容 */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* 主标题部分 */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            写给深夜里的自己，<br />
            也写给未来的回应。
          </h1>
          <p className="text-slate-400 text-lg mb-8">
            在深夜，当你感到孤独、焦虑或压力时，<br />
            把心事写进信箱，我们会用温柔的话语陪伴你。
          </p>
          <p className="text-slate-500 text-sm">
            不是心理医生，不是导师，<br />
            只是一个认真倾听，温柔回复的人。
          </p>
        </div>

        {/* 功能卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          {functionCards.map((card, index) => (
            <div
              key={index}
              className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-yellow-400/50 transition backdrop-blur-sm"
            >
              <div className="text-3xl mb-3">{card.icon}</div>
              <h3 className="font-semibold mb-2">{card.title}</h3>
              <p className="text-sm text-slate-400">{card.description}</p>
            </div>
          ))}
        </div>

        {/* CTA 按钮 */}
        <div className="flex flex-col items-center gap-4 mb-16">
          <Button
            onClick={() => setLocation('/write')}
            className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-semibold px-8 py-3 rounded-full text-lg transition transform hover:scale-105"
          >
            开始今晚的信 ✨
          </Button>
          <button className="text-slate-400 hover:text-slate-300 text-sm flex items-center gap-1">
            <span>⚙️</span> 存进时间胶囊
          </button>
        </div>

        {/* 功能介绍 */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
            <span>信箱的温暖能力 +</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl mb-3">{feature.icon}</div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 会员对比 */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-8 text-center">让深夜有回应的人，不止你一个</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 月会员 */}
            <Card className="bg-slate-800/50 border border-slate-700 p-8 hover:border-slate-600 transition">
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-3xl font-bold">🌙</span>
                <h3 className="text-xl font-semibold">夜行者计划</h3>
                <span className="text-slate-400 text-sm">月度赠送</span>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold">¥29</span>
                <span className="text-slate-400">/月</span>
              </div>
              <ul className="space-y-3 mb-8 text-slate-300">
                <li className="flex items-center gap-2">
                  <span>✓</span> 无限写信
                </li>
                <li className="flex items-center gap-2">
                  <span>✓</span> AI回信回复
                </li>
                <li className="flex items-center gap-2">
                  <span>✓</span> 完整情绪分析
                </li>
                <li className="flex items-center gap-2">
                  <span>✓</span> 7天情绪趋势
                </li>
              </ul>
              <Button className="w-full bg-slate-700 hover:bg-slate-600 text-white">
                立即升级
              </Button>
            </Card>

            {/* 年会员 */}
            <Card className="bg-gradient-to-br from-yellow-900/30 to-slate-800/50 border border-yellow-600/50 p-8 relative">
              <div className="absolute top-4 right-4 bg-yellow-500 text-slate-900 px-3 py-1 rounded-full text-xs font-semibold">
                推荐
              </div>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-3xl font-bold">✨</span>
                <h3 className="text-xl font-semibold">长期陪伴计划</h3>
                <span className="text-slate-400 text-sm">年度赠送</span>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold">¥288</span>
                <span className="text-slate-400">/年</span>
                <div className="text-sm text-yellow-400 mt-1">仅¥24/月</div>
              </div>
              <ul className="space-y-3 mb-8 text-slate-300">
                <li className="flex items-center gap-2">
                  <span>✓</span> 无限写信
                </li>
                <li className="flex items-center gap-2">
                  <span>✓</span> AI深度回复
                </li>
                <li className="flex items-center gap-2">
                  <span>✓</span> 完整情绪分析
                </li>
                <li className="flex items-center gap-2">
                  <span>✓</span> 7天情绪趋势
                </li>
              </ul>
              <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-semibold">
                立即开通
              </Button>
            </Card>
          </div>
        </div>

        {/* 底部文案 */}
        <div className="text-center text-slate-500 text-sm">
          <p>让深夜有回应的人，不止你一个</p>
        </div>
      </div>
    </div>
  );
}
