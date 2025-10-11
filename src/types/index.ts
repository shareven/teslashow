// 行程数据类型
export interface Drive {
  id: number;
  start_date: string;
  end_date: string;
  start_km: number;
  end_km: number;
  distance: number;
  duration_min: number;
  start_address: string;
  end_address: string;
  start_latitude: number;
  start_longitude: number;
  end_latitude: number;
  end_longitude: number;
  outside_temp_avg: number;
  speed_max: number;
  power_max: number;
  power_min: number;
  start_ideal_range_km: number;
  end_ideal_range_km: number;
  car_id: number;
  car_model?: string;
  car_name?: string;
}

// 位置数据类型
export interface Position {
  id: number;
  date: string;
  latitude: number;
  longitude: number;
  speed: number;
  power: number;
  odometer: number;
  ideal_battery_range_km: number;
  battery_level: number;
  outside_temp: number;
  inside_temp: number;
  drive_id: number;
}

// 充电数据类型
export interface ChargingProcess {
  id: number;
  start_date: string;
  end_date: string;
  charge_energy_added: number;
  charge_energy_used: number;
  start_battery_level: number;
  end_battery_level: number;
  duration_min: number;
  outside_temp_avg?: number;
  start_rated_range_km?: number;
  end_rated_range_km?: number;
  start_ideal_range_km?: number;
  end_ideal_range_km?: number;
  car_id: number;
  car_model?: string;
  car_name?: string;
  charger_power?: number;
  cost?: number;
  address?: string;
  latitude?: number;
  longitude?: number;
  charging_type?: string;
  avg_voltage?: number;
}

// 充电详细数据类型（用于图表展示）
export interface ChargingData {
  id: number;
  date: string;
  battery_level: number;
  charge_energy_added: number;
  charger_actual_current: number;
  charger_voltage: number;
  charger_power: number;
  ideal_battery_range_km: number;
  charging_process_id: number;
}

// 车辆信息类型
export interface Car {
  id: number;
  efficiency: number;
  inserted_at: string;
  model: string;
  name: string;
  trim_badging: string;
  updated_at: string;
  vin: string;
}

// 统计数据类型
export interface Statistics {
  totalDistance: number;
  totalDrives: number;
  totalDuration: number;
  averageEfficiency: number;
  totalChargeEnergy: number;
}

// 时间过滤选项类型
export interface TimeFilter {
  label: string;
  value: string;
  days?: number;
}

// 百度地图点类型
export interface MapPoint {
  lng: number;
  lat: number;
}

// 百度地图路径类型
export interface MapPath {
  points: MapPoint[];
  color?: string;
  weight?: number;
  opacity?: number;
}