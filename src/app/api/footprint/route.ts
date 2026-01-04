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
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const carIdParam = searchParams.get('car_id');

    let whereClause = 'WHERE d.end_date IS NOT NULL';
    const queryParams: any[] = [];

    // 根据时间过滤条件构建查询
    if (startDate) {
      whereClause += ' AND d.start_date AT TIME ZONE \'UTC\' >= $1::timestamp AT TIME ZONE \'UTC\'';
      queryParams.push(startDate);
    }

    if (endDate) {
      whereClause += ` AND d.start_date AT TIME ZONE 'UTC' <= $${queryParams.length + 1}::timestamp AT TIME ZONE 'UTC'`;
      queryParams.push(endDate);
    }
    if (carIdParam) {
      whereClause += ` AND d.car_id = $${queryParams.length + 1}`;
      queryParams.push(carIdParam);
    }

    // 获取统计数据，包含车型信息用于能耗计算
    const statsQuery = `
      SELECT 
        COUNT(*) as total_drives,
        COALESCE(SUM(d.distance), 0) as total_distance,
        COALESCE(SUM(d.duration_min), 0) as total_duration,
        -- 核心：算出这组行程总共消耗了多少 Wh 能量
        -- 公式：Σ((开始额定里程 - 结束额定里程) * 车辆效率系数)
        COALESCE(SUM((d.start_ideal_range_km - d.end_ideal_range_km) * c.efficiency), 0) as total_energy_wh
      FROM drives d
      LEFT JOIN cars c ON d.car_id = c.id
      ${whereClause}
      GROUP BY c.id -- 必须按车分组，因为每辆车的 efficiency 不同
    `;

    // 充电数据查询
    let chargingQuery = `
      SELECT 
        COUNT(*) as total_charges,
        COALESCE(SUM(charge_energy_added), 0) as total_energy_added,
        COALESCE(SUM(cost), 0) as total_cost
      FROM charging_processes cp
      WHERE cp.end_date IS NOT NULL
    `;
    
    let chargingParams: any[] = [];
    
    // 为充电数据添加相同的时间过滤
    if (startDate) {
      chargingQuery += ' AND cp.start_date AT TIME ZONE \'UTC\' >= $1::timestamp AT TIME ZONE \'UTC\'';
      chargingParams.push(startDate);
    }

    if (endDate) {
      chargingQuery += ` AND cp.start_date AT TIME ZONE 'UTC' <= $${chargingParams.length + 1}::timestamp AT TIME ZONE 'UTC'`;
      chargingParams.push(endDate);
    }
    if (carIdParam) {
      chargingQuery += ` AND cp.car_id = $${chargingParams.length + 1}`;
      chargingParams.push(carIdParam);
    }

    // 获取轨迹数据（采样以提高性能）
    const positionsQuery = `
      SELECT 
        p.latitude,
        p.longitude,
        p.date,
        d.id as drive_id
      FROM positions p
      JOIN drives d ON p.drive_id = d.id
      ${whereClause}
      AND p.latitude IS NOT NULL 
      AND p.longitude IS NOT NULL
      ORDER BY p.date ASC
    `;

    const [statsResult, chargingResult, positionsResult] = await Promise.all([
      pool.query(statsQuery, queryParams),
      pool.query(chargingQuery, chargingParams),
      pool.query(positionsQuery, queryParams)
    ]);

    const statsRows = statsResult.rows;
    const charging = chargingResult.rows[0];
    const positions = positionsResult.rows;

    // 计算总统计数据
    let totalDistance = 0;
    let totalDrives = 0;
    let totalDuration = 0;
    let totalEnergyWh = 0; // 新增：用于记录总消耗能量
    let averageEfficiency = 0;

    if (statsRows.length > 0) {
      // 汇总所有分组的数据
      totalDistance = statsRows.reduce((sum, row) => sum + (parseFloat(row.total_distance) || 0), 0);
      totalDrives = statsRows.reduce((sum, row) => sum + (parseInt(row.total_drives) || 0), 0);
      totalDuration = statsRows.reduce((sum, row) => sum + (parseInt(row.total_duration) || 0), 0);
      
      // 汇总所有分组消耗的总 Wh
      const totalKWh = statsRows.reduce((sum, row) => sum + (parseFloat(row.total_energy_wh) || 0), 0);

      if (totalDistance > 0) {
        // 计算平均能耗 (Wh/km)
        const avgWhPerKm = totalKWh / totalDistance;
        averageEfficiency = avgWhPerKm; 
      }
    }

    // 对轨迹点进行采样以提高地图性能
    const sampledPositions = positions.filter((_, index) => index % 10 === 0);

    return NextResponse.json({
      statistics: {
        totalDistance: totalDistance,
        totalDrives: totalDrives,
        totalDuration: totalDuration,
        averageEfficiency: averageEfficiency,
        totalChargeEnergy: parseFloat(charging.total_energy_added) || 0,
      },
      positions: sampledPositions,
    });
  } catch (error) {
    console.error('获取足迹数据失败:', error);
    return NextResponse.json(
      { error: '获取足迹数据失败' },
      { status: 500 }
    );
  }
}