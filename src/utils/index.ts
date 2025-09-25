import { TimeFilter } from '@/types';

// 安全的数值处理
export const safeNumber = (value: any): number => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

export const safeToFixed = (value: any, digits: number = 1): string => {
  const num = safeNumber(value);
  return num.toFixed(digits);
};

// 格式化距离 - 假设输入已经是公里
export const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${(distance * 1000).toFixed(0)}m`;
  }
  return `${distance.toFixed(1)}km`;
};

// 格式化时间
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins}分钟`;
  }
  
  return `${hours}小时${mins}分钟`;
};

// 格式化速度
export const formatSpeed = (speed: number): string => {
  return `${speed.toFixed(1)} km/h`;
};

// 格式化功率
export const formatPower = (power: number): string => {
  return `${power.toFixed(1)} kW`;
};

// 格式化日期 - 使用原生Date对象
export const formatDate = (date: string): string => {
  const dateObj = new Date(date);
  // 使用Asia/Shanghai时区显示，与TeslaMate的TZ环境变量一致
  return dateObj.toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 格式化日期范围 - 使用原生Date对象
export const formatDateRange = (startDate: string, endDate: string): string => {
  const startObj = new Date(startDate);
  const endObj = new Date(endDate);
  
  const formatSimpleDate = (date: Date): string => {
    // 使用Asia/Shanghai时区显示，与TeslaMate的TZ环境变量一致
    return date.toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const startStr = formatSimpleDate(startObj);
  const endStr = formatSimpleDate(endObj);
  
  return `${startStr} - ${endStr}`;
};

// 计算平均速度
export const calculateAverageSpeed = (distance: number, duration: number): number => {
  if (duration === 0) return 0;
  return (distance / 1000) / (duration / 60); // km/h
};

// 计算能耗 (Wh/km)
// Tesla车型的电池容量参考值 (kWh)
const TESLA_BATTERY_CAPACITIES: { [key: string]: number } = {
  'Model S': 100, // Model S Long Range
  'Model 3': 75,  // Model 3 Long Range
  'Model X': 100, // Model X Long Range
  'Model Y': 75,  // Model Y Long Range
  'default': 75   // 默认值
};

export const calculateEnergyConsumption = (
  rangeUsed: number, // 消耗的续航里程 (km)
  distance: number,  // 实际行驶距离 (km)
  carModel?: string  // 车型
): number => {
  if (distance === 0) return 0;
  
  // 获取电池容量
  const batteryCapacity = TESLA_BATTERY_CAPACITIES[carModel || 'default'] || TESLA_BATTERY_CAPACITIES['default'];
  
  // Tesla的EPA续航里程参考值 (km)
  const EPA_RANGES: { [key: string]: number } = {
    'Model S': 652,  // Model S Long Range EPA续航
    'Model 3': 568,  // Model 3 Long Range EPA续航
    'Model X': 560,  // Model X Long Range EPA续航
    'Model Y': 525,  // Model Y Long Range EPA续航
    'default': 500   // 默认值
  };
  
  const epaRange = EPA_RANGES[carModel || 'default'] || EPA_RANGES['default'];
  
  // 计算消耗的能量 (Wh)
  // 能量消耗 = (消耗续航 / EPA续航) * 电池容量 * 1000
  const energyConsumed = (rangeUsed / epaRange) * batteryCapacity * 1000; // Wh
  
  // 计算能耗 (Wh/km)
  return energyConsumed / distance;
};

// 格式化能耗显示
export const formatEnergyConsumption = (whPerKm: number): string => {
  return `${Math.round(whPerKm)} Wh/km`;
};

// 时间过滤选项
export const timeFilterOptions: TimeFilter[] = [
  { label: '所有', value: 'all' },
  { label: '今天', value: 'today', days: 1 },
  { label: '近2天', value: '2days', days: 2 },
  { label: '近3天', value: '3days', days: 3 },
  { label: '近7天', value: '7days', days: 7 },
  { label: '近30天', value: '30days', days: 30 },
  { label: '近3个月', value: '3months', days: 90 },
  { label: '近6个月', value: '6months', days: 180 },
  { label: '近1年', value: '1year', days: 365 },
  { label: '近2年', value: '2years', days: 730 },
  { label: '近3年', value: '3years', days: 1095 },
  { label: '近4年', value: '4years', days: 1460 },
  { label: '近5年', value: '5years', days: 1825 },
];

// 获取时间范围
export const getDateRange = (filter: TimeFilter, customStart?: string, customEnd?: string) => {
  if (filter.value === 'custom' && customStart && customEnd) {
    return {
      startDate: customStart,
      endDate: customEnd,
    };
  }
  
  if (filter.value === 'all') {
    return {
      startDate: null,
      endDate: null,
    };
  }
  
  // 获取当前本地时间
  const now = new Date();
  let startDate: Date;
  
  // 确保days存在且为数字
  const days = filter.days ?? 0;
  
  if (days === 1) {
    // 今天：从今天本地时间00:00:00开始
    // 创建本地时间的午夜，然后转换为UTC
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  } else {
    // 其他：从(N-1)天前的本地时间00:00:00开始
    // 例如：近2天应该从昨天00:00:00开始，近3天应该从前天00:00:00开始
    const targetDate = new Date(now.getTime() - ((days - 1) * 24 * 60 * 60 * 1000));
    startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
  }
  
  return {
    startDate: startDate.toISOString(),
    endDate: now.toISOString(),
  };
};

// 颜色工具函数
export const getRandomColor = (): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// 地图坐标转换
export const convertToMapPoint = (lat: number, lng: number) => {
  return { lat, lng };
};