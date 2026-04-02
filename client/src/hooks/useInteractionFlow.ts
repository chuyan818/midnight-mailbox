/**
 * 交互流程管理Hook
 * 管理各个页面之间的导航和数据传递
 */

import { useLocation } from 'wouter';
import { useAuth } from '../_core/hooks/useAuth';
import { trpc } from '../lib/trpc';
import { toast } from 'sonner';

/**
 * 交互流程管理
 */
export const useInteractionFlow = () => {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

  /**
   * 导航到写信页面
   */
  const navigateToWrite = () => {
    if (!isAuthenticated) {
      toast.error('请先登录');
      navigate('/login');
      return;
    }
    navigate('/write');
  };

  /**
   * 导航到回信页面
   */
  const navigateToLetter = (letterId: string) => {
    navigate(`/letter/${letterId}`);
  };

  /**
   * 导航到情绪报告页面
   */
  const navigateToReport = (letterId?: string) => {
    if (letterId) {
      navigate(`/report?letterId=${letterId}`);
    } else {
      navigate('/report');
    }
  };

  /**
   * 导航到我的信箱
   */
  const navigateToMailbox = () => {
    if (!isAuthenticated) {
      toast.error('请先登录');
      navigate('/login');
      return;
    }
    navigate('/mailbox');
  };

  /**
   * 导航到个人中心
   */
  const navigateToProfile = (tab?: string) => {
    if (!isAuthenticated) {
      toast.error('请先登录');
      navigate('/login');
      return;
    }
    if (tab) {
      navigate(`/profile?tab=${tab}`);
    } else {
      navigate('/profile');
    }
  };

  /**
   * 导航到优先客服支持
   */
  const navigateToPremiumSupport = () => {
    if (!isAuthenticated) {
      toast.error('请先登录');
      navigate('/login');
      return;
    }
    navigate('/premium-support');
  };

  /**
   * 导航到登录页面
   */
  const navigateToLogin = () => {
    navigate('/login');
  };

  /**
   * 导航到首页
   */
  const navigateToHome = () => {
    navigate('/');
  };

  /**
   * 发送信件并导航到回信页面
   * 注意：此函数应在组件中调用，使用useMutation hook
   */
  const sendLetterAndNavigate = (letterId: string) => {
    // 导航到回信页面
    navigateToLetter(letterId);
    toast.success('信件已发送，AI正在生成回信...');
  };

  /**
   * 检查权限并执行操作
   */
  const checkPermissionAndExecute = async (
    action: 'send_reply' | 'collect_letter' | 'create_thematic_mailbox',
    onSuccess: () => void
  ) => {
    if (!isAuthenticated) {
      toast.error('请先登录');
      navigate('/login');
      return;
    }

    try {
      // 这里应该调用权限检查API
      // const canExecute = await trpc.membership.checkPermission.useQuery(action);

      // 如果有权限，执行操作
      onSuccess();
    } catch (error: any) {
      // 如果没有权限，显示升级提示
      toast.error(error.message || '权限不足');
      navigateToProfile('upgrade');
    }
  };

  /**
   * 获取当前页面的返回路由
   */
  const getBackRoute = (currentPage: string): string => {
    const backRoutes: Record<string, string> = {
      '/letter/:id': '/mailbox',
      '/report': '/mailbox',
      '/profile': '/mailbox',
      '/premium-support': '/profile',
      '/write': '/',
    };

    return backRoutes[currentPage] || '/';
  };

  return {
    navigateToWrite,
    navigateToLetter,
    navigateToReport,
    navigateToMailbox,
    navigateToProfile,
    navigateToPremiumSupport,
    navigateToLogin,
    navigateToHome,
    sendLetterAndNavigate,
    checkPermissionAndExecute,
    getBackRoute,
  };
};

export default useInteractionFlow;
