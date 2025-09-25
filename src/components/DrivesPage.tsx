'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Button,
  Pagination,
  CircularProgress,
  Alert,
  Stack,
  Divider,
  Avatar,
  Paper,
  Container,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  DirectionsCar,
  Schedule,
  Speed,
  BatteryChargingFull,
  Clear,
  ElectricCar,
  TrendingUp,
  AccessTime,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { Drive, TimeFilter as TimeFilterType } from '@/types';
import { calculateEnergyConsumption, formatEnergyConsumption, formatDateRange, timeFilterOptions, getDateRange } from '@/utils';
import { useThemeColor } from '@/lib/ThemeColorProvider';
import TimeFilter from '@/components/TimeFilter';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

// 配置dayjs
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

// 格式化距离 - 假设输入已经是公里
const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${(distance * 1000).toFixed(0)} m`;
  }
  return `${distance.toFixed(1)} km`;
};

// 格式化时长
const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  
  if (hours === 0) {
    return `${mins}分钟`;
  }
  
  return `${hours}小时${mins}分钟`;
};

// 格式化速度 - 输入应该是 km/h
const formatSpeed = (speed: number): string => {
  return `${Math.round(speed)} km/h`;
};

const DrivesPage: React.FC = () => {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { currentTheme } = useThemeColor();
  
  const [drives, setDrives] = useState<Drive[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // 时间过滤状态 - 默认选择近7天
  const [selectedFilter, setSelectedFilter] = useState<TimeFilterType>(
    timeFilterOptions.find(f => f.value === '7days') || timeFilterOptions[0]
  );
  const [useCurrentTime, setUseCurrentTime] = useState(true);
  const [customStartDate, setCustomStartDate] = useState<dayjs.Dayjs | null>(null);
  const [customEndDate, setCustomEndDate] = useState<dayjs.Dayjs | null>(null);
  const [customStartTime, setCustomStartTime] = useState<dayjs.Dayjs | null>(null);
  const [customEndTime, setCustomEndTime] = useState<dayjs.Dayjs | null>(null);

  // 日期验证函数
  const handleStartDateChange = (newDate: dayjs.Dayjs | null) => {
    setCustomStartDate(newDate);
    // 如果开始时间为空，自动设置为00:00:00
    if (newDate && !customStartTime) {
      setCustomStartTime(dayjs().startOf('day'));
    }
    // 如果开始日期晚于结束日期，自动调整结束日期
    if (newDate && customEndDate && newDate.isAfter(customEndDate, 'day')) {
      setCustomEndDate(newDate);
      // 自动设置结束时间为23:59:59
      setCustomEndTime(dayjs().endOf('day'));
    }
    // 如果有结束日期，自动更新数据
    if (customEndDate) {
      setTimeout(() => {
        setPage(1);
        fetchDrives(1);
      }, 100);
    }
  };

  const handleEndDateChange = (newDate: dayjs.Dayjs | null) => {
    // 如果结束日期早于开始日期，不允许设置
    if (newDate && customStartDate && newDate.isBefore(customStartDate, 'day')) {
      return;
    }
    setCustomEndDate(newDate);
    // 如果结束时间为空，自动设置为23:59:59
    if (newDate && !customEndTime) {
      setCustomEndTime(dayjs().endOf('day'));
    }
    // 如果有开始日期，自动更新数据
    if (customStartDate) {
      setTimeout(() => {
        setPage(1);
        fetchDrives(1);
      }, 100);
    }
  };
  
  const fetchDrives = async (pageNum: number) => {
    try {
      setLoading(true);
      
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
          // 使用当前时间作为结束时间
          startDate = range.startDate;
          endDate = new Date().toISOString();
        } else {
          startDate = range.startDate;
          endDate = range.endDate;
        }
      }
      
      let url = `/api/drives?page=${pageNum}&limit=20`;
      if (startDate) {
        url += `&start_date=${startDate}`;
      }
      if (endDate) {
        url += `&end_date=${endDate}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('获取行程数据失败');
      }

      const data = await response.json();
      setDrives(data.drives);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrives(page);
  }, [page, selectedFilter, useCurrentTime, customStartDate, customEndDate, customStartTime, customEndTime]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleFilterChange = (filter: TimeFilter) => {
    setSelectedFilter(filter);
    setPage(1);
    
    // 如果选择自定义时间，设置默认值
    if (filter.value === 'custom') {
      // 如果没有设置时间，自动设置默认时间
      if (!customStartTime) {
        setCustomStartTime(dayjs().startOf('day')); // 00:00:00
      }
      if (!customEndTime) {
        setCustomEndTime(dayjs().endOf('day')); // 23:59:59
      }
      // 如果没有设置日期，自动设置为当天
      if (!customStartDate) {
        setCustomStartDate(dayjs());
      }
      if (!customEndDate) {
        setCustomEndDate(dayjs());
      }
    }
  };

  const handleDriveClick = (driveId: number) => {
    router.push(`/drives/${driveId}`);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3 } }}>
        <Stack spacing={3}>
          {/* 骨架屏标题 */}
          <Box className="skeleton" sx={{ height: 40, borderRadius: 2 }} />
          
          {/* 骨架屏筛选器 */}
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <Stack spacing={2}>
              <Box className="skeleton" sx={{ height: 32, borderRadius: 2 }} />
              <Stack direction="row" spacing={2}>
                <Box className="skeleton" sx={{ height: 40, flex: 1, borderRadius: 2 }} />
                <Box className="skeleton" sx={{ height: 40, width: 100, borderRadius: 2 }} />
              </Stack>
            </Stack>
          </Paper>
          
          {/* 骨架屏卡片 */}
          {[...Array(3)].map((_, index) => (
            <Paper key={index} sx={{ p: 3, borderRadius: 3 }}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box className="skeleton" sx={{ width: 48, height: 48, borderRadius: '50%' }} />
                  <Stack flex={1} spacing={1}>
                    <Box className="skeleton" sx={{ height: 20, width: '60%', borderRadius: 1 }} />
                    <Box className="skeleton" sx={{ height: 16, width: '40%', borderRadius: 1 }} />
                  </Stack>
                </Stack>
                <Stack direction="row" spacing={2}>
                  <Box className="skeleton" sx={{ height: 16, flex: 1, borderRadius: 1 }} />
                  <Box className="skeleton" sx={{ height: 16, flex: 1, borderRadius: 1 }} />
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3 } }}>
        <Paper 
          sx={{ 
            p: 4, 
            textAlign: 'center', 
            borderRadius: 3,
            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
            border: '1px solid #fca5a5'
          }}
          className="fade-in"
        >
          <Avatar sx={{ 
            bgcolor: 'error.main', 
            width: 64, 
            height: 64, 
            mx: 'auto', 
            mb: 2,
            fontSize: '2rem'
          }}>
            ⚠️
          </Avatar>
          <Typography variant="h6" color="error.main" gutterBottom>
            加载失败
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {error}
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => fetchDrives(page)}
            className="button-press"
            sx={{ borderRadius: 3 }}
          >
            重试
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container 
      maxWidth="md" 
      sx={{ 
        px: { xs: 1, sm: 2, md: 3 },
        py: { xs: 1, sm: 2 },
        minHeight: '100vh',
      }}
    >
      {/* 头部区域 */}
      <Box mb={{ xs: 2, sm: 3 }}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Avatar 
            sx={{ 
              bgcolor: 'primary.main',
              width: { xs: 40, sm: 48 },
              height: { xs: 40, sm: 48 },
            }}
          >
            <ElectricCar sx={{ fontSize: { xs: 20, sm: 24 } }} />
          </Avatar>
          <Box>
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 800,
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.25rem' },
                background: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.secondary} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1.2,
              }}
            >
              Tesla 行程记录
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                mt: 0.5,
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
            >
              共 {totalCount} 条记录 · 探索您的每一次精彩旅程
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
          onCustomStartDateChange={handleStartDateChange}
          onCustomEndDateChange={handleEndDateChange}
          onCustomStartTimeChange={(time) => {
            setCustomStartTime(time);
            // 如果有完整的日期范围，自动更新数据
            if (customStartDate && customEndDate) {
              setTimeout(() => {
                setPage(1);
                fetchDrives(1);
              }, 100);
            }
          }}
          onCustomEndTimeChange={(time) => {
            setCustomEndTime(time);
            // 如果有完整的日期范围，自动更新数据
            if (customStartDate && customEndDate) {
              setTimeout(() => {
                setPage(1);
                fetchDrives(1);
              }, 100);
            }
          }}
          loading={loading}
        />
      </Box>

      {/* 行程列表 */}
      <Stack spacing={{ xs: 2, sm: 3 }}>
        {drives.map((drive, index) => (
          <Paper
            key={drive.id}
            sx={{
              p: 0,
              borderRadius: 3,
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              border: '1px solid',
              borderColor: 'divider',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)',
                borderColor: 'primary.main',
              },
              '&:active': {
                transform: 'translateY(-2px)',
              },
            }}
            className="fade-in card-hover touch-target"
            style={{ animationDelay: `${index * 0.1}s` }}
            onClick={() => handleDriveClick(drive.id)}
          >
            {/* 卡片头部 */}
            <Box
              sx={{
                background: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.secondary} 100%)`,
                p: { xs: 2, sm: 2.5 },
                color: 'white',
              }}
            >
              <Stack direction="row" alignItems="center" spacing={{ xs: 1.5, sm: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    width: { xs: 40, sm: 48 },
                    height: { xs: 40, sm: 48 },
                  }}
                >
                  <ElectricCar sx={{ fontSize: { xs: 20, sm: 24 } }} />
                </Avatar>
                <Stack flex={1} spacing={0.5}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: '0.875rem', sm: '1.125rem' },
                      lineHeight: 1.2,
                    }}
                  >
                    {formatDateRange(drive.start_date, drive.end_date)}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      opacity: 0.9,
                      fontSize: { xs: '0.625rem', sm: '0.875rem' },
                    }}
                  >
                    行程 #{drive.id}
                  </Typography>
                </Stack>
                <Chip 
                  label={formatDistance(drive.distance)} 
                  sx={{ 
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    height: { xs: 28, sm: 32 },
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    '& .MuiChip-label': {
                      px: { xs: 1, sm: 1.5 },
                    },
                  }}
                />
              </Stack>
            </Box>

            {/* 卡片内容 */}
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
              <Stack spacing={{ xs: 2, sm: 3 }}>
                {/* 统计信息网格 */}
                <Box 
                  display="grid" 
                  gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr 1fr' }}
                  gap={{ xs: 1.5, sm: 2 }}
                >
                  <Box 
                    display="flex" 
                    alignItems="center" 
                    gap={{ xs: 1, sm: 1.5 }}
                    p={{ xs: 1.5, sm: 2 }}
                    sx={{
                      bgcolor: 'rgba(25, 118, 210, 0.05)',
                      borderRadius: 2,
                      border: '1px solid rgba(25, 118, 210, 0.1)',
                    }}
                  >
                    <Avatar sx={{ 
                      bgcolor: '#1976d2', 
                      width: { xs: 32, sm: 36 }, 
                      height: { xs: 32, sm: 36 } 
                    }}>
                      <Schedule sx={{ fontSize: { xs: 16, sm: 18 } }} />
                    </Avatar>
                    <Box>
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        fontSize={{ xs: '0.625rem', sm: '0.75rem' }}
                      >
                        耗时
                      </Typography>
                      <Typography 
                        variant="body2" 
                        fontWeight={700} 
                        fontSize={{ xs: '0.75rem', sm: '0.875rem' }}
                        color="#1976d2"
                      >
                        {formatDuration(drive.duration_min)}
                      </Typography>
                    </Box>
                  </Box>

                  <Box 
                    display="flex" 
                    alignItems="center" 
                    gap={{ xs: 1, sm: 1.5 }}
                    p={{ xs: 1.5, sm: 2 }}
                    sx={{
                      bgcolor: 'rgba(76, 175, 80, 0.05)',
                      borderRadius: 2,
                      border: '1px solid rgba(76, 175, 80, 0.1)',
                    }}
                  >
                    <Avatar sx={{ 
                      bgcolor: 'success.main', 
                      width: { xs: 32, sm: 36 }, 
                      height: { xs: 32, sm: 36 } 
                    }}>
                      <Speed sx={{ fontSize: { xs: 16, sm: 18 } }} />
                    </Avatar>
                    <Box>
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        fontSize={{ xs: '0.625rem', sm: '0.75rem' }}
                      >
                        平均速度
                      </Typography>
                      <Typography 
                        variant="body2" 
                        fontWeight={700} 
                        fontSize={{ xs: '0.75rem', sm: '0.875rem' }}
                        color="success.main"
                      >
                        {formatSpeed(drive.distance / (drive.duration_min / 60))}
                      </Typography>
                    </Box>
                  </Box>

                  <Box 
                    display="flex" 
                    alignItems="center" 
                    gap={{ xs: 1, sm: 1.5 }}
                    p={{ xs: 1.5, sm: 2 }}
                    sx={{
                      bgcolor: 'rgba(255, 152, 0, 0.05)',
                      borderRadius: 2,
                      border: '1px solid rgba(255, 152, 0, 0.1)',
                    }}
                  >
                    <Avatar sx={{ 
                      bgcolor: 'warning.main', 
                      width: { xs: 32, sm: 36 }, 
                      height: { xs: 32, sm: 36 } 
                    }}>
                      <BatteryChargingFull sx={{ fontSize: { xs: 16, sm: 18 } }} />
                    </Avatar>
                    <Box>
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        fontSize={{ xs: '0.625rem', sm: '0.75rem' }}
                      >
                        能耗
                      </Typography>
                      <Typography 
                        variant="body2" 
                        fontWeight={700} 
                        fontSize={{ xs: '0.75rem', sm: '0.875rem' }}
                        color="warning.main"
                      >
                        {formatEnergyConsumption(calculateEnergyConsumption(
                          safeNumber(drive.start_ideal_range_km) - safeNumber(drive.end_ideal_range_km),
                          safeNumber(drive.distance),
                          drive.car_model || 'Model 3'
                        ))}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* 续航信息 */}
                <Box 
                  p={{ xs: 2, sm: 2.5 }}
                  sx={{
                    bgcolor: 'rgba(33, 150, 243, 0.05)',
                    borderRadius: 2,
                    border: '1px solid rgba(33, 150, 243, 0.1)',
                  }}
                >
                  <Stack spacing={1.5}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Avatar sx={{ 
                        bgcolor: 'info.main', 
                        width: { xs: 28, sm: 32 }, 
                        height: { xs: 28, sm: 32 } 
                      }}>
                        <TrendingUp sx={{ fontSize: { xs: 14, sm: 16 } }} />
                      </Avatar>
                      <Typography 
                        variant="subtitle2" 
                        color="info.main" 
                        fontSize={{ xs: '0.75rem', sm: '0.875rem' }}
                        fontWeight={600}
                      >
                        续航变化
                      </Typography>
                    </Stack>
                    <Stack 
                      direction="row" 
                      alignItems="center" 
                      justifyContent="space-between"
                      spacing={2}
                    >
                      <Stack alignItems="center" spacing={0.5}>
                        <Typography 
                          variant="h6" 
                          fontWeight={700} 
                          fontSize={{ xs: '1rem', sm: '1.25rem' }}
                          color="info.main"
                        >
                          {safeToFixed(drive.start_ideal_range_km, 0)}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          fontSize={{ xs: '0.625rem', sm: '0.75rem' }}
                        >
                          起始续航(km)
                        </Typography>
                      </Stack>
                      <Box 
                        sx={{ 
                          flex: 1, 
                          mx: { xs: 1, sm: 2 },
                          height: { xs: 3, sm: 4 }, 
                          bgcolor: 'grey.200', 
                          borderRadius: 2,
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          sx={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            height: '100%',
                            width: `${Math.min(100, Math.max(0, 
                              ((safeNumber(drive.start_ideal_range_km) - safeNumber(drive.end_ideal_range_km)) / 
                               safeNumber(drive.start_ideal_range_km)) * 100
                            ))}%`,
                            background: 'linear-gradient(90deg, #ff5722 0%, #ff9800 100%)',
                            borderRadius: 2,
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </Box>
                      <Stack alignItems="center" spacing={0.5}>
                        <Typography 
                          variant="h6" 
                          fontWeight={700} 
                          fontSize={{ xs: '1rem', sm: '1.25rem' }}
                          color="info.main"
                        >
                          {safeToFixed(drive.end_ideal_range_km, 0)}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          fontSize={{ xs: '0.625rem', sm: '0.75rem' }}
                        >
                          结束续航(km)
                        </Typography>
                      </Stack>
                    </Stack>
                  </Stack>
                </Box>
              </Stack>
            </Box>
          </Paper>
        ))}
      </Stack>

      {/* 空状态 */}
      {drives.length === 0 && (
        <Paper 
          sx={{ 
            textAlign: 'center', 
            py: { xs: 6, sm: 8 },
            px: { xs: 2, sm: 3 },
            mt: { xs: 3, sm: 4 },
            border: '2px dashed',
            borderColor: 'divider',
            bgcolor: 'rgba(245, 245, 245, 0.5)',
            borderRadius: 3,
          }}
          className="fade-in"
          style={{ animationDelay: '0.3s' }}
        >
          <Avatar 
            sx={{ 
              bgcolor: 'rgba(25, 118, 210, 0.1)',
              color: 'primary.main',
              width: { xs: 56, sm: 64 },
              height: { xs: 56, sm: 64 },
              mx: 'auto',
              mb: { xs: 2, sm: 3 },
            }}
          >
            <DirectionsCar sx={{ fontSize: { xs: 28, sm: 32 } }} />
          </Avatar>
          <Typography 
            variant="h6" 
            color="text.primary" 
            gutterBottom
            sx={{
              fontWeight: 600,
              fontSize: { xs: '1rem', sm: '1.25rem' },
              mb: 1,
            }}
          >
            {selectedFilter.value !== 'all' ? '该时间段内暂无行程数据' : '暂无行程数据'}
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{
              fontSize: { xs: '0.875rem', sm: '1rem' },
              maxWidth: 300,
              mx: 'auto',
            }}
          >
            {selectedFilter.value !== 'all' ? '请尝试调整筛选条件查看更多数据' : '开始您的第一次Tesla之旅吧！'}
          </Typography>
          {selectedFilter.value !== 'all' && (
            <Button
              variant="outlined"
              onClick={() => handleFilterChange(timeFilterOptions[0])}
              startIcon={<Clear />}
              sx={{
                mt: 3,
                borderRadius: 2,
                px: 3,
                py: 1,
                fontSize: { xs: '0.875rem', sm: '1rem' },
              }}
              className="button-press touch-target"
            >
              清除筛选条件
            </Button>
          )}
        </Paper>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <Box 
          display="flex" 
          justifyContent="center" 
          mt={{ xs: 3, sm: 4 }}
          mb={{ xs: 2, sm: 3 }}
          px={{ xs: 1, sm: 0 }}
        >
          <Paper
            sx={{
              p: { xs: 1.5, sm: 2 },
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            }}
            className="fade-in"
            style={{ animationDelay: '0.5s' }}
          >
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
              size={isMobile ? "medium" : "large"}
              sx={{
                '& .MuiPaginationItem-root': {
                  borderRadius: 2,
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  minWidth: { xs: 36, sm: 40 },
                  height: { xs: 36, sm: 40 },
                  margin: { xs: '0 2px', sm: '0 4px' },
                  '&:hover': {
                    bgcolor: 'primary.50',
                  },
                  '&.Mui-selected': {
                    background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                    color: 'white',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
                    },
                  },
                },
                '& .MuiPaginationItem-ellipsis': {
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                },
              }}
            />
          </Paper>
        </Box>
      )}
    </Container>
  );
};

export default DrivesPage;