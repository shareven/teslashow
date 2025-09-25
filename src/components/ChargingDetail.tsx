'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  FormGroup,
  FormControlLabel,
  Switch,
  Chip,
  Grid,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  BatteryChargingFull,
  ElectricBolt,
  Speed,
  Battery90,
  Timeline,
} from '@mui/icons-material';
import { ChargingProcess, ChargingData } from '@/types';
import { useThemeColor } from '@/lib/ThemeColorProvider';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import 'dayjs/locale/zh-cn';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// 配置dayjs
dayjs.extend(utc);
dayjs.locale('zh-cn');

// 工具函数
const safeNumber = (value: any): number => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

const safeToFixed = (value: any, digits: number): string => {
  const num = safeNumber(value);
  return num.toFixed(digits);
};

interface ChargingDetailProps {
  chargingId: number;
}

// 数据系列配置
interface DataSeries {
  key: string;
  label: string;
  color: string;
  unit: string;
  visible: boolean;
  yAxisId?: string;
}

const ChargingDetail: React.FC<ChargingDetailProps> = ({ chargingId }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { currentTheme } = useThemeColor();
  
  const [chargingProcess, setChargingProcess] = useState<ChargingProcess | null>(null);
  const [chargingData, setChargingData] = useState<ChargingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 数据系列可见性控制
  const [dataSeries, setDataSeries] = useState<DataSeries[]>([
    {
      key: 'charger_voltage',
      label: '电压',
      color: '#2196F3', // 蓝色
      unit: 'V',
      visible: true,
      yAxisId: 'voltage',
    },
    {
      key: 'charger_actual_current',
      label: '电流',
      color: '#E91E63', // 粉红色
      unit: 'A',
      visible: true,
      yAxisId: 'current',
    },
    {
      key: 'charger_power',
      label: '功率',
      color: '#4CAF50', // 绿色
      unit: 'kW',
      visible: true,
      yAxisId: 'power',
    },
    {
      key: 'battery_level',
      label: 'SOC',
      color: '#9C27B0', // 紫色
      unit: '%',
      visible: true,
      yAxisId: 'soc',
    },
    {
      key: 'ideal_battery_range_km',
      label: '续航里程',
      color: '#FF5722', // 深橙红色
      unit: 'km',
      visible: true,
      yAxisId: 'range',
    },
  ]);

  // 获取充电过程基本信息
  const fetchChargingProcess = async () => {
    try {
      const response = await fetch(`/api/charging/${chargingId}`);
      if (!response.ok) {
        throw new Error('获取充电信息失败');
      }
      const data = await response.json();
      setChargingProcess(data.chargingProcess);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    }
  };

  // 获取充电详细数据
  const fetchChargingData = async () => {
    try {
      const response = await fetch(`/api/charging/${chargingId}/data`);
      if (!response.ok) {
        throw new Error('获取充电数据失败');
      }
      const data = await response.json();
      setChargingData(data.chargingData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    }
  };

  // 初始化数据
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchChargingProcess(),
        fetchChargingData(),
      ]);
      setLoading(false);
    };
    
    loadData();
  }, [chargingId]);

  // 切换数据系列可见性
  const toggleSeriesVisibility = (key: string) => {
    setDataSeries(prev => 
      prev.map(series => 
        series.key === key 
          ? { ...series, visible: !series.visible }
          : series
      )
    );
  };

  // 格式化图表数据
  const formatChartData = () => {
    const formattedData = chargingData.map((item, index) => {
      // 将UTC时间加8小时转换为本地时间显示
      const dateObj = dayjs(item.date).add(8, 'hour');
      
      return {
        ...item,
        timestamp: dateObj.valueOf(), // 使用时间戳作为X轴数据
        timeDisplay: dateObj.format('MM-DD HH:mm:ss'), // 显示完整的月日时分秒
        index,
      };
    });
    
    return formattedData;
  };

  // 自定义时间格式化函数
  const formatXAxisTime = (timestamp: number) => {
    return dayjs(timestamp).format('MM-DD HH:mm');
  };

  // 自定义Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // 从payload中获取时间显示信息
      const timeDisplay = payload[0]?.payload?.timeDisplay || dayjs(label).format('HH:mm:ss');
      return (
        <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            时间: {timeDisplay}
          </Typography>
          {payload.map((entry: any, index: number) => {
            const series = dataSeries.find(s => s.key === entry.dataKey);
            if (!series || !series.visible) return null;
            
            return (
              <Typography
                key={index}
                variant="body2"
                sx={{ color: entry.color }}
              >
                {series.label}: {safeToFixed(entry.value, 2)} {series.unit}
              </Typography>
            );
          })}
        </Paper>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!chargingProcess) {
    return (
      <Alert severity="warning" sx={{ mb: 2 }}>
        未找到充电记录
      </Alert>
    );
  }

  const startTime = dayjs(chargingProcess.start_date).add(8, 'hour');
  const endTime = dayjs(chargingProcess.end_date).add(8, 'hour');
  const batteryGain = safeNumber(chargingProcess.end_battery_level) - safeNumber(chargingProcess.start_battery_level);
  const chartData = formatChartData();

  return (
    <Box>
      {/* 充电基本信息 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <BatteryChargingFull sx={{ fontSize: 32, color: `${currentTheme}.main` }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                充电记录 #{chargingProcess.id}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {chargingProcess.car_name || chargingProcess.car_model || '未知车辆'}
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={{ xs: 2, sm: 3 }}>
            {/* 第一行 - 主要指标 */}
            <Grid size={{ xs: 6, sm: 6, md: 3 }}>
              <Box textAlign="center" sx={{ py: { xs: 1, sm: 0 } }}>
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  充电时间
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  {Math.round(safeNumber(chargingProcess.duration_min) / 60 * 10) / 10}h
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                  {startTime.format('MM-DD HH:mm')} - {endTime.format('HH:mm')}
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 6, sm: 6, md: 3 }}>
              <Box textAlign="center" sx={{ py: { xs: 1, sm: 0 } }}>
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  电量变化
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  +{safeToFixed(batteryGain, 1)}%
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                  {safeToFixed(chargingProcess.start_battery_level, 1)}% → {safeToFixed(chargingProcess.end_battery_level, 1)}%
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 6, sm: 6, md: 3 }}>
              <Box textAlign="center" sx={{ py: { xs: 1, sm: 0 } }}>
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  充电能量
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'warning.main', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  {safeToFixed(safeNumber(chargingProcess.charge_energy_added), 1)} kWh
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                  实际充入
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 6, sm: 6, md: 3 }}>
              <Box textAlign="center" sx={{ py: { xs: 1, sm: 0 } }}>
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  消耗能量
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'error.main', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  {safeToFixed(safeNumber(chargingProcess.charge_energy_used), 1)} kWh
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                  电网消耗
                </Typography>
              </Box>
            </Grid>

            {/* 第二行 - 效率和温度 */}
            <Grid size={{ xs: 6, sm: 6, md: 3 }}>
              <Box textAlign="center" sx={{ py: { xs: 1, sm: 0 } }}>
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  充电效率
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'info.main', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  {safeNumber(chargingProcess.charge_energy_added) && safeNumber(chargingProcess.charge_energy_used) 
                    ? safeToFixed((safeNumber(chargingProcess.charge_energy_added) / safeNumber(chargingProcess.charge_energy_used)) * 100, 1) 
                    : '0'}%
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                  能量转换率
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 6, sm: 6, md: 3 }}>
              <Box textAlign="center" sx={{ py: { xs: 1, sm: 0 } }}>
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  平均温度
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  {chargingProcess.outside_temp_avg ? `${safeToFixed(chargingProcess.outside_temp_avg, 1)}°C` : '暂无数据'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                  环境温度
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 6, sm: 6, md: 3 }}>
              <Box textAlign="center" sx={{ py: { xs: 1, sm: 0 } }}>
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  额定里程增加
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'secondary.main', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  {chargingProcess.end_rated_range_km && chargingProcess.start_rated_range_km 
                    ? `${safeToFixed(safeNumber(chargingProcess.end_rated_range_km) - safeNumber(chargingProcess.start_rated_range_km), 1)} km`
                    : '暂无数据'
                  }
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                  里程增加
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 6, sm: 6, md: 3 }}>
              <Box textAlign="center" sx={{ py: { xs: 1, sm: 0 } }}>
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  平均功率
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  {safeNumber(chargingProcess.duration_min) > 0 
                    ? safeToFixed((safeNumber(chargingProcess.charge_energy_added) / (safeNumber(chargingProcess.duration_min) / 60)), 1)
                    : '0'} kW
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                  充电功率
                </Typography>
              </Box>
            </Grid>

            {/* 第三行 - 充电地址 */}
            <Grid size={{ xs: 12, sm: 12, md: 12 }}>
              <Box textAlign="center" sx={{ py: { xs: 1, sm: 0 } }}>
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  充电地址
                </Typography>
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  fontSize: { xs: '0.8rem', sm: '0.9rem' },
                  lineHeight: { xs: 1.2, sm: 1.4 },
                  wordBreak: 'break-all'
                }}>
                  {chargingProcess.address || '未知位置'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                  充电位置
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>



      {/* 数据系列控制 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Timeline />
            数据显示控制
          </Typography>
          {isMobile ? (
            <Grid container spacing={1}>
              {dataSeries.map((series) => (
                <Grid size={{ xs: 6 }} key={series.key}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={series.visible}
                        onChange={() => toggleSeriesVisibility(series.key)}
                        size="small"
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: series.color,
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: series.color,
                          },
                        }}
                      />
                    }
                    label={
                      <Chip
                        label={series.label}
                        size="small"
                        sx={{
                          backgroundColor: series.visible ? series.color : 'grey.300',
                          color: series.visible ? 'white' : 'grey.600',
                          fontWeight: 500,
                          fontSize: '0.7rem',
                        }}
                      />
                    }
                    sx={{ margin: 0 }}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <FormGroup row>
              {dataSeries.map((series) => (
                <FormControlLabel
                  key={series.key}
                  control={
                    <Switch
                      checked={series.visible}
                      onChange={() => toggleSeriesVisibility(series.key)}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: series.color,
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: series.color,
                        },
                      }}
                    />
                  }
                  label={
                    <Chip
                      label={`${series.label} (${series.unit})`}
                      size="small"
                      sx={{
                        backgroundColor: series.visible ? series.color : 'grey.300',
                        color: series.visible ? 'white' : 'grey.600',
                        fontWeight: 500,
                      }}
                    />
                  }
                />
              ))}
            </FormGroup>
          )}
        </CardContent>
      </Card>

      {/* 充电曲线图 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Speed />
            充电数据曲线
          </Typography>
          
          {chartData.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary">
                暂无详细充电数据
              </Typography>
            </Box>
          ) : (
            <Box sx={{ width: '100%', height: { xs: 250, sm: 350, md: 450 } }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={chartData} 
                  margin={{ 
                    top: isMobile ? 10 : 20, 
                    right: isMobile ? 5 : 10, 
                    left: isMobile ? 5 : 10, 
                    bottom: isMobile ? 10 : 20 
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis 
                    dataKey="timestamp"
                    type="number"
                    scale="time"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={formatXAxisTime}
                    stroke={theme.palette.text.secondary}
                    fontSize={isMobile ? 10 : 12}
                    angle={isMobile ? -45 : 0}
                    textAnchor={isMobile ? 'end' : 'middle'}
                    height={isMobile ? 60 : 30}
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                  />
                  
                  {/* 动态Y轴 - 隐藏显示 */}
                  {dataSeries.filter(s => s.visible).map((series, index) => (
                    <YAxis
                      key={series.yAxisId}
                      yAxisId={series.yAxisId}
                      orientation={index % 2 === 0 ? 'left' : 'right'}
                      hide={true}
                    />
                  ))}
                  
                  <Tooltip content={<CustomTooltip />} />
                  {!isMobile && <Legend />}
                  
                  {/* 动态数据线 */}
                  {dataSeries
                    .filter(series => series.visible)
                    .map((series) => (
                      <Line
                        key={series.key}
                        type="monotone"
                        dataKey={series.key}
                        stroke={series.color}
                        strokeWidth={2}
                        dot={false}
                        name={`${series.label} (${series.unit})`}
                        yAxisId={series.yAxisId}
                        connectNulls={false}
                      />
                    ))
                  }
                </LineChart>
              </ResponsiveContainer>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ChargingDetail;