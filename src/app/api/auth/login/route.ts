import { NextRequest, NextResponse } from 'next/server';
import { verifyCredentials, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // 验证请求参数
    if (!username || !password) {
      return NextResponse.json(
        { error: '用户名和密码不能为空' },
        { status: 400 }
      );
    }

    // 验证用户名和密码
    if (!verifyCredentials(username, password)) {
      console.log(`❌ 登录失败: 用户名=${username}, 密码验证失败`);
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 403 }
      );
    }

    // 生成token
    const token = generateToken(username, password);

    console.log(`✅ 登录成功: 用户=${username}, token=${token.substring(0, 8)}...`);

    return NextResponse.json({
      success: true,
      token,
      message: '登录成功'
    });

  } catch (error) {
    console.error('❌ 登录API错误:', error);
    return NextResponse.json(
      { error: '登录处理失败' },
      { status: 500 }
    );
  }
}