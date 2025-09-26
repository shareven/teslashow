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

    console.log(`🔍 API: 获取充电详细数据，ID: ${chargingId}`);

    // 首先获取充电过程的时间范围
    const processQuery = `
      SELECT 
        start_date AT TIME ZONE 'UTC' as start_date, 
        end_date AT TIME ZONE 'UTC' as end_date
      FROM charging_processes
      WHERE id = $1
    `;

    const processResult = await pool.query(processQuery, [chargingId]);

    if (processResult.rows.length === 0) {
      return NextResponse.json(
        { error: '充电记录不存在' },
        { status: 404 }
      );
    }

    const { start_date, end_date } = processResult.rows[0];

    // 获取充电过程中的详细数据
    const dataQuery = `
      SELECT 
        date AT TIME ZONE 'UTC' as date,
        battery_level,
        charge_energy_added,
        charger_power,
        charger_voltage,
        charger_actual_current,
        ideal_battery_range_km,
        outside_temp,
        rated_battery_range_km
      FROM charges
      WHERE charging_process_id = $1
        AND date AT TIME ZONE 'UTC' >= $2
        AND date AT TIME ZONE 'UTC' <= $3
      ORDER BY date ASC
    `;

    const dataResult = await pool.query(dataQuery, [chargingId, start_date, end_date]);

    const chargingData = dataResult.rows;

    console.log(`✅ 成功获取充电详细数据，ID: ${chargingId}，数据点: ${chargingData.length}`);

    return NextResponse.json({
      chargingData,
      metadata: {
        chargingId,
        startDate: start_date,
        endDate: end_date,
        dataPoints: chargingData.length
      }
    });
  } catch (error) {
    console.error('❌ 获取充电详细数据失败:', error);
    console.error('❌ 错误详情:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      code: (error as any)?.code,
      detail: (error as any)?.detail
    });
    
    return NextResponse.json(
      { 
        error: '获取充电详细数据失败',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}