import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// 统一的盐值
const AUTH_SALT = 'teslashow_salt_2025';

// 生成token的函数
export function generateToken(username: string, password: string): string {
  const tokenData = `${username}:${password}:${AUTH_SALT}`;
  return crypto.createHash('md5').update(tokenData).digest('hex');
}

// 验证token的函数
export function verifyToken(token: string): boolean {
  try {
    // 从环境变量获取用户名和密码
    const username = process.env.TESLASHOW_USER;
    const password = process.env.TESLASHOW_PASSWORD;

    if (!username || !password) {
      console.error('❌ 环境变量 TESLASHOW_USER 或 TESLASHOW_PASSWORD 未配置');
      return false;
    }

    // 生成期望的token
    const expectedToken = generateToken(username, password);
    return token === expectedToken;
  } catch (error) {
    console.error('❌ Token验证错误:', error);
    return false;
  }
}

// 验证用户名和密码的函数
export function verifyCredentials(username: string, password: string): boolean {
  const correctUsername = process.env.TESLASHOW_USER;
  const correctPassword = process.env.TESLASHOW_PASSWORD;
  console.log('correctUsername:', correctUsername);
  console.log('correctPassword:', correctPassword);
  if (!correctUsername || !correctPassword) {
    console.error('❌ 环境变量 TESLASHOW_USER 或 TESLASHOW_PASSWORD 未配置');
    return false;
  }

  return username === correctUsername && password === correctPassword;
}

// 从请求头中提取token
export function extractTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    return null;
  }

  // 支持 "Bearer token" 格式
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // 也支持直接传token
  return authHeader;
}