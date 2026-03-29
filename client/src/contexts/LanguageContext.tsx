import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'zh' | 'en' | 'ja' | 'ko';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('zh');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 从localStorage读取保存的语言设置
    const savedLanguage = localStorage.getItem('language') as Language | null;
    if (savedLanguage && ['zh', 'en', 'ja', 'ko'].includes(savedLanguage)) {
      setLanguageState(savedLanguage);
    } else {
      // 检测浏览器语言
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('zh')) {
        setLanguageState('zh');
      } else if (browserLang.startsWith('ja')) {
        setLanguageState('ja');
      } else if (browserLang.startsWith('ko')) {
        setLanguageState('ko');
      } else {
        setLanguageState('en');
      }
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    // 更新HTML lang属性
    document.documentElement.lang = lang;
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}

// 翻译文本映射
export const translations = {
  zh: {
    nav: {
      home: '首页',
      write: '写信',
      mailbox: '我的信箱',
      report: '情绪报告',
      profile: '个人中心',
    },
    profile: {
      title: '个人中心',
      settings: '设置',
      language: '语言',
      membership: '会员信息',
      subscription: '订阅管理',
      account: '账户信息',
      logout: '退出登录',
      email: '邮箱',
      joinDate: '加入时间',
      membershipType: '会员类型',
      free: '免费版',
      monthly: '月会员',
      yearly: '年会员',
      expireDate: '过期日期',
      upgradeMembership: '升级会员',
      cancelMembership: '取消会员',
      selectLanguage: '选择语言',
      chinese: '中文',
      english: 'English',
      japanese: '日本語',
      korean: '한국어',
      languageChanged: '语言已切换',
    },
    common: {
      save: '保存',
      cancel: '取消',
      confirm: '确认',
      delete: '删除',
      edit: '编辑',
      back: '返回',
      loading: '加载中...',
      error: '出错了',
      success: '成功',
    },
  },
  en: {
    nav: {
      home: 'Home',
      write: 'Write',
      mailbox: 'Mailbox',
      report: 'Report',
      profile: 'Profile',
    },
    profile: {
      title: 'Profile',
      settings: 'Settings',
      language: 'Language',
      membership: 'Membership',
      subscription: 'Subscription',
      account: 'Account',
      logout: 'Logout',
      email: 'Email',
      joinDate: 'Join Date',
      membershipType: 'Membership Type',
      free: 'Free',
      monthly: 'Monthly',
      yearly: 'Yearly',
      expireDate: 'Expire Date',
      upgradeMembership: 'Upgrade Membership',
      cancelMembership: 'Cancel Membership',
      selectLanguage: 'Select Language',
      chinese: '中文',
      english: 'English',
      japanese: '日本語',
      korean: '한국어',
      languageChanged: 'Language changed',
    },
    common: {
      save: 'Save',
      cancel: 'Cancel',
      confirm: 'Confirm',
      delete: 'Delete',
      edit: 'Edit',
      back: 'Back',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
    },
  },
  ja: {
    nav: {
      home: 'ホーム',
      write: '手紙を書く',
      mailbox: 'メールボックス',
      report: 'レポート',
      profile: 'プロフィール',
    },
    profile: {
      title: 'プロフィール',
      settings: '設定',
      language: '言語',
      membership: 'メンバーシップ',
      subscription: 'サブスクリプション',
      account: 'アカウント',
      logout: 'ログアウト',
      email: 'メール',
      joinDate: '参加日',
      membershipType: 'メンバーシップタイプ',
      free: '無料',
      monthly: '月間',
      yearly: '年間',
      expireDate: '有効期限',
      upgradeMembership: 'メンバーシップをアップグレード',
      cancelMembership: 'メンバーシップをキャンセル',
      selectLanguage: '言語を選択',
      chinese: '中文',
      english: 'English',
      japanese: '日本語',
      korean: '한국어',
      languageChanged: '言語が変更されました',
    },
    common: {
      save: '保存',
      cancel: 'キャンセル',
      confirm: '確認',
      delete: '削除',
      edit: '編集',
      back: '戻る',
      loading: '読み込み中...',
      error: 'エラー',
      success: '成功',
    },
  },
  ko: {
    nav: {
      home: '홈',
      write: '편지 쓰기',
      mailbox: '메일박스',
      report: '보고서',
      profile: '프로필',
    },
    profile: {
      title: '프로필',
      settings: '설정',
      language: '언어',
      membership: '멤버십',
      subscription: '구독',
      account: '계정',
      logout: '로그아웃',
      email: '이메일',
      joinDate: '가입 날짜',
      membershipType: '멤버십 유형',
      free: '무료',
      monthly: '월간',
      yearly: '연간',
      expireDate: '만료 날짜',
      upgradeMembership: '멤버십 업그레이드',
      cancelMembership: '멤버십 취소',
      selectLanguage: '언어 선택',
      chinese: '中文',
      english: 'English',
      japanese: '日本語',
      korean: '한국어',
      languageChanged: '언어가 변경되었습니다',
    },
    common: {
      save: '저장',
      cancel: '취소',
      confirm: '확인',
      delete: '삭제',
      edit: '편집',
      back: '뒤로',
      loading: '로드 중...',
      error: '오류',
      success: '성공',
    },
  },
};

export function t(key: string, lang?: Language): string {
  const context = useContext(LanguageContext);
  const currentLang = lang || context?.language || 'zh';
  
  const keys = key.split('.');
  let value: any = translations[currentLang];
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return value || key;
}
