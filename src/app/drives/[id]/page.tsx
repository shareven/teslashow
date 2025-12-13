'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Stack,
  Divider,
  Container,
  useMediaQuery,
  useTheme,
  FormGroup,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  ArrowBack,
  DirectionsCar,
  Schedule,
  Speed,
  BatteryChargingFull,
  LocationOn,
  Thermostat,
  ElectricBolt,
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import AmapMap from '@/components/AmapMap';
import { Drive, Position, MapPoint, MapPath } from '@/types';
import {
  formatDistance,
  formatDuration,
  formatDateRange,
  formatSpeed,
  formatPower,
  calculateAverageSpeed,
  calculateEnergyConsumption,
  formatEnergyConsumption,
  safeNumber,
  safeToFixed,
  convertToMapPoint,
} from '@/utils';
import apiClient from '@/lib/apiClient';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
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

dayjs.extend(utc);

// 格式化地址，去掉最后2个逗号后面的内容
const formatAddress = (address: string): string => {
  if (!address) return '未知位置';
  
  // 按逗号分割地址
  const parts = address.split(',');
  
  // 如果有超过2个部分，只保留前面的部分，去掉最后2个逗号后的内容
  if (parts.length > 2) {
    return parts.slice(0, -2).join(',').trim();
  }
  
  return address.trim();
};

const DriveDetailPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const driveId = params.id as string;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [drive, setDrive] = useState<Drive | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedDriveIdRef = useRef<string | null>(null);
  const isLoadingRef = useRef(false);

  interface DataSeries {
    key: string;
    label: string;
    color: string;
    unit: string;
    visible: boolean;
    yAxisId?: string;
    min?: number;
    max?: number;
  }

  const [dataSeries, setDataSeries] = useState<DataSeries[]>([
    {
      key: 'speed',
      label: '速度',
      color: '#1976D2',
      unit: 'km/h',
      visible: true,
      yAxisId: 'left1',
    },
    {
      key: 'power',
      label: '功率',
      color: '#FF9800',
      unit: 'kW',
      visible: true,
      yAxisId: 'right1',
    },
    {
      key: 'elevation',
      label: '海拔',
      color: '#2E7D32',
      unit: 'm',
      visible: true,
      yAxisId: 'left2',
    },
    {
      key: 'battery_level',
      label: 'SOC',
      color: '#9C27B0',
      unit: '%',
      visible: true,
      yAxisId: 'right2',
    },
  ]);

  useEffect(() => {
    updateDataSeriesMinMax();
  }, [positions]);

  const toggleSeriesVisibility = (key: string) => {
    setDataSeries(prev => prev.map(s => s.key === key ? { ...s, visible: !s.visible } : s));
  };

  const updateDataSeriesMinMax = () => {
    if (!positions || positions.length === 0) return;
    setDataSeries(prev => prev.map(series => {
      let min = Infinity;
      let max = -Infinity;
      positions.forEach(item => {
        const value = (item as any)[series.key];
        if (value != null && typeof value === 'number') {
          if (!isNaN(value)) {
            min = Math.min(min, value);
            max = Math.max(max, value);
          }
        }
      });
      if (min === Infinity || max === -Infinity) return series;
      return { ...series, min: Number(min.toFixed(2)), max: Number(max.toFixed(2)) };
    }));
  };

  const calculateDataRanges = () => {
    if (!positions || positions.length === 0) return {} as any;
    const raw = {
      speed: { min: Infinity, max: -Infinity },
      power: { min: Infinity, max: -Infinity },
      elevation: { min: Infinity, max: -Infinity },
      soc: { min: Infinity, max: -Infinity },
    } as any;
    positions.forEach(p => {
      if (typeof p.speed === 'number') { raw.speed.min = Math.min(raw.speed.min, p.speed); raw.speed.max = Math.max(raw.speed.max, p.speed); }
      if (typeof p.power === 'number') { raw.power.min = Math.min(raw.power.min, p.power); raw.power.max = Math.max(raw.power.max, p.power); }
      const elev = (p as any).elevation;
      if (typeof elev === 'number') { raw.elevation.min = Math.min(raw.elevation.min, elev); raw.elevation.max = Math.max(raw.elevation.max, elev); }
      if (typeof p.battery_level === 'number') { raw.soc.min = Math.min(raw.soc.min, p.battery_level); raw.soc.max = Math.max(raw.soc.max, p.battery_level); }
    });
    const addMargin = (min: number, max: number, marginPercent: number = 0.1) => {
      if (!isFinite(min) || !isFinite(max) || min === Infinity || max === -Infinity) return undefined as any;
      const maxAbs = Math.max(Math.abs(min), Math.abs(max));
      if (!isFinite(maxAbs) || maxAbs === 0) {
        const base = 1;
        return { min: -base, max: base };
      }
      const margin = maxAbs * marginPercent;
      const value = maxAbs + margin;
      return { min: -value, max: value };
    };
    return {
      speed: addMargin(raw.speed.min, raw.speed.max, 0.1),
      power: addMargin(raw.power.min, raw.power.max, 0.1),
      elevation: addMargin(raw.elevation.min, raw.elevation.max, 0.05),
      soc: addMargin(raw.soc.min, raw.soc.max, 0.05),
    };
  };

  const formatChartData = () => {
    if (!positions || positions.length === 0) return [] as any[];
    return positions.map(p => {
      const localTime = dayjs.utc(p.date).local();
      const timestamp = localTime.valueOf();
      return {
        timestamp,
        speed: safeNumber(p.speed),
        power: safeNumber(p.power),
        elevation: typeof (p as any).elevation === 'number' ? (p as any).elevation : undefined,
        battery_level: safeNumber(p.battery_level),
        timeDisplay: localTime.format('MM-DD HH:mm:ss'),
      };
    });
  };

  const formatXAxisTime = (timestamp: number) => {
    return dayjs(timestamp).format('MM-DD HH:mm');
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const timeDisplay = payload[0]?.payload?.timeDisplay || dayjs(label).format('HH:mm:ss');
      return (
        <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            时间: {timeDisplay}
          </Typography>
          {payload.map((entry: any, index: number) => {
            const series = dataSeries.find(s => s.key === entry.dataKey);
            if (!series || !series.visible) return null;
            return (
              <Typography key={index} variant="body2" sx={{ color: entry.color }}>
                {series.label}: {safeToFixed(entry.value, 0)} {series.unit}
              </Typography>
            );
          })}
        </Box>
      );
    }
    return null;
  };

  useEffect(() => {
    if (!driveId) return;
    
    // 如果已经获取过相同的driveId，或者正在加载中，则跳过
    if (fetchedDriveIdRef.current === driveId || isLoadingRef.current) {
      return;
    }

    const fetchDriveDetail = async () => {
      try {
        isLoadingRef.current = true;
        setLoading(true);
        setError(null);

        const response = await apiClient.get(`/api/drives/${driveId}`);
        const data = await response.json();

        setDrive(data.drive);
        setPositions(data.positions);
        fetchedDriveIdRef.current = driveId;
      } catch (err) {
        console.error('获取行程详情失败:', err);
        setError('获取行程详情失败');
      } finally {
        setLoading(false);
        isLoadingRef.current = false;
      }
    };

    fetchDriveDetail();
  }, [driveId]);

  // 页面加载时滚动到顶部
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [driveId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error || !drive) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.back()}
          sx={{ mb: 2 }}
        >
          返回
        </Button>
        <Alert severity="error">
          {error || '行程不存在'}
        </Alert>
      </Box>
    );
  }



  // 准备地图数据
  const mapCenter: MapPoint = convertToMapPoint(
    (safeNumber(drive.start_latitude) + safeNumber(drive.end_latitude)) / 2,
    (safeNumber(drive.start_longitude) + safeNumber(drive.end_longitude)) / 2
  );

  const mapPaths: MapPath[] = positions.length > 0 ? [{
    points: positions.map(pos => ({ lat: safeNumber(pos.latitude), lng: safeNumber(pos.longitude) })),
    color: '#FF6B6B',
    weight: 4,
    opacity: 0.8,
  }] : [];

  const markers: MapPoint[] = [
    { lat: safeNumber(drive.start_latitude), lng: safeNumber(drive.start_longitude) },
    { lat: safeNumber(drive.end_latitude), lng: safeNumber(drive.end_longitude) },
  ];

  const averageSpeed = calculateAverageSpeed(safeNumber(drive.distance), safeNumber(drive.duration_min));
  const energyUsed = safeNumber(drive.start_ideal_range_km) - safeNumber(drive.end_ideal_range_km);
  const energyConsumption = calculateEnergyConsumption(
    energyUsed,
    safeNumber(drive.distance),
    drive.car_model
  );

  return (
    <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => router.back()}
        sx={{ 
          mb: { xs: 2, sm: 3 },
          borderRadius: 2,
          px: { xs: 2, sm: 3 },
          py: { xs: 1, sm: 1.5 },
          fontSize: { xs: '0.875rem', sm: '1rem' },
        }}
        variant="outlined"
        className="touch-target"
      >
        返回行程列表
      </Button>

      <Typography 
        variant="h4" 
        component="h1" 
        gutterBottom 
        sx={{ 
          fontWeight: 600, 
          color: 'primary.main',
          fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
          mb: { xs: 2, sm: 3 },
        }}
      >
        行程详情 #{drive.id}
      </Typography>

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* 地图区域 */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={{ xs: 2, sm: 3 }}>
            <Card 
              sx={{ 
                height: { xs: '300px', sm: '400px', md: '450px' },
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              }}
            >
              <CardContent sx={{ 
                height: '100%', 
                p: 0,
                '&:last-child': {
                  paddingBottom: 0
                }
              }}>
                <AmapMap
                  center={mapCenter}
                  zoom={isMobile ? 11 : 12}
                  paths={mapPaths}
                  markers={markers}
                  height="100%"
                />
              </CardContent>
            </Card>

            <Card
              sx={{
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                border: '1px solid rgba(0,0,0,0.05)',
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    fontWeight: 600,
                    fontSize: { xs: '1.1rem', sm: '1.25rem' },
                    mb: { xs: 1.5, sm: 2 },
                  }}
                >
                  <Speed color="primary" />
                  行程曲线
                </Typography>

                <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                  {isMobile ? (
                    <Grid container spacing={1}>
                      {dataSeries.map((series) => (
                        <Grid size={{ xs: 6 }} key={series.key}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={series.visible}
                                  onChange={() => toggleSeriesVisibility(series.key)}
                                  size="small"
                                  sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': { color: series.color },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: series.color },
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
                            {series.min !== undefined && series.max !== undefined && (
                              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.65rem', mt: 0.5, textAlign: 'center' }}>
                                {series.min}{series.unit} - {series.max}{series.unit}
                              </Typography>
                            )}
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <FormGroup row>
                      {dataSeries.map((series) => (
                        <Box key={series.key} sx={{ mr: 2, mb: 1 }}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={series.visible}
                                onChange={() => toggleSeriesVisibility(series.key)}
                                sx={{
                                  '& .MuiSwitch-switchBase.Mui-checked': { color: series.color },
                                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: series.color },
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
                            sx={{ margin: 0 }}
                          />
                          {series.min !== undefined && series.max !== undefined && (
                            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.7rem', mt: 0.5, textAlign: 'center' }}>
                              {series.min}{series.unit} - {series.max}{series.unit}
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </FormGroup>
                  )}
                </Box>

                {(() => {
                  const chartData = formatChartData();
                  if (chartData.length === 0) {
                    return (
                      <Box textAlign="center" py={4}>
                        <Typography variant="body1" color="text.secondary">暂无行程曲线数据</Typography>
                      </Box>
                    );
                  }
                  const dataRanges = calculateDataRanges();
                  const visibleSeries = dataSeries.filter(s => s.visible);
                  const yAxes = visibleSeries.map((series) => {
                    if (!series.yAxisId) return null;
                    let domain: [number, number] | undefined, tickCount: number, label: string;
                    switch (series.key) {
                      case 'speed':
                        domain = dataRanges.speed ? [dataRanges.speed.min, dataRanges.speed.max] as [number, number] : undefined;
                        tickCount = 5;
                        label = '速度 (km/h)';
                        break;
                      case 'power':
                        domain = dataRanges.power ? [dataRanges.power.min, dataRanges.power.max] as [number, number] : undefined;
                        tickCount = 5;
                        label = '功率 (kW)';
                        break;
                      case 'elevation':
                        domain = dataRanges.elevation ? [dataRanges.elevation.min, dataRanges.elevation.max] as [number, number] : undefined;
                        tickCount = 5;
                        label = '海拔 (m)';
                        break;
                      case 'battery_level':
                        domain = dataRanges.soc ? [dataRanges.soc.min, dataRanges.soc.max] as [number, number] : undefined;
                        tickCount = 5;
                        label = 'SOC (%)';
                        break;
                      default:
                        domain = undefined;
                        tickCount = 5;
                        label = series.label;
                    }
                    return (
                      <YAxis
                        key={series.yAxisId}
                        yAxisId={series.yAxisId}
                        orientation={series.yAxisId.startsWith('left') ? 'left' : 'right'}
                        domain={domain}
                        tickCount={tickCount}
                        stroke={series.color}
                        fontSize={isMobile ? 10 : 12}
                        width={isMobile ? 35 : 45}
                        hide={true}
                        label={!isMobile ? { value: label, angle: series.yAxisId.startsWith('left') ? -90 : 90, position: series.yAxisId.startsWith('left') ? 'insideLeft' : 'insideRight', style: { textAnchor: 'middle', fill: series.color, fontSize: '12px' } } : undefined}
                        tick={{ fontSize: isMobile ? 9 : 11, fill: series.color }}
                        tickFormatter={(value) => Math.round(value).toString()}
                      />
                    );
                  });

                  return (
                    <Box sx={{ width: '100%', height: { xs: 250, sm: 350, md: 450 } }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart 
                          data={chartData}
                          margin={{ top: isMobile ? 10 : 20, right: isMobile ? 5 : 10, left: isMobile ? 5 : 10, bottom: isMobile ? 10 : 20 }}
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
                          {yAxes}
                          <Tooltip content={<CustomTooltip />} />
                          {!isMobile && <Legend />}
                          {dataSeries.filter(s => s.visible).map(series => (
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
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  );
                })()}
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* 详情信息 */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={{ xs: 2, sm: 3 }}>
            {/* 基本信息卡片 */}
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                border: '1px solid rgba(0,0,0,0.05)',
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: { xs: '1.1rem', sm: '1.25rem' },
                    mb: { xs: 1.5, sm: 2 },
                  }}
                >
                  基本信息
                </Typography>
                
                <Stack spacing={{ xs: 1.5, sm: 2 }}>
                  <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 1.5 }}>
                    <DirectionsCar 
                      color="primary" 
                      sx={{ fontSize: { xs: 20, sm: 24 } }}
                    />
                    <Box>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                      >
                        总距离
                      </Typography>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600,
                          fontSize: { xs: '1rem', sm: '1.25rem' },
                        }}
                      >
                        {formatDistance(drive.distance)}
                      </Typography>
                    </Box>
                  </Box>

                  <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 1.5 }}>
                    <Schedule 
                      color="primary" 
                      sx={{ fontSize: { xs: 20, sm: 24 } }}
                    />
                    <Box>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                      >
                        行程时间
                      </Typography>
                      <Typography 
                        variant="body1"
                        sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                      >
                        {formatDateRange(drive.start_date, drive.end_date)}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                      >
                        耗时: {formatDuration(drive.duration_min)}
                      </Typography>
                    </Box>
                  </Box>

                  <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 1.5 }}>
                    <LocationOn 
                      color="primary" 
                      sx={{ fontSize: { xs: 20, sm: 24 } }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                      >
                        行程路线
                      </Typography>
                      <Stack spacing={0.5}>
                        {/* 起始位置 */}
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              bgcolor: 'success.main',
                            }}
                          />
                          <Typography 
                            variant="body2" 
                            fontSize={{ xs: '0.75rem', sm: '0.875rem' }}
                            color="text.primary"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {formatAddress(drive.start_address)}
                          </Typography>
                        </Stack>
                        
                        {/* 结束位置 */}
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              bgcolor: 'error.main',
                            }}
                          />
                          <Typography 
                            variant="body2" 
                            fontSize={{ xs: '0.75rem', sm: '0.875rem' }}
                            color="text.primary"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {formatAddress(drive.end_address)}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Box>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* 性能数据卡片 */}
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                border: '1px solid rgba(0,0,0,0.05)',
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: { xs: '1.1rem', sm: '1.25rem' },
                    mb: { xs: 1.5, sm: 2 },
                  }}
                >
                  性能数据
                </Typography>
                
                <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                  <Grid size={6}>
                    <Box 
                      textAlign="center"
                      sx={{
                        p: { xs: 1, sm: 1.5 },
                        borderRadius: 2,
                        bgcolor: 'rgba(25, 118, 210, 0.05)',
                        border: '1px solid rgba(25, 118, 210, 0.1)',
                      }}
                    >
                      <Speed 
                        color="primary" 
                        sx={{ 
                          fontSize: { xs: 24, sm: 32 }, 
                          mb: { xs: 0.5, sm: 1 } 
                        }} 
                      />
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
                      >
                        平均速度
                      </Typography>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600,
                          fontSize: { xs: '0.9rem', sm: '1.25rem' },
                        }}
                      >
                        {formatSpeed(averageSpeed)}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={6}>
                    <Box 
                      textAlign="center"
                      sx={{
                        p: { xs: 1, sm: 1.5 },
                        borderRadius: 2,
                        bgcolor: 'rgba(156, 39, 176, 0.05)',
                        border: '1px solid rgba(156, 39, 176, 0.1)',
                      }}
                    >
                      <Speed 
                        color="secondary" 
                        sx={{ 
                          fontSize: { xs: 24, sm: 32 }, 
                          mb: { xs: 0.5, sm: 1 } 
                        }} 
                      />
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
                      >
                        最高速度
                      </Typography>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600,
                          fontSize: { xs: '0.9rem', sm: '1.25rem' },
                        }}
                      >
                        {formatSpeed(drive.speed_max)}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={6}>
                    <Box 
                      textAlign="center"
                      sx={{
                        p: { xs: 1, sm: 1.5 },
                        borderRadius: 2,
                        bgcolor: 'rgba(255, 152, 0, 0.05)',
                        border: '1px solid rgba(255, 152, 0, 0.1)',
                      }}
                    >
                      <ElectricBolt 
                        color="warning" 
                        sx={{ 
                          fontSize: { xs: 24, sm: 32 }, 
                          mb: { xs: 0.5, sm: 1 } 
                        }} 
                      />
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
                      >
                        最大功率
                      </Typography>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600,
                          fontSize: { xs: '0.9rem', sm: '1.25rem' },
                        }}
                      >
                        {formatPower(drive.power_max)}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={6}>
                    <Box 
                      textAlign="center"
                      sx={{
                        p: { xs: 1, sm: 1.5 },
                        borderRadius: 2,
                        bgcolor: 'rgba(2, 136, 209, 0.05)',
                        border: '1px solid rgba(2, 136, 209, 0.1)',
                      }}
                    >
                      <Thermostat 
                        color="info" 
                        sx={{ 
                          fontSize: { xs: 24, sm: 32 }, 
                          mb: { xs: 0.5, sm: 1 } 
                        }} 
                      />
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
                      >
                        平均温度
                      </Typography>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600,
                          fontSize: { xs: '0.9rem', sm: '1.25rem' },
                        }}
                      >
                        {safeToFixed(drive.outside_temp_avg, 1)}°C
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* 能耗信息卡片 */}
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                border: '1px solid rgba(0,0,0,0.05)',
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: { xs: '1.1rem', sm: '1.25rem' },
                    mb: { xs: 1.5, sm: 2 },
                  }}
                >
                  能耗信息
                </Typography>
                
                <Stack spacing={{ xs: 1.5, sm: 2 }}>
                  <Box
                    sx={{
                      p: { xs: 1.5, sm: 2 },
                      borderRadius: 2,
                      bgcolor: 'rgba(76, 175, 80, 0.05)',
                      border: '1px solid rgba(76, 175, 80, 0.1)',
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      起始续航
                    </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600, 
                        color: 'success.main',
                        fontSize: { xs: '1rem', sm: '1.25rem' },
                      }}
                    >
                      {safeToFixed(drive.start_ideal_range_km, 0)} km
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      p: { xs: 1.5, sm: 2 },
                      borderRadius: 2,
                      bgcolor: 'rgba(255, 152, 0, 0.05)',
                      border: '1px solid rgba(255, 152, 0, 0.1)',
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      结束续航
                    </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600, 
                        color: 'warning.main',
                        fontSize: { xs: '1rem', sm: '1.25rem' },
                      }}
                    >
                      {safeToFixed(drive.end_ideal_range_km, 0)} km
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      p: { xs: 1.5, sm: 2 },
                      borderRadius: 2,
                      bgcolor: 'rgba(244, 67, 54, 0.05)',
                      border: '1px solid rgba(244, 67, 54, 0.1)',
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      消耗续航
                    </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600, 
                        color: 'error.main',
                        fontSize: { xs: '1rem', sm: '1.25rem' },
                      }}
                    >
                      {safeToFixed(energyUsed, 1)} km
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      p: { xs: 1.5, sm: 2 },
                      borderRadius: 2,
                      bgcolor: 'rgba(25, 118, 210, 0.05)',
                      border: '1px solid rgba(25, 118, 210, 0.1)',
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      能耗效率
                    </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600,
                        fontSize: { xs: '1rem', sm: '1.25rem' },
                      }}
                    >
                      {formatEnergyConsumption(energyConsumption)}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DriveDetailPage;
