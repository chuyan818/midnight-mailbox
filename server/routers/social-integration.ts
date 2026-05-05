/**
 * 社交功能路由集成
 * 将socialCompleteRouter集成到主appRouter
 */

import { socialCompleteRouter } from './social-complete';

export const socialRouter = socialCompleteRouter;

/**
 * 在 server/routers.ts 中添加以下代码到 appRouter：
 * 
 * import { socialRouter } from './routers/social-integration';
 * 
 * export const appRouter = router({
 *   // ... 其他路由
 *   social: socialRouter,
 * });
 */
