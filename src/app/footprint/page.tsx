'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  Avatar
} from '@mui/material';
import { DirectionsCar, BatteryChargingFull, ElectricBolt, Schedule, TrendingUp, LocationOn } from '@mui/icons-material';
import AmapMap from '@/components/AmapMap';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import TimeFilter from '@/components/TimeFilter';

// 配置dayjs
dayjs.locale('zh-cn');

import { Statistics, Position, MapPath, TimeFilter as TimeFilterType } from '@/types';
import {
  formatDistance,
  formatDuration,
  getRandomColor,
  convertToMapPoint,
  timeFilterOptions,
  getDateRange,
} from '@/utils';
import { getStoredTimeFilter, saveTimeFilter, getDefaultTimeFilter } from '@/utils/timeFilterMemory';

const FootprintPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 时间过滤状态 - 使用默认值初始化，避免hydration错误
  const [selectedFilter, setSelectedFilter] = useState<TimeFilterType>(() => 
    getDefaultTimeFilter()
  );
  const [useCurrentTime, setUseCurrentTime] = useState(true);
  const [customStartDate, setCustomStartDate] = useState<dayjs.Dayjs | null>(null);
  const [customEndDate, setCustomEndDate] = useState<dayjs.Dayjs | null>(null);
  const [customStartTime, setCustomStartTime] = useState<dayjs.Dayjs | null>(null);
  const [customEndTime, setCustomEndTime] = useState<dayjs.Dayjs | null>(null);

  const fetchFootprintData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 获取时间范围
      let startDate: string | null = null;
      let endDate: string | null = null;
      
      if (selectedFilter.value === 'custom') {
        if (customStartDate && customEndDate) {
          // 将dayjs对象转换为原生Date，确保UTC时间格式
          const startDateTime = customStartTime 
            ? new Date(customStartDate.year(), customStartDate.month(), customStartDate.date(), 
                      customStartTime.hour(), customStartTime.minute())
            : new Date(customStartDate.year(), customStartDate.month(), customStartDate.date(), 0, 0, 0);
          const endDateTime = customEndTime
            ? new Date(customEndDate.year(), customEndDate.month(), customEndDate.date(), 
                      customEndTime.hour(), customEndTime.minute())
            : new Date(customEndDate.year(), customEndDate.month(), customEndDate.date(), 23, 59, 59);
          
          // 转换为UTC时间戳，与TeslaMate数据库格式一致
          startDate = new Date(startDateTime.getTime() - (startDateTime.getTimezoneOffset() * 60000)).toISOString();
          endDate = new Date(endDateTime.getTime() - (endDateTime.getTimezoneOffset() * 60000)).toISOString();
        }
      } else if (selectedFilter.value !== 'all') {
        const range = getDateRange(selectedFilter);
        if (useCurrentTime && selectedFilter.value !== 'all') {
          startDate = range.startDate;
          endDate = new Date().toISOString();
        } else {
          startDate = range.startDate;
          endDate = range.endDate;
        }
      }

      const params = new URLSearchParams({
        timeFilter: selectedFilter.value,
      });

      if (startDate) params.append('customStart', startDate);
      if (endDate) params.append('customEnd', endDate);

      const response = await fetch(`/api/footprint?${params}`);
      
      if (!response.ok) {
        throw new Error('获取足迹数据失败');
      }

      const data = await response.json();
      setStatistics(data.statistics);
      setPositions(data.positions);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  // 在组件挂载后加载存储的时间过滤选项
  useEffect(() => {
    const storedFilter = getStoredTimeFilter();
    setSelectedFilter(storedFilter);
  }, []);

  useEffect(() => {
    fetchFootprintData();
  }, [selectedFilter, useCurrentTime, customStartDate, customEndDate, customStartTime, customEndTime]);

  const handleFilterChange = (filter: TimeFilterType) => {
    setSelectedFilter(filter);
    // 保存用户选择到共用的本地存储
    saveTimeFilter(filter);
  };

  // 安全的数值处理
  const safeNumber = (value: any): number => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  // 准备地图数据
  const mapPaths: MapPath[] = positions.length > 0 ? [{
    points: positions.map(pos => convertToMapPoint(safeNumber(pos.latitude), safeNumber(pos.longitude))),
    color: getRandomColor(),
    weight: 3,
    opacity: 0.7,
  }] : [];

  const mapCenter = (positions && positions.length > 0) ? {
    lat: positions.reduce((sum, pos) => sum + safeNumber(pos.latitude), 0) / positions.length,
    lng: positions.reduce((sum, pos) => sum + safeNumber(pos.longitude), 0) / positions.length,
  } : { lat: 39.916, lng: 116.397 };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, sm: 3 } }}>
        <Box display="flex" alignItems="center" gap={2} sx={{ mb: { xs: 2, sm: 3 } }}>
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              width: { xs: 40, sm: 48 },
              height: { xs: 40, sm: 48 },
            }}
          >
            <LocationOn sx={{ fontSize: { xs: 20, sm: 24 } }} />
          </Avatar>
          <Box>
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 600, 
                color: 'primary.main',
                fontSize: { xs: '1.75rem', sm: '2.125rem' },
                lineHeight: 1.2,
              }}
            >
              行程足迹
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mt: 0.5,
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
              }}
            >
              查看Tesla的行程轨迹和统计数据
            </Typography>
          </Box>
        </Box>

        {/* 时间过滤器 */}
        <TimeFilter
          selectedFilter={selectedFilter}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          customStartTime={customStartTime}
          customEndTime={customEndTime}
          onFilterChange={handleFilterChange}
          onCustomStartDateChange={setCustomStartDate}
          onCustomEndDateChange={setCustomEndDate}
          onCustomStartTimeChange={setCustomStartTime}
          onCustomEndTimeChange={setCustomEndTime}
          onCustomTimeSelected={fetchFootprintData}
          loading={loading}
        />

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: { xs: 2, sm: 3 },
              borderRadius: 2,
              fontSize: { xs: '0.875rem', sm: '1rem' },
            }}
          >
            {error}
          </Alert>
        )}

        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {/* 统计数据 */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Stack spacing={{ xs: 2, sm: 3 }}>
              {statistics && (
                <>
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
                        行程统计
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
                            <DirectionsCar 
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
                              总里程
                            </Typography>
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                fontWeight: 600,
                                fontSize: { xs: '0.9rem', sm: '1.25rem' },
                              }}
                            >
                              {formatDistance(statistics.totalDistance)}
                            </Typography>
                          </Box>
                        </Grid>

                        <Grid size={6}>
                          <Box 
                            textAlign="center"
                            sx={{
                              p: { xs: 1, sm: 1.5 },
                              borderRadius: 2,
                              bgcolor: 'rgba(76, 175, 80, 0.05)',
                              border: '1px solid rgba(76, 175, 80, 0.1)',
                            }}
                          >
                            <TrendingUp 
                              color="success" 
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
                              行程次数
                            </Typography>
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                fontWeight: 600,
                                fontSize: { xs: '0.9rem', sm: '1.25rem' },
                              }}
                            >
                              {statistics.totalDrives}
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
                            <Schedule 
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
                              总时长
                            </Typography>
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                fontWeight: 600,
                                fontSize: { xs: '0.9rem', sm: '1.25rem' },
                              }}
                            >
                              {formatDuration(statistics.totalDuration)}
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
                            <BatteryChargingFull 
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
                              平均能耗
                            </Typography>
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                fontWeight: 600,
                                fontSize: { xs: '0.9rem', sm: '1.25rem' },
                              }}
                            >
                              {statistics.averageEfficiency.toFixed(0)} Wh/km
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>




                </>
              )}
            </Stack>
          </Grid>

          {/* 地图区域 */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card 
              sx={{ 
                height: { xs: '300px', sm: '400px', md: '500px' },
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                overflow: 'hidden',
              }}
            >
              <CardContent sx={{ 
                height: '100%', 
                p: 0,
                '&:last-child': {
                  paddingBottom: 0
                }
              }}>
                {loading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <CircularProgress size={60} />
                  </Box>
                ) : (
                  <AmapMap
                    center={mapCenter}
                    zoom={isMobile ? 9 : 10}
                    paths={mapPaths}
                    height="100%"
                  />
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    );
};

export default FootprintPage;