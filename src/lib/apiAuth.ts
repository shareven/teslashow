import { NextRequest } from 'next/server';
import { verifyToken, extractTokenFromRequest } from '@/lib/auth';

/**
 * API路由授权验证辅助函数
 * @param request NextRequest对象
 * @returns 如果验证失败，返回错误响应；如果成功，返回null
 */
export function validateApiAuth(request: NextRequest) {
  console.log(`🔒 API Auth: 验证请求 ${request.nextUrl.pathname}`);
  
  const token = extractTokenFromRequest(request);
  console.log(`🔒 API Auth: 提取的token: ${token ? token.substring(0, 8) + '...' : 'null'}`);

  if (!token) {
    console.log(`🔒 API Auth: 缺少token，返回401`);
    return Response.json(
      { error: '缺少认证token' },
      { status: 401 }
    );
  }

  if (!verifyToken(token)) {
    console.log(`🔒 API Auth: token验证失败，返回403`);
    return Response.json(
      { error: '认证失败，请重新登录' },
      { status: 403 }
    );
  }
  
  console.log(`🔒 API Auth: token验证成功，允许访问`);
  return null; // 验证成功
}