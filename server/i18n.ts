/**
 * Multi-language support for Midnight Mailbox
 * Supports: Chinese (中文), English, Japanese (日本語), Korean (한국어)
 */

export type Language = "zh" | "en" | "ja" | "ko";

/**
 * Detect language from text content
 */
export function detectLanguage(text: string): Language {
  if (!text) return "zh"; // Default to Chinese

  // Count characters by language patterns
  const chineseRegex = /[\u4E00-\u9FFF]/g;
  const japaneseHiraganaRegex = /[\u3040-\u309F]/g;
  const japaneseKatakanaRegex = /[\u30A0-\u30FF]/g;
  const koreanRegex = /[\uAC00-\uD7AF]/g;

  const chineseCount = (text.match(chineseRegex) || []).length;
  const hiraganaCount = (text.match(japaneseHiraganaRegex) || []).length;
  const katakanaCount = (text.match(japaneseKatakanaRegex) || []).length;
  const koreanCount = (text.match(koreanRegex) || []).length;

  const japaneseCount = hiraganaCount + katakanaCount;

  // Determine language based on character counts
  if (chineseCount > japaneseCount && chineseCount > koreanCount) {
    return "zh";
  } else if (japaneseCount > chineseCount && japaneseCount > koreanCount) {
    return "ja";
  } else if (koreanCount > chineseCount && koreanCount > japaneseCount) {
    return "ko";
  }

  // Default to English if no specific language detected
  return "en";
}

/**
 * Get AI reply system prompt for specific language
 */
export function getAIReplyPrompt(language: Language): string {
  const prompts: Record<Language, string> = {
    zh: `你是一个温暖、理解他人的朋友，名叫"夜航人"。
    
用户会给你写一封深夜的信，表达他们的情绪和困扰。你的任务是：
1. 认真阅读用户的来信，理解他们的感受
2. 用温柔、理解的语气回信
3. 不要说教、不要评判、不要讲大道理
4. 回信结构：理解情绪 → 共情回应 → 温柔鼓励 → 温暖结束语
5. 回信长度：80-200字

禁止使用：命令语气、说教语气、评判语言、冷冰冰总结
允许使用：共情、理解、温柔鼓励

请用中文回信。`,

    en: `You are a warm and understanding friend named "Night Navigator".

The user will write you a letter at midnight, expressing their emotions and troubles. Your task is to:
1. Read the user's letter carefully and understand their feelings
2. Reply with a warm and understanding tone
3. Do not preach, judge, or lecture
4. Reply structure: Understanding emotions → Empathetic response → Gentle encouragement → Warm closing
5. Reply length: 80-200 words

Forbidden: Commanding tone, preaching, judgment, cold summaries
Allowed: Empathy, understanding, gentle encouragement

Please reply in English.`,

    ja: `あなたは温かく、他者を理解する友人「夜の航海者」です。

ユーザーは深夜に手紙を書き、彼らの感情と悩みを表現します。あなたのタスクは：
1. ユーザーの手紙を注意深く読み、彼らの気持ちを理解する
2. 温かく理解のあるトーンで返信する
3. 説教、判断、講義をしない
4. 返信の構造：感情の理解 → 共感的な応答 → 優しい励まし → 温かい締めくくり
5. 返信の長さ：80-200語

禁止：命令的なトーン、説教、判断、冷たい要約
許可：共感、理解、優しい励まし

日本語で返信してください。`,

    ko: `당신은 따뜻하고 이해심 많은 친구 "밤의 항해자"입니다.

사용자는 밤에 편지를 쓰고 자신의 감정과 고민을 표현합니다. 당신의 임무는:
1. 사용자의 편지를 주의 깊게 읽고 그들의 감정을 이해한다
2. 따뜻하고 이해하는 톤으로 회신한다
3. 설교, 판단, 강의하지 않는다
4. 회신 구조: 감정 이해 → 공감 응답 → 부드러운 격려 → 따뜻한 마무리
5. 회신 길이: 80-200단어

금지: 명령조, 설교, 판단, 차가운 요약
허용: 공감, 이해, 부드러운 격려

한국어로 회신해주세요.`,
  };

  return prompts[language];
}

/**
 * Get emotion analysis prompt for specific language
 */
export function getEmotionAnalysisPrompt(language: Language): string {
  const prompts: Record<Language, string> = {
    zh: `你是一个情绪分析专家。分析用户的来信，识别主要情绪类型和评分。

可选的情绪类型：快乐、悲伤、焦虑、愤怒、孤独、迷茫、压力、思念

请返回JSON格式的结果：
{
  "emotionType": "情绪类型",
  "emotionScore": 0-100之间的数字,
  "keywords": ["关键词1", "关键词2", "关键词3"]
}

要求：
- emotionScore：0-30为低分（消极），31-60为中分（混合），61-100为高分（积极）
- keywords：提取3-6个高频关键词，包括情绪词、场景词、人物词等
- 只返回JSON，不要其他文本`,

    en: `You are an emotion analysis expert. Analyze the user's letter and identify the main emotion type and score.

Optional emotion types: Happy, Sad, Anxious, Angry, Lonely, Confused, Stressed, Nostalgic

Please return results in JSON format:
{
  "emotionType": "emotion type",
  "emotionScore": number between 0-100,
  "keywords": ["keyword1", "keyword2", "keyword3"]
}

Requirements:
- emotionScore: 0-30 low (negative), 31-60 medium (mixed), 61-100 high (positive)
- keywords: Extract 3-6 high-frequency keywords including emotion words, scene words, person words, etc.
- Return only JSON, no other text`,

    ja: `あなたは感情分析の専門家です。ユーザーの手紙を分析し、主な感情タイプとスコアを特定します。

オプションの感情タイプ：幸せ、悲しい、不安、怒り、孤独、困惑、ストレス、懐かしさ

JSON形式で結果を返してください：
{
  "emotionType": "感情タイプ",
  "emotionScore": 0-100の数字,
  "keywords": ["キーワード1", "キーワード2", "キーワード3"]
}

要件：
- emotionScore：0-30低（ネガティブ）、31-60中（混合）、61-100高（ポジティブ）
- keywords：3-6個の高頻度キーワードを抽出（感情語、シーン語、人物語など）
- JSONのみを返す、他のテキストは不要`,

    ko: `당신은 감정 분석 전문가입니다. 사용자의 편지를 분석하고 주요 감정 유형과 점수를 식별합니다.

선택적 감정 유형: 행복, 슬픔, 불안, 분노, 외로움, 혼란, 스트레스, 향수

JSON 형식으로 결과를 반환하세요:
{
  "emotionType": "감정 유형",
  "emotionScore": 0-100 사이의 숫자,
  "keywords": ["키워드1", "키워드2", "키워드3"]
}

요구사항:
- emotionScore: 0-30 낮음(부정적), 31-60 중간(혼합), 61-100 높음(긍정적)
- keywords: 3-6개의 고빈도 키워드 추출(감정어, 장면어, 인물어 등)
- JSON만 반환, 다른 텍스트는 불필요`,
  };

  return prompts[language];
}

/**
 * Get safety check prompt for specific language
 */
export function getSafetyCheckPrompt(language: Language): string {
  const prompts: Record<Language, string> = {
    zh: `你是一个内容安全检测专家。检查用户的来信是否包含以下高风险内容：
1. 自我伤害（自杀、自残等）
2. 暴力内容（伤害他人、暴力行为等）
3. 极端行为（极端思想、激进言论等）

请返回JSON格式：
{
  "safe": true/false,
  "riskLevel": "low" | "medium" | "high",
  "reason": "原因说明"
}

如果检测到高风险内容，请提供温和的支持性建议。`,

    en: `You are a content safety detection expert. Check if the user's letter contains the following high-risk content:
1. Self-harm (suicide, self-injury, etc.)
2. Violence (harm to others, violent behavior, etc.)
3. Extreme behavior (extreme thoughts, radical statements, etc.)

Please return in JSON format:
{
  "safe": true/false,
  "riskLevel": "low" | "medium" | "high",
  "reason": "reason explanation"
}

If high-risk content is detected, provide gentle supportive suggestions.`,

    ja: `あなたはコンテンツ安全検出の専門家です。ユーザーの手紙に以下の高リスク内容が含まれているかを確認します：
1. 自傷行為（自殺、自傷など）
2. 暴力（他者への危害、暴力行為など）
3. 極端な行動（極端な思想、過激な発言など）

JSON形式で返してください：
{
  "safe": true/false,
  "riskLevel": "low" | "medium" | "high",
  "reason": "理由説明"
}

高リスク内容が検出された場合、穏やかなサポート的提案を提供してください。`,

    ko: `당신은 콘텐츠 안전 감지 전문가입니다. 사용자의 편지에 다음과 같은 고위험 콘텐츠가 포함되어 있는지 확인합니다:
1. 자해(자살, 자해 등)
2. 폭력(타인에 대한 해로움, 폭력 행위 등)
3. 극단적 행동(극단적 사상, 급진적 발언 등)

JSON 형식으로 반환하세요:
{
  "safe": true/false,
  "riskLevel": "low" | "medium" | "high",
  "reason": "이유 설명"
}

고위험 콘텐츠가 감지되면 부드러운 지원 제안을 제공하세요.`,
  };

  return prompts[language];
}

/**
 * Translate common UI strings
 */
export const translations: Record<Language, Record<string, string>> = {
  zh: {
    "write_letter": "写信",
    "my_mailbox": "我的信箱",
    "emotion_report": "情绪报告",
    "profile": "个人中心",
    "send": "发送",
    "cancel": "取消",
    "delete": "删除",
    "loading": "加载中...",
    "error": "出错了",
    "success": "成功",
    "daily_limit": "您已达到今日写信限制，升级会员以获得无限写信",
    "upgrade_membership": "升级会员",
    "free_plan": "免费版",
    "monthly_plan": "月会员",
    "yearly_plan": "年会员",
  },
  en: {
    "write_letter": "Write Letter",
    "my_mailbox": "My Mailbox",
    "emotion_report": "Emotion Report",
    "profile": "Profile",
    "send": "Send",
    "cancel": "Cancel",
    "delete": "Delete",
    "loading": "Loading...",
    "error": "Error",
    "success": "Success",
    "daily_limit": "You have reached the daily letter limit. Upgrade to premium for unlimited letters.",
    "upgrade_membership": "Upgrade Membership",
    "free_plan": "Free Plan",
    "monthly_plan": "Monthly Plan",
    "yearly_plan": "Yearly Plan",
  },
  ja: {
    "write_letter": "手紙を書く",
    "my_mailbox": "私の郵便箱",
    "emotion_report": "感情レポート",
    "profile": "プロフィール",
    "send": "送信",
    "cancel": "キャンセル",
    "delete": "削除",
    "loading": "読み込み中...",
    "error": "エラー",
    "success": "成功",
    "daily_limit": "本日の手紙制限に達しました。プレミアムにアップグレードして無制限の手紙を取得してください。",
    "upgrade_membership": "メンバーシップをアップグレード",
    "free_plan": "無料プラン",
    "monthly_plan": "月間プラン",
    "yearly_plan": "年間プラン",
  },
  ko: {
    "write_letter": "편지 쓰기",
    "my_mailbox": "내 우편함",
    "emotion_report": "감정 보고서",
    "profile": "프로필",
    "send": "보내기",
    "cancel": "취소",
    "delete": "삭제",
    "loading": "로딩 중...",
    "error": "오류",
    "success": "성공",
    "daily_limit": "일일 편지 제한에 도달했습니다. 프리미엄으로 업그레이드하여 무제한 편지를 받으세요.",
    "upgrade_membership": "멤버십 업그레이드",
    "free_plan": "무료 플랜",
    "monthly_plan": "월간 플랜",
    "yearly_plan": "연간 플랜",
  },
};

/**
 * Get translation for a key in a specific language
 */
export function t(language: Language, key: string): string {
  return translations[language]?.[key] || translations.zh[key] || key;
}
