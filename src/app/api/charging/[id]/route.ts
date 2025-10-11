import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const chargingId = parseInt(resolvedParams.id);
    
    if (isNaN(chargingId)) {
      return NextResponse.json(
        { error: '无效的充电记录ID' },
        { status: 400 }
      );
    }

    console.log(`🔍 API: 获取充电记录详情，ID: ${chargingId}`);

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
        cp.outside_temp_avg,
        cp.start_rated_range_km,
        cp.end_rated_range_km,
        cp.start_ideal_range_km,
        cp.end_ideal_range_km,
        cp.car_id,
        c.name as car_name,
        c.model as car_model,
        a.display_name as address,
        p.latitude,
        p.longitude,
        (
          SELECT DISTINCT ch.fast_charger_present
          FROM charges ch
          WHERE ch.charging_process_id = cp.id
            AND ch.fast_charger_present IS NOT NULL
          LIMIT 1
        ) as fast_charger_present,
        (
          SELECT DISTINCT ch.conn_charge_cable
          FROM charges ch
          WHERE ch.charging_process_id = cp.id
            AND ch.conn_charge_cable IS NOT NULL
            AND ch.conn_charge_cable != '<invalid>'
          LIMIT 1
        ) as conn_charge_cable
      FROM charging_processes cp
      LEFT JOIN cars c ON cp.car_id = c.id
      LEFT JOIN addresses a ON cp.address_id = a.id
      LEFT JOIN positions p ON cp.position_id = p.id
      WHERE cp.id = $1
    `;

    const result = await pool.query(query, [chargingId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: '充电记录不存在' },
        { status: 404 }
      );
    }

    const chargingProcess = result.rows[0];
    
    // 使用数据库中的字段判断充电类型
    let chargingType = 'Unknown';
    
    if (chargingProcess.fast_charger_present === true && chargingProcess.conn_charge_cable === 'GB_DC') {
      chargingType = 'DC';
    } else if (chargingProcess.fast_charger_present === false && chargingProcess.conn_charge_cable === 'GB_AC') {
      chargingType = 'AC';
    } else if (chargingProcess.conn_charge_cable === 'GB_AC') {
      // 如果连接线是AC类型，即使fast_charger_present为null，也判断为AC
      chargingType = 'AC';
    } else if (chargingProcess.conn_charge_cable === 'GB_DC') {
      // 如果连接线是DC类型，即使fast_charger_present为null，也判断为DC
      chargingType = 'DC';
    }
    
    // 添加充电类型到返回数据
    const processWithType = {
      ...chargingProcess,
      charging_type: chargingType
    };

    console.log(`✅ 成功获取充电记录详情，ID: ${chargingId}，充电类型: ${chargingType}`);

    return NextResponse.json({
      chargingProcess: processWithType,
    });
  } catch (error) {
    console.error('❌ 获取充电记录详情失败:', error);
    console.error('❌ 错误详情:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      code: (error as any)?.code,
      detail: (error as any)?.detail
    });
    
    return NextResponse.json(
      { 
        error: '获取充电记录详情失败',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}