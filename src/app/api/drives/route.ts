import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { validateApiAuth } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  // 验证授权
  const authError = validateApiAuth(request);
  if (authError) {
    return authError;
  }
  try {
    console.log('🔍 API: 开始处理drives请求...');
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    
    console.log(`📄 请求参数: page=${page}, limit=${limit}, offset=${offset}`);
    
    // 时间过滤参数
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const carIdParam = searchParams.get('car_id');
    
    if (startDate || endDate) {
      console.log(`📅 时间过滤: start=${startDate}, end=${endDate}`);
    }

    // 构建WHERE条件和参数
    let whereConditions = ['d.end_date IS NOT NULL'];
    let timeParams: string[] = [];
    let paramIndex = 1;

    if (startDate) {
      whereConditions.push(`d.start_date AT TIME ZONE 'UTC' >= $${paramIndex}::timestamp AT TIME ZONE 'UTC'`);
      timeParams.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereConditions.push(`d.start_date AT TIME ZONE 'UTC' <= $${paramIndex}::timestamp AT TIME ZONE 'UTC'`);
      timeParams.push(endDate);
      paramIndex++;
    }

    if (carIdParam) {
      whereConditions.push(`d.car_id = $${paramIndex}`);
      timeParams.push(carIdParam);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');
    
    // 为主查询准备参数：时间参数 + limit + offset
    const queryParams = [...timeParams, limit, offset];
    const limitParam = timeParams.length + 1;
    const offsetParam = timeParams.length + 2;

    const query = `
      SELECT 
        d.id,
        d.start_date AT TIME ZONE 'UTC' as start_date,
        d.end_date AT TIME ZONE 'UTC' as end_date,
        d.start_km,
        d.end_km,
        d.distance,
        d.duration_min,
        sa.display_name as start_address,
        ea.display_name as end_address,
        sp.latitude as start_latitude,
        sp.longitude as start_longitude,
        ep.latitude as end_latitude,
        ep.longitude as end_longitude,
        d.outside_temp_avg,
        d.speed_max,
        d.power_max,
        d.power_min,
        d.start_ideal_range_km,
        d.end_ideal_range_km,
        d.car_id,
        c.name as car_name,
        c.model as car_model,
        -- 新增核心字段：从 cars 表获取效率系数
        c.efficiency,
        -- 新增计算字段：平均能耗 (kWh/km)
        -- 逻辑：(消耗的额定公里数 * 效率系数) / 实际行驶公里数
        CASE 
          WHEN d.distance > 0 AND c.efficiency IS NOT NULL AND c.efficiency > 0 THEN 
            ( (COALESCE(d.start_ideal_range_km, 0) - COALESCE(d.end_ideal_range_km, 0))::float * c.efficiency::float ) / d.distance::float
          ELSE 0 
        END as avg_consumption
      FROM drives d
      LEFT JOIN cars c ON d.car_id = c.id
      LEFT JOIN addresses sa ON d.start_address_id = sa.id
      LEFT JOIN addresses ea ON d.end_address_id = ea.id
      LEFT JOIN positions sp ON d.start_position_id = sp.id
      LEFT JOIN positions ep ON d.end_position_id = ep.id
      WHERE ${whereClause}
      ORDER BY d.start_date DESC
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM drives d
      WHERE ${whereClause}
    `;

    console.log('🔍 开始执行数据库查询...');
    const startTime = Date.now();

    const [drivesResult, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, timeParams)
    ]);

    const queryTime = Date.now() - startTime;
    console.log(`✅ 数据库查询完成，耗时: ${queryTime}ms`);

    const drives = drivesResult.rows;
     // --- 调试日志系统开始 ---
    console.log(`📊 --- 调试日志系统开始 ---`);
    console.log(`📊 [DEBUG] 本次查询返回 ${drives.length} 条记录`);
    
    drives.forEach((row, idx) => {
      // 如果能耗为 0，且实际有行驶距离，则触发深度日志
      if (row.avg_consumption == 0 && row.distance > 0) {
        const rangeDiff = (row.start_ideal_range_km || 0) - (row.end_ideal_range_km || 0);
        console.warn(`⚠️ [DEBUG] 行程ID:${row.id} 能耗计算为 0 的原因排查:`);
        console.warn(`   - 车辆名称: ${row.car_name} (ID: ${row.car_id})`);
        console.warn(`   - 效率系数 (efficiency): ${row.efficiency} (若为空则结果必为 0)`);
        console.warn(`   - 行驶距离 (distance): ${row.distance} km`);
        console.warn(`   - 理想里程差 (range_diff): ${rangeDiff} km (Start: ${row.start_ideal_range_km}, End: ${row.end_ideal_range_km})`);
        
        if (!row.efficiency) {
          console.error(`   ❌ 关键错误: 车辆 ${row.car_name} 在 cars 表中未设置 efficiency！`);
        }
        if (rangeDiff === 0) {
          console.error(`   ❌ 关键错误: 行程前后理想里程相等，可能是 Tesla 数据未及时更新！`);
        }
      } else if (idx === 0) {
        console.log(`✅ [DEBUG] 样本数据(ID:${row.id}): 距离=${row.distance}, 能耗=${row.avg_consumption}`);
      }
    });
    // --- 调试日志系统结束 ---
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    console.log(`📊 查询结果: 返回${drives.length}条记录，总计${total}条`);

    return NextResponse.json({
      drives,
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
    console.error('❌ 获取行程列表失败:', error);
    console.error('❌ 错误详情:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      code: (error as any)?.code,
      detail: (error as any)?.detail
    });
    
    return NextResponse.json(
      { 
        error: '获取行程列表失败',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}