import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { validateApiAuth } from '@/lib/apiAuth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 验证授权
  const authError = validateApiAuth(request);
  if (authError) {
    return authError;
  }
  try {
    const { id } = await params;
    const driveId = parseInt(id);

    if (isNaN(driveId)) {
      return NextResponse.json(
        { error: '无效的行程ID' },
        { status: 400 }
      );
    }

    // 获取行程详情
    const driveQuery = `
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
        c.model as car_model
      FROM drives d
      LEFT JOIN cars c ON d.car_id = c.id
      LEFT JOIN addresses sa ON d.start_address_id = sa.id
      LEFT JOIN addresses ea ON d.end_address_id = ea.id
      LEFT JOIN positions sp ON d.start_position_id = sp.id
      LEFT JOIN positions ep ON d.end_position_id = ep.id
      WHERE d.id = $1
    `;

    // 获取轨迹数据（采样以减少数据量）
    const positionsQuery = `
      WITH sampled_positions AS (
        SELECT 
          id,
          date AT TIME ZONE 'UTC' as date,
          latitude,
          longitude,
          speed,
          power,
          odometer,
          ideal_battery_range_km,
          battery_level,
          outside_temp,
          inside_temp,
          ROW_NUMBER() OVER (ORDER BY date) as row_num,
          COUNT(*) OVER () as total_count
        FROM positions 
        WHERE drive_id = $1 
        AND latitude IS NOT NULL 
        AND longitude IS NOT NULL
        ORDER BY date
      )
      SELECT 
        id,
        date,
        latitude,
        longitude,
        speed,
        power,
        odometer,
        ideal_battery_range_km,
        battery_level,
        outside_temp,
        inside_temp
      FROM sampled_positions
      WHERE 
        row_num = 1 OR 
        row_num = total_count OR 
        row_num % GREATEST(1, total_count / 500) = 0
      ORDER BY date ASC
    `;

    const [driveResult, positionsResult] = await Promise.all([
      pool.query(driveQuery, [driveId]),
      pool.query(positionsQuery, [driveId])
    ]);

    if (driveResult.rows.length === 0) {
      return NextResponse.json(
        { error: '行程不存在' },
        { status: 404 }
      );
    }

    const drive = driveResult.rows[0];
    const positions = positionsResult.rows;

    return NextResponse.json({
      drive,
      positions,
    });
  } catch (error) {
    console.error('获取行程详情失败:', error);
    return NextResponse.json(
      { error: '获取行程详情失败' },
      { status: 500 }
    );
  }
}