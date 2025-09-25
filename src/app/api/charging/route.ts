import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API: 开始处理charging请求...');
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    
    console.log(`📄 请求参数: page=${page}, limit=${limit}, offset=${offset}`);
    
    // 时间过滤参数
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    
    if (startDate || endDate) {
      console.log(`📅 时间过滤: start=${startDate}, end=${endDate}`);
    }

    // 构建WHERE条件和参数
    let whereConditions = ['cp.end_date IS NOT NULL'];
    let timeParams: string[] = [];
    let paramIndex = 1;

    if (startDate) {
      whereConditions.push(`cp.start_date AT TIME ZONE 'UTC' >= $${paramIndex}::timestamp AT TIME ZONE 'UTC'`);
      timeParams.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereConditions.push(`cp.start_date AT TIME ZONE 'UTC' <= $${paramIndex}::timestamp AT TIME ZONE 'UTC'`);
      timeParams.push(endDate);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');
    
    // 为主查询准备参数：时间参数 + limit + offset
    const queryParams = [...timeParams, limit, offset];
    const limitParam = timeParams.length + 1;
    const offsetParam = timeParams.length + 2;

    const query = `
      SELECT 
        cp.id,
        cp.start_date AT TIME ZONE 'UTC' as start_date,
        cp.end_date AT TIME ZONE 'UTC' as end_date,
        cp.charge_energy_added,
        cp.charge_energy_used,
        cp.duration_min,
        cp.start_battery_level,
        cp.end_battery_level,
        cp.car_id,
        c.name as car_name,
        c.model as car_model,
        a.display_name as address,
        p.latitude,
        p.longitude
      FROM charging_processes cp
      LEFT JOIN cars c ON cp.car_id = c.id
      LEFT JOIN addresses a ON cp.address_id = a.id
      LEFT JOIN positions p ON cp.position_id = p.id
      WHERE ${whereClause}
      ORDER BY cp.start_date DESC
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM charging_processes cp
      WHERE ${whereClause}
    `;

    console.log('🔍 开始执行数据库查询...');
    const startTime = Date.now();

    const [chargingResult, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, timeParams)
    ]);

    const queryTime = Date.now() - startTime;
    console.log(`✅ 数据库查询完成，耗时: ${queryTime}ms`);

    const chargingProcesses = chargingResult.rows;
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    console.log(`📊 查询结果: 返回${chargingProcesses.length}条记录，总计${total}条`);

    return NextResponse.json({
      chargingProcesses,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('❌ 获取充电列表失败:', error);
    console.error('❌ 错误详情:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      code: (error as any)?.code,
      detail: (error as any)?.detail
    });
    
    return NextResponse.json(
      { 
        error: '获取充电列表失败',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}