import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { calculateEnergyConsumption } from '@/utils';
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
        COALESCE(SUM(d.start_ideal_range_km - d.end_ideal_range_km), 0) as total_range_used,
        c.model as car_model
      FROM drives d
      LEFT JOIN cars c ON d.car_id = c.id
      ${whereClause}
      GROUP BY c.model
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
    let totalRangeUsed = 0;
    let averageEfficiency = 0;

    if (statsRows.length > 0) {
      // 汇总所有车型的数据
      totalDistance = statsRows.reduce((sum, row) => sum + (parseFloat(row.total_distance) || 0), 0);
      totalDrives = statsRows.reduce((sum, row) => sum + (parseInt(row.total_drives) || 0), 0);
      totalDuration = statsRows.reduce((sum, row) => sum + (parseInt(row.total_duration) || 0), 0);
      totalRangeUsed = statsRows.reduce((sum, row) => sum + (parseFloat(row.total_range_used) || 0), 0);

      // 计算加权平均能耗 (Wh/km)
      let totalEnergyWh = 0;
      let totalDistanceForEfficiency = 0;

      statsRows.forEach(row => {
        const distance = parseFloat(row.total_distance) || 0;
        const rangeUsed = parseFloat(row.total_range_used) || 0;
        const carModel = row.car_model;

        if (distance > 0 && rangeUsed > 0 && carModel) {
          const energyConsumption = calculateEnergyConsumption(rangeUsed, distance, carModel);
          totalEnergyWh += energyConsumption * distance;
          totalDistanceForEfficiency += distance;
        }
      });

      if (totalDistanceForEfficiency > 0) {
        averageEfficiency = totalEnergyWh / totalDistanceForEfficiency;
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