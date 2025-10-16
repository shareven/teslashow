import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromRequest } from '@/lib/auth';

console.log('🔒 Middleware file loaded!');

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  console.log(`🔒 Middleware: 处理请求 ${pathname}`);

  // 跳过登录相关的API路由
  if (pathname.startsWith('/api/auth/')) {
    console.log(`🔒 Middleware: 跳过认证API路由 ${pathname}`);
    return NextResponse.next();
  }

  // 跳过静态文件和Next.js内部路由
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/logo') ||
    pathname.startsWith('/icon') ||
    pathname.startsWith('/apple-touch-icon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 对于API路由，验证token
  if (pathname.startsWith('/api/')) {
    console.log(`🔒 Middleware: 验证API路由 ${pathname}`);
    const token = extractTokenFromRequest(request);
    console.log(`🔒 Middleware: 提取的token: ${token ? token.substring(0, 8) + '...' : 'null'}`);

    if (!token) {
      console.log(`🔒 Middleware: 缺少token，返回401`);
      return NextResponse.json(
        { error: '缺少认证token' },
        { status: 401 }
      );
    }

    if (!verifyToken(token)) {
      console.log(`🔒 Middleware: token验证失败，返回403`);
      return NextResponse.json(
        { error: '认证失败，请重新登录' },
        { status: 403 }
      );
    }
    
    console.log(`🔒 Middleware: token验证成功，允许访问`);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*'
  ],
};