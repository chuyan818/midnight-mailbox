/**
 * LLM Proxy 层
 * 支持 Manus LLM（主）和 OpenAI（备用）的自动切换
 * 
 * 优先级：
 * 1. Manus LLM API（主要）
 * 2. OpenAI API（备用）
 */

import { invokeLLM } from './llm';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMProxyOptions {
  messages: LLMMessage[];
  temperature?: number;
  maxTokens?: number;
  retryCount?: number;
}

export interface LLMProxyResponse {
  content: string;
  provider: 'manus' | 'openai';
  tokensUsed?: number;
  error?: string;
}

/**
 * 调用 Manus LLM
 */
async function callManuslLM(options: LLMProxyOptions): Promise<LLMProxyResponse> {
  try {
    console.log('[LLM Proxy] Calling Manus LLM...');
    
    const response = await invokeLLM({
      messages: options.messages,
    });

    const content = typeof response.choices?.[0]?.message?.content === 'string' 
      ? response.choices[0].message.content 
      : '';
    
    if (!content) {
      throw new Error('Empty response from Manus LLM');
    }

    return {
      content,
      provider: 'manus',
      tokensUsed: response.usage?.total_tokens,
    };
  } catch (error) {
    console.error('[LLM Proxy] Manus LLM error:', error);
    throw error;
  }
}

/**
 * 调用 OpenAI API（备用）
 */
async function callOpenAI(options: LLMProxyOptions): Promise<LLMProxyResponse> {
  try {
    console.log('[LLM Proxy] Calling OpenAI API (fallback)...');
    
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: options.messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    return {
      content,
      provider: 'openai',
      tokensUsed: data.usage?.total_tokens,
    };
  } catch (error) {
    console.error('[LLM Proxy] OpenAI error:', error);
    throw error;
  }
}

/**
 * LLM Proxy - 主要入口
 * 优先使用 Manus LLM，失败时自动切换到 OpenAI
 */
export async function callLLMWithFallback(
  options: LLMProxyOptions
): Promise<LLMProxyResponse> {
  const retryCount = options.retryCount || 1;
  let lastError: Error | null = null;

  // 第一步：尝试 Manus LLM
  for (let i = 0; i < retryCount; i++) {
    try {
      return await callManuslLM(options);
    } catch (error) {
      lastError = error as Error;
      console.warn(`[LLM Proxy] Manus LLM attempt ${i + 1} failed:`, error);
      
      if (i < retryCount - 1) {
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  // 第二步：Manus LLM 失败，切换到 OpenAI
  console.warn('[LLM Proxy] Manus LLM failed, switching to OpenAI fallback');
  
  try {
    return await callOpenAI(options);
  } catch (openaiError) {
    console.error('[LLM Proxy] Both Manus and OpenAI failed');
    
    // 两个都失败，返回错误响应
    return {
      content: '',
      provider: 'manus',
      error: `LLM service unavailable. Manus error: ${lastError?.message}, OpenAI error: ${(openaiError as Error).message}`,
    };
  }
}

/**
 * 生成 AI 回信
 */
export async function generateAIReply(userLetter: string): Promise<LLMProxyResponse> {
  const systemPrompt = `你是一个温暖、同理心强的心理咨询师。用户会向你分享他们的想法和感受。
请用温暖、鼓励和建设性的方式回应。回复应该：
1. 表达同理心和理解
2. 验证用户的感受
3. 提供积极的视角或建议
4. 保持简洁（200-300字）
5. 使用亲切的语气`;

  return callLLMWithFallback({
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: userLetter,
      },
    ],
  });
}

/**
 * 分析情绪
 */
export async function analyzeEmotion(text: string): Promise<LLMProxyResponse> {
  const systemPrompt = `你是一个情绪分析专家。分析用户文本中的主要情绪。
返回格式：JSON
{
  "emotion": "主要情绪（如：悲伤、焦虑、开心、困惑等）",
  "intensity": 1-10的强度,
  "keywords": ["关键词1", "关键词2", "关键词3"],
  "analysis": "简短的分析说明"
}`;

  return callLLMWithFallback({
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: `请分析这段文本的情绪：\n${text}`,
      },
    ],
  });
}

/**
 * 内容安全检查
 */
export async function checkContentSafety(text: string): Promise<{
  isSafe: boolean;
  reason?: string;
}> {
  const systemPrompt = `你是一个内容安全检查员。检查文本是否包含有害内容。
返回格式：JSON
{
  "isSafe": true/false,
  "reason": "如果不安全，说明原因"
}`;

  const response = await callLLMWithFallback({
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: `请检查这段文本是否安全：\n${text}`,
      },
    ],
  });

  try {
    if (!response.content) return { isSafe: true };
    const result = JSON.parse(response.content);
    return {
      isSafe: result.isSafe !== false,
      reason: result.reason,
    };
  } catch {
    // 如果解析失败，默认认为安全
    return { isSafe: true };
  }
}

/**
 * 导出 LLM Proxy
 */
export const LLMProxy = {
  callLLMWithFallback,
  generateAIReply,
  analyzeEmotion,
  checkContentSafety,
};
