import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  getUserById,
  createLetter,
  updateLetterWithAnalysis,
  getUserLetters,
  getLetterById,
  getUserMembership,
  upsertMembership,
  canUserWriteLetter,
  incrementDailyLetterCount,
  getUserEmotionsTrend,
  createSubscriptionRecord,
  getDb,
} from "./db";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";

// Emotion types
const EMOTION_TYPES = ["快乐", "悲伤", "焦虑", "愤怒", "孤独", "迷茫", "压力", "思念"] as const;

// Helper to get DB connection
async function getDbConnection() {
  const db = await (await import('./db')).getDb();
  if (!db) throw new Error("Database not available");
  return db;
}

// Background types
const BACKGROUND_TYPES = ["星空漫漫", "牛皮纸", "樱花来信", "秋日落信", "节日灯火"] as const;

/**
 * Analyze emotion from letter content using LLM
 */
async function analyzeEmotion(content: string): Promise<{
  emotionType: string;
  emotionScore: number;
  keywords: string[];
}> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `你是一个情绪分析专家。分析用户的来信，识别主要情绪类型和评分。
          
可选的情绪类型：快乐、悲伤、焦虑、愤怒、孤独、迷茫、压力、思念
评分范围：0-100（0-30为低，31-60为中，61-100为高）

返回JSON格式：
{
  "emotionType": "情绪类型",
  "emotionScore": 评分,
  "keywords": ["关键词1", "关键词2", "关键词3"]
}

关键词应该是3-6个，包括情绪词、场景词、人物词。`,
        },
        {
          role: "user",
          content: `请分析这封信的情绪：\n\n${content}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "emotion_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              emotionType: { type: "string" },
              emotionScore: { type: "number" },
              keywords: { type: "array", items: { type: "string" } },
            },
            required: ["emotionType", "emotionScore", "keywords"],
            additionalProperties: false,
          },
        },
      },
    });

    const content_text = response.choices[0]?.message.content;
    if (!content_text) throw new Error("No response from LLM");

    let textContent = '';
    if (typeof content_text === 'string') {
      textContent = content_text;
    } else if (Array.isArray(content_text)) {
      const textItem = content_text.find((c: any) => c.type === 'text');
      textContent = (textItem as any)?.text || '';
    }
    
    if (!textContent) throw new Error("No text response from LLM");
    const result = JSON.parse(textContent);
    return result;
  } catch (error) {
    console.error("Emotion analysis error:", error);
    // Fallback to default emotion
    return {
      emotionType: "迷茫",
      emotionScore: 50,
      keywords: ["倾诉", "思考", "感受"],
    };
  }
}

/**
 * Generate AI reply using LLM
 */
async function generateAIReply(content: string, emotionType: string): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `你是"夜航人"，一个温暖、安静、理解他人的深夜倾听者。你的特点是：
- 温柔、安静、理解、不评判、不说教
- 禁止使用命令语气、说教语气、评判语言、冷冰冰总结
- 允许使用共情、理解、温柔鼓励

回信结构：
1. 第一段：复述用户情绪，表达理解
2. 第二段：回应感受，提供共情
3. 第三段：温柔鼓励，不讲大道理
4. 第四段（可选）：温暖结束语

长度控制：80-200字

用户的主要情绪是：${emotionType}`,
        },
        {
          role: "user",
          content: `亲爱的夜航人，我想和你分享我的心事：\n\n${content}`,
        },
      ],
    });

    const replyContent = response.choices[0]?.message.content;
    let reply = '';
    if (typeof replyContent === 'string') {
      reply = replyContent;
    } else if (Array.isArray(replyContent)) {
      const textItem = replyContent.find((c: any) => c.type === 'text');
      reply = (textItem as any)?.text || '';
    }
    
    return reply || "感谢你的倾诉。我听到了你心中的声音，那些感受都是真实而有效的。在这个深夜，我想告诉你，你不是一个人。无论现在有多困难，这一刻会过去，而你会变得更强。温暖拥抱你。";
  } catch (error) {
    console.error("AI reply generation error:", error);
    return "感谢你的倾诉。我听到了你心中的声音，那些感受都是真实而有效的。在这个深夜，我想告诉你，你不是一个人。无论现在有多困难，这一刻会过去，而你会变得更强。温暖拥抱你。";
  }
}

/**
 * Check if content is safe (no self-harm, violence, etc.)
 */
async function checkContentSafety(content: string): Promise<{ safe: boolean; reason?: string }> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `你是一个内容安全检测专家。检查用户的来信是否包含以下危险内容：
- 自我伤害表达（自杀倾向、自伤行为）
- 暴力或极端内容
- 非法或危险建议

返回JSON格式：
{
  "safe": true/false,
  "reason": "如果不安全，说明原因"
}`,
        },
        {
          role: "user",
          content: `请检查这封信是否安全：\n\n${content}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "safety_check",
          strict: true,
          schema: {
            type: "object",
            properties: {
              safe: { type: "boolean" },
              reason: { type: "string" },
            },
            required: ["safe"],
            additionalProperties: false,
          },
        },
      },
    });

    const content_text = response.choices[0]?.message.content;
    if (!content_text) return { safe: true };

    let textContent = '';
    if (typeof content_text === 'string') {
      textContent = content_text;
    } else if (Array.isArray(content_text)) {
      const textItem = content_text.find((c: any) => c.type === 'text');
      textContent = (textItem as any)?.text || '';
    }
    
    if (!textContent) return { safe: true };
    const result = JSON.parse(textContent);
    return result;
  } catch (error) {
    console.error("Safety check error:", error);
    return { safe: true };
  }
}

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  /**
   * User profile management
   */
  user: router({
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      const user = await getUserById(ctx.user.id);
      const membership = await getUserMembership(ctx.user.id);
      return {
        user,
        membership,
      };
    }),

    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // TODO: Implement profile update in database
        // For now just return success
        return { success: true as const };
      }),
  }),
  
  /**
   * Content safety check (public endpoint for testing)
   */
  safety: router({
    check: publicProcedure
      .input(z.object({
        content: z.string(),
      }))
      .query(async ({ input }) => {
        const result = await checkContentSafety(input.content);
        return result;
      }),
  }),

  /**
   * Letter management
   */
  letter: router({
    create: protectedProcedure
      .input(z.object({
        content: z.string().min(10).max(5000),
        backgroundType: z.enum(BACKGROUND_TYPES).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check if user can write letter
        const canWrite = await canUserWriteLetter(ctx.user.id);
        if (!canWrite) {
          throw new Error("You have reached the daily letter limit. Upgrade to premium for unlimited letters.");
        }

        // Check content safety
        const safetyCheck = await checkContentSafety(input.content);
        if (!safetyCheck.safe) {
          // Still allow but flag it
          console.warn(`Safety flag for user ${ctx.user.id}: ${safetyCheck.reason}`);
        }

        // Create letter
        const result = await createLetter(ctx.user.id, {
          content: input.content,
          backgroundType: input.backgroundType,
        });

        // Increment daily letter count
        await incrementDailyLetterCount(ctx.user.id);

        // Get the created letter ID
        const letterId = (result as any).insertId;

        // Analyze emotion asynchronously
        analyzeEmotion(input.content)
          .then(async (analysis) => {
            // Generate AI reply
            const reply = await generateAIReply(input.content, analysis.emotionType);

            // Update letter with analysis and reply
            await updateLetterWithAnalysis(letterId, {
              emotionScore: analysis.emotionScore,
              emotionType: analysis.emotionType,
              keywords: analysis.keywords,
              reply,
            });
            
            // Create emotion record
            try {
              const db = await getDb();
              if (db) {
                const { emotions } = await import('../drizzle/schema');
                await db.insert(emotions).values({
                  letterId,
                  emotionType: analysis.emotionType,
                  emotionScore: analysis.emotionScore,
                  keywords: analysis.keywords,
                });
              }
            } catch (error) {
              console.error("Failed to create emotion record:", error);
            }
          })
          .catch((error) => {
            console.error("Error processing letter:", error);
          });

        return {
          id: letterId,
          message: "Letter created successfully. AI is generating your reply...",
        };
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const letter = await getLetterById(input.id);
        if (!letter || letter.userId !== ctx.user.id) {
          throw new Error("Letter not found");
        }
        return letter;
      }),

    list: protectedProcedure
      .input(z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      }))
      .query(async ({ ctx, input }) => {
        const letters = await getUserLetters(ctx.user.id, input.limit, input.offset);
        return letters;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await (await import('./db')).getDb();
        if (!db) throw new Error("Database not available");
        
        const letter = await getLetterById(input.id);
        if (!letter || letter.userId !== ctx.user.id) {
          throw new Error("Letter not found");
        }
        
        // Delete related emotions first
        const { emotions, letters } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        await db.delete(emotions).where(eq(emotions.letterId, input.id));
        
        // Delete letter
        await db.delete(letters).where(eq(letters.id, input.id));
        
        return { success: true as const };
      }),
  }),

  /**
   * Membership management
   */
  membership: router({
    getInfo: protectedProcedure.query(async ({ ctx }) => {
      const membership = await getUserMembership(ctx.user.id);
      return membership;
    }),

    upgrade: protectedProcedure
      .input(z.object({
        type: z.enum(["monthly", "yearly"]),
      }))
      .mutation(async ({ ctx, input }) => {
        // TODO: Integrate with Stripe - for now just update membership
        const expiryDate = new Date();
        if (input.type === "monthly") {
          expiryDate.setMonth(expiryDate.getMonth() + 1);
        } else {
          expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        }
        
        await upsertMembership(ctx.user.id, {
          membershipType: input.type,
          membershipExpiry: expiryDate,
        });
        
        return { success: true as const };
      }),

    cancel: protectedProcedure.mutation(async ({ ctx }) => {
      await upsertMembership(ctx.user.id, {
        membershipType: 'free',
        membershipExpiry: undefined,
      });
      return { success: true as const };
    }),
  }),

  /**
   * Emotion report
   */
  emotion: router({
    getTodayScore: protectedProcedure.query(async ({ ctx }) => {
      const letters = await getUserLetters(ctx.user.id, 100, 0);
      const today = new Date().toISOString().split('T')[0];
      
      const todayLetters = letters.filter(
        (l) => l.createdAt.toISOString().split('T')[0] === today && l.emotionScore
      );

      if (todayLetters.length === 0) {
        return { score: 0, type: "平静" as const };
      }

      const avgScore = Math.round(
        todayLetters.reduce((sum, l) => sum + (l.emotionScore || 0), 0) / todayLetters.length
      );

      return {
        score: avgScore,
        type: (todayLetters[todayLetters.length - 1]?.emotionType || "平静") as string,
        count: todayLetters.length,
      };
    }),

    getTrendData: protectedProcedure.query(async ({ ctx }) => {
      const membership = await getUserMembership(ctx.user.id);
      
      // Free users can only see today's score
      if (membership?.membershipType === "free") {
        throw new Error("Upgrade to premium to view emotion trends");
      }

      const letters = await getUserLetters(ctx.user.id, 1000, 0);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      // Group letters by date and calculate daily average
      const dailyData: Record<string, { scores: number[]; types: string[] }> = {};
      
      letters.forEach((letter) => {
        if (letter.createdAt >= sevenDaysAgo && letter.emotionScore) {
          const date = letter.createdAt.toISOString().split('T')[0];
          if (!dailyData[date]) {
            dailyData[date] = { scores: [], types: [] };
          }
          dailyData[date].scores.push(letter.emotionScore);
          if (letter.emotionType) {
            dailyData[date].types.push(letter.emotionType);
          }
        }
      });
      
      // Format data for chart
      const data = Object.entries(dailyData)
        .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
        .map(([date, { scores, types }]) => ({
          date,
          score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
          type: types[types.length - 1] || "平静",
        }));

      return data;
    }),
  }),

  /**
   * Subscription management
   */
  subscription: router({
    createCheckoutSession: protectedProcedure
      .input(z.object({
        type: z.enum(["monthly", "yearly"]),
      }))
      .mutation(async ({ ctx, input }) => {
        // TODO: Integrate with Stripe - for now return placeholder
        const user = await getUserById(ctx.user.id);
        if (!user) throw new Error("User not found");
        
        // Create subscription record
        const amount = input.type === "monthly" ? 29 : 288; // CNY pricing
        await createSubscriptionRecord(ctx.user.id, {
          membershipType: input.type,
          amount,
          status: "pending",
        });
        
        return {
          sessionId: `session_${ctx.user.id}_${Date.now()}` as const,
          url: "https://checkout.stripe.com/pay/..." as const,
        };
      }),

    handleWebhook: publicProcedure
      .input(z.object({
        event: z.object({
          type: z.string(),
          data: z.any(),
        }),
      }))
      .mutation(async ({ input }) => {
        // TODO: Verify Stripe signature and handle webhook events
        // For now, just acknowledge receipt
        console.log("Webhook received:", input.event.type);
        return { success: true as const };
      }),
  }),
});

export type AppRouter = typeof appRouter;
