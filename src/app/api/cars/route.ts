import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { validateApiAuth } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  const authError = validateApiAuth(request);
  if (authError) {
    return authError;
  }
  try {
    const query = `
      SELECT id, name, model
      FROM cars
      ORDER BY name NULLS LAST, id ASC
    `;
    const result = await pool.query(query);
    return NextResponse.json({ cars: result.rows });
  } catch (error) {
    return NextResponse.json({ error: '获取车辆列表失败' }, { status: 500 });
  }
}