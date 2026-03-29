/**
 * Stripe Webhook处理路由
 */

import { Router, Request, Response, raw } from 'express';
import { verifyWebhookSignature, handleWebhookEvent } from './stripe';

const router = Router();

/**
 * Webhook端点 - 接收Stripe事件
 * 必须在express.json()之前注册，使用raw中间件
 */
router.post(
  '/webhook',
  raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    try {
      const signature = req.headers['stripe-signature'] as string;
      if (!signature) {
        return res.status(400).json({ error: 'Missing stripe-signature header' });
      }

      // 验证Webhook签名
      const event = verifyWebhookSignature(req.body, signature);

      // 处理测试事件（用于Stripe Dashboard测试）
      if (event.id.startsWith('evt_test_')) {
        console.log('[Webhook] Test event detected:', event.type);
        return res.json({ verified: true });
      }

      // 处理事件
      await handleWebhookEvent(event);

      // 返回成功响应
      res.json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(400).json({ error: 'Webhook processing failed' });
    }
  }
);

export default router;
