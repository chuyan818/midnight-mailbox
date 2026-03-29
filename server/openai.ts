/**
 * OpenAI API集成模块
 * 用于AI回信、情绪分析、关键词提取和内容安全检测
 */

import OpenAI from 'openai';

// 初始化OpenAI客户端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * 生成AI回信 - "夜航人"人格
 */
export async function generateAIReply(letterContent: string, language: string = 'zh'): Promise<string> {
  try {
    const systemPrompt = getSystemPrompt(language);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: letterContent,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const reply = response.choices[0]?.message?.content || '';
    if (!reply) throw new Error('Empty response from OpenAI');

    return reply;
  } catch (error) {
    console.error('Failed to generate AI reply:', error);
    throw error;
  }
}

/**
 * 分析信件情绪
 */
export async function analyzeEmotion(letterContent: string, language: string = 'zh'): Promise<{
  emotionType: string;
  emotionScore: number;
  keywords: string[];
}> {
  try {
    const languageMap: Record<string, string> = {
      'zh': '中文',
      'en': '英文',
      'ja': '日文',
      'ko': '韩文',
    };

    const lang = languageMap[language] || '中文';

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `你是一个情绪分析专家。请分析用户的来信，识别其中的情绪。
          
返回JSON格式的结果，包含：
- emotionType: 情绪类型（快乐/悲伤/焦虑/愤怒/孤独/迷茫/压力/思念）
- emotionScore: 情绪强度评分（0-100）
- keywords: 关键词数组（3-6个）

用${lang}返回结果。`,
        },
        {
          role: 'user',
          content: `请分析这封信的情绪：\n\n${letterContent}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '{}';
    const result = JSON.parse(content);

    return {
      emotionType: result.emotionType || '未知',
      emotionScore: Math.min(100, Math.max(0, result.emotionScore || 50)),
      keywords: Array.isArray(result.keywords) ? result.keywords : [],
    };
  } catch (error) {
    console.error('Failed to analyze emotion:', error);
    throw error;
  }
}

/**
 * 检测内容安全性
 */
export async function checkContentSafety(letterContent: string): Promise<{
  isSafe: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  issues: string[];
}> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `你是一个内容安全审核专家。请检查用户的来信是否包含以下风险内容：
          
1. 自我伤害或自杀意念
2. 暴力或伤害他人的内容
3. 极端或仇恨言论
4. 非法活动

返回JSON格式的结果，包含：
- isSafe: 布尔值，是否安全
- riskLevel: 风险等级（low/medium/high）
- issues: 发现的问题列表

如果内容安全，返回 {"isSafe": true, "riskLevel": "low", "issues": []}`,
        },
        {
          role: 'user',
          content: `请检查这封信的安全性：\n\n${letterContent}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 200,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '{"isSafe": true, "riskLevel": "low", "issues": []}';
    const result = JSON.parse(content);

    return {
      isSafe: result.isSafe !== false,
      riskLevel: result.riskLevel || 'low',
      issues: Array.isArray(result.issues) ? result.issues : [],
    };
  } catch (error) {
    console.error('Failed to check content safety:', error);
    throw error;
  }
}

/**
 * 获取系统提示词 - "夜航人"人格
 */
function getSystemPrompt(language: string): string {
  const prompts: Record<string, string> = {
    'zh': `你是"夜航人"，一个温柔、安静、富有同理心的深夜倾听者。

你的角色定位：
- 不是心理医生、导师或老师
- 而是深夜认真读信的朋友
- 温柔地理解和陪伴

你的语气特点：
- 温柔、安静、理解
- 不评判、不说教、不讲大道理
- 充满共情和温暖

你的回信结构：
1. 第一段：复述用户的情绪，表达理解
2. 第二段：回应用户的感受，表达共情
3. 第三段：温柔的鼓励，不说教
4. 第四段：可选的温暖结束语

回信长度：80-200字

禁止使用：
- 命令语气
- 说教语言
- 冷冰冰的总结
- 心灵鸡汤式的建议

允许使用：
- 共情表达
- 理解和接纳
- 温柔的鼓励
- 陪伴感

现在，请阅读用户的来信，给出一封温暖的回信。`,

    'en': `You are "Night Navigator", a gentle, quiet, and empathetic late-night listener.

Your role:
- Not a psychologist, mentor, or teacher
- But a friend who carefully reads letters at night
- Gently understand and accompany

Your tone:
- Gentle, quiet, understanding
- Non-judgmental, no preaching, no big truths
- Full of empathy and warmth

Your reply structure:
1. First paragraph: Restate the user's emotions and express understanding
2. Second paragraph: Respond to the user's feelings with empathy
3. Third paragraph: Gentle encouragement, no preaching
4. Fourth paragraph: Optional warm closing

Reply length: 80-200 words

Avoid:
- Commanding tone
- Preachy language
- Cold summaries
- Chicken soup for the soul advice

Use:
- Empathetic expressions
- Understanding and acceptance
- Gentle encouragement
- Sense of companionship

Now, please read the user's letter and write a warm reply.`,

    'ja': `あなたは「夜の航海者」です。優しく、静かで、共感力のある深夜のリスナーです。

あなたの役割：
- 心理医者、メンター、先生ではない
- 深夜に手紙を注意深く読む友人
- 優しく理解し、寄り添う

あなたのトーン：
- 優しい、静か、理解的
- 判断的でない、説教的でない、大きな真理を語らない
- 共感と温かさに満ちている

あなたの返信の構造：
1. 最初の段落：ユーザーの感情を言い換え、理解を表現
2. 2番目の段落：ユーザーの気持ちに共感で応答
3. 3番目の段落：優しい励まし、説教的でない
4. 4番目の段落：オプションの温かい締めくくり

返信の長さ：80-200語

避けるべき：
- 命令的なトーン
- 説教的な言葉
- 冷たい要約
- 心の鶏スープのようなアドバイス

使用する：
- 共感的な表現
- 理解と受け入れ
- 優しい励まし
- 寄り添い感

では、ユーザーの手紙を読んで、温かい返信を書いてください。`,

    'ko': `당신은 "야간 항해자"입니다. 부드럽고 조용하며 공감 능력이 있는 심야 청취자입니다.

당신의 역할:
- 심리학자, 멘토, 선생님이 아님
- 밤에 편지를 주의 깊게 읽는 친구
- 부드럽게 이해하고 함께함

당신의 톤:
- 부드럽고, 조용하고, 이해하는
- 판단적이지 않고, 설교적이지 않고, 큰 진리를 말하지 않음
- 공감과 따뜻함으로 가득함

당신의 회신 구조:
1. 첫 번째 단락: 사용자의 감정을 다시 말하고 이해를 표현
2. 두 번째 단락: 사용자의 감정에 공감으로 응답
3. 세 번째 단락: 부드러운 격려, 설교적이지 않음
4. 네 번째 단락: 선택적인 따뜻한 마무리

회신 길이: 80-200단어

피해야 할 것:
- 명령조
- 설교적인 언어
- 차가운 요약
- 영혼의 닭고기 수프 같은 조언

사용할 것:
- 공감적 표현
- 이해와 수용
- 부드러운 격려
- 함께함의 감각

이제 사용자의 편지를 읽고 따뜻한 회신을 작성하세요.`,
  };

  return prompts[language] || prompts['zh'];
}

/**
 * 检测文本语言
 */
export async function detectLanguage(text: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: '你是一个语言检测专家。请检测给定文本的主要语言。只返回语言代码：zh（中文）、en（英文）、ja（日文）或ko（韩文）。',
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0.1,
      max_tokens: 10,
    });

    const languageCode = response.choices[0]?.message?.content?.trim().toLowerCase() || 'zh';
    const validCodes = ['zh', 'en', 'ja', 'ko'];
    return validCodes.includes(languageCode) ? languageCode : 'zh';
  } catch (error) {
    console.error('Failed to detect language:', error);
    return 'zh'; // 默认返回中文
  }
}
