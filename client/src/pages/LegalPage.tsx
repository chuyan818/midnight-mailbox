import { useLanguage } from "@/contexts/LanguageContext";
import { LANGUAGE_OPTIONS } from "@/lib/page-translations";
import LanguageSelector from "@/components/LanguageSelector";

type LegalKind = "privacy" | "terms";

const legalCopy = {
  zh: {
    privacy: { title: "隐私政策", intro: "我们尊重你的匿名表达，并只收集提供深夜信箱服务所必需的信息。", sections: [["我们收集的信息", "包括邮箱地址、登录安全记录、你主动提交的信件和会员服务记录。匿名信件不会公开你的真实身份。"], ["信息如何使用", "信息用于登录验证、生成温暖回信、情绪分析、保存信件以及改善服务体验。我们不会出售你的个人信息。"], ["你的选择", "你可以在个人中心管理通知、隐私和账户设置，也可以联系我们申请访问、更正或删除个人信息。"]] },
    terms: { title: "用户协议", intro: "欢迎使用深夜信箱。使用服务即表示你理解并同意以下规则。", sections: [["服务定位", "深夜信箱提供匿名倾诉和人工智能陪伴，不是医疗、诊断、危机干预或专业心理咨询服务。"], ["安全使用", "请勿提交他人的敏感信息，也不要将服务用于违法、骚扰、欺诈或伤害他人的行为。遇到紧急危险请联系当地急救或心理危机服务。"], ["账户与内容", "你应妥善保管账户信息，并对主动提交的内容负责。我们会按照隐私政策和适用法律处理服务数据。"]] }
  },
  en: {
    privacy: { title: "Privacy Policy", intro: "We respect your anonymous expression and collect only what is needed to provide Midnight Mailbox.", sections: [["Information we collect", "This may include your email, security records, letters you submit, and membership records. Anonymous letters are not published with your real identity."], ["How we use information", "We use information for sign-in verification, warm replies, emotion analysis, letter storage, and service improvement. We do not sell personal information."], ["Your choices", "You can manage notification, privacy, and account settings, or contact us to request access, correction, or deletion of personal information."]] },
    terms: { title: "Terms of Service", intro: "Welcome to Midnight Mailbox. By using the service, you agree to these rules.", sections: [["What the service is", "Midnight Mailbox offers anonymous expression and AI companionship. It is not medical care, diagnosis, crisis intervention, or professional therapy."], ["Use safely", "Do not submit sensitive information about others or use the service for illegal, abusive, fraudulent, or harmful activity. Contact local emergency or crisis services in immediate danger."], ["Accounts and content", "You are responsible for your account and the content you submit. We process service data according to this policy and applicable law."]] }
  },
  ja: {
    privacy: { title: "プライバシーポリシー", intro: "匿名の表現を尊重し、深夜信箱の提供に必要な情報だけを収集します。", sections: [["収集する情報", "メールアドレス、ログインの安全記録、あなたが送信した手紙、メンバーシップ情報などです。匿名の手紙に実名を表示することはありません。"], ["情報の利用", "ログイン確認、温かな返信、感情分析、手紙の保存、サービス改善に利用します。個人情報を販売することはありません。"], ["あなたの選択", "通知・プライバシー・アカウント設定を管理でき、情報の確認・訂正・削除を申請できます。"]] },
    terms: { title: "利用規約", intro: "深夜信箱へようこそ。サービスを利用することで、以下の規約に同意したものとします。", sections: [["サービスについて", "深夜信箱は匿名の相談とAIによる寄り添いを提供します。医療、診断、危機介入、専門的な心理相談ではありません。"], ["安全な利用", "他人の機密情報を送信せず、違法・嫌がらせ・詐欺・危害の目的で利用しないでください。緊急時は地域の救急・危機相談へ連絡してください。"], ["アカウントと内容", "アカウントと送信内容について責任を負うものとします。サービスデータは本ポリシーと適用法に従って扱います。"]] }
  },
  ko: {
    privacy: { title: "개인정보 처리방침", intro: "익명으로 마음을 표현할 권리를 존중하며 서비스에 필요한 정보만 수집합니다.", sections: [["수집하는 정보", "이메일, 로그인 보안 기록, 직접 작성한 편지와 멤버십 기록 등이 포함됩니다. 익명 편지에 실명을 공개하지 않습니다."], ["정보 이용", "로그인 확인, 따뜻한 답장, 감정 분석, 편지 보관과 서비스 개선에 사용합니다. 개인정보를 판매하지 않습니다."], ["이용자의 선택", "알림·개인정보·계정 설정을 관리하고 개인정보의 열람·수정·삭제를 요청할 수 있습니다."]] },
    terms: { title: "서비스 약관", intro: "심야 우편함에 오신 것을 환영합니다. 서비스를 이용하면 다음 약관에 동의하는 것입니다.", sections: [["서비스 안내", "심야 우편함은 익명 고민 표현과 AI 동행을 제공합니다. 의료, 진단, 위기 개입 또는 전문 상담 서비스가 아닙니다."], ["안전한 이용", "타인의 민감한 정보를 제출하거나 불법·괴롭힘·사기·위해 목적으로 사용하지 마세요. 긴급한 위험이 있다면 지역 응급·위기 상담 기관에 연락하세요."], ["계정과 콘텐츠", "계정과 제출한 콘텐츠에 대한 책임은 이용자에게 있습니다. 서비스 데이터는 본 방침과 관련 법률에 따라 처리합니다."]] }
  }
} as const;

export default function LegalPage({ kind }: { kind: LegalKind }) {
  const { language } = useLanguage();
  const copy = legalCopy[language][kind];
  const back = LANGUAGE_OPTIONS.find((item) => item.code === language)?.label;

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0B0F2F] via-[#1C1F4A] to-[#0B0F2F] text-white px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between gap-3 mb-10">
          <a href="/" className="text-[#FFD580] hover:text-white transition">← {back}</a>
          <LanguageSelector compact />
        </header>
        <article className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-10 shadow-xl">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#FFD580]">{copy.title}</h1>
          <p className="mt-5 text-base sm:text-lg leading-8 text-white/80">{copy.intro}</p>
          <div className="mt-8 space-y-7">
            {copy.sections.map(([title, body]) => (
              <section key={title}>
                <h2 className="text-xl font-semibold text-white">{title}</h2>
                <p className="mt-2 leading-7 text-white/70">{body}</p>
              </section>
            ))}
          </div>
        </article>
      </div>
    </main>
  );
}
