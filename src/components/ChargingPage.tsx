'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Button,
  CircularProgress,
  Alert,
  Stack,
  Divider,
  Avatar,
  Paper,
  Container,
  useTheme,
} from '@mui/material';
import {
  BatteryChargingFull,
  Schedule,
  ElectricBolt,
  Battery90,
  AccessTime,
  LocationOn,
  TrendingUp,
  Refresh,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { ChargingProcess, TimeFilter as TimeFilterType } from '@/types';
import { formatDateRange, timeFilterOptions, getDateRange } from '@/utils';
import apiClient from '@/lib/apiClient';
import { getStoredTimeFilter, saveTimeFilter, getDefaultTimeFilter } from '@/utils/timeFilterMemory';
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

// 格式化充电时长
const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  
  if (hours === 0) {
    return `${mins}分钟`;
  }
  
  return `${hours}小时${mins}分钟`;
};

// 格式化电量百分比
const formatBatteryLevel = (level: number): string => {
  return `${Math.round(level)}%`;
};

// 格式化充电功率
const formatPower = (power: number): string => {
  return `${safeToFixed(power, 1)} kW`;
};

// 格式化充电能量
const formatEnergy = (energy: number): string => {
  return `${safeToFixed(energy, 1)} kWh`;
};

// 格式化地址
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

const ChargingPage: React.FC = () => {
  const router = useRouter();
  const theme = useTheme();
  const { currentTheme } = useThemeColor();
  
  const [chargingSessions, setChargingSessions] = useState<ChargingProcess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);
  const pagingRef = React.useRef<boolean>(false);
  
  // 时间过滤状态 - 使用默认值初始化，避免hydration错误
  const [selectedFilter, setSelectedFilter] = useState<TimeFilterType>(() => 
    getDefaultTimeFilter()
  );
  const [useCurrentTime, setUseCurrentTime] = useState(true);
  const [customStartDate, setCustomStartDate] = useState<dayjs.Dayjs | null>(null);
  const [customEndDate, setCustomEndDate] = useState<dayjs.Dayjs | null>(null);
  const [customStartTime, setCustomStartTime] = useState<dayjs.Dayjs | null>(null);
  const [customEndTime, setCustomEndTime] = useState<dayjs.Dayjs | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

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
    // 重置页码到第一页，让useEffect处理数据获取
    if (customEndDate) {
      setPage(1);
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
    // 重置页码到第一页，让useEffect处理数据获取
    if (customStartDate) {
      setPage(1);
    }
  };
  
  const fetchChargingSessions = async (pageNum: number) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      // 获取时间范围
      let startDate: string | null = null;
      let endDate: string | null = null;
      
      if (selectedFilter.value === 'custom') {
        if (customStartDate && customEndDate) {
          const startDateTime = customStartTime 
            ? new Date(customStartDate.year(), customStartDate.month(), customStartDate.date(), 
                      customStartTime.hour(), customStartTime.minute())
            : new Date(customStartDate.year(), customStartDate.month(), customStartDate.date(), 0, 0, 0);
          const endDateTime = customEndTime
            ? new Date(customEndDate.year(), customEndDate.month(), customEndDate.date(), 
                      customEndTime.hour(), customEndTime.minute())
            : new Date(customEndDate.year(), customEndDate.month(), customEndDate.date(), 23, 59, 59);
          
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
      
      let url = `/api/charging?page=${pageNum}&limit=20`;
      if (startDate) {
        url += `&start_date=${startDate}`;
      }
      if (endDate) {
        url += `&end_date=${endDate}`;
      }
      
      const response = await apiClient.get(url);
      const data = await response.json();
      
      setChargingSessions(prev => {
        const incoming: ChargingProcess[] = Array.isArray(data.chargingProcesses) ? (data.chargingProcesses as ChargingProcess[]) : [];
        const merged: ChargingProcess[] = pageNum === 1 ? incoming : [...prev, ...incoming];
        const seen = new Set<number>();
        return merged.filter((c: ChargingProcess) => {
          const id = c.id as number | undefined;
          if (id === undefined || id === null) return true;
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });
      });
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
      setHasNext(!!data.pagination?.hasNext);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      if (pageNum === 1) {
        setLoading(false);
      } else {
        setLoadingMore(false);
        pagingRef.current = false;
      }
    }
  };

  // 处理时间过滤变化
  const handleFilterChange = (filter: TimeFilterType) => {
    setSelectedFilter(filter);
    setPage(1);
    // 保存用户选择到共用的本地存储
    saveTimeFilter(filter);
    
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

  const handleUseCurrentTimeChange = (useCurrentTime: boolean) => {
    setUseCurrentTime(useCurrentTime);
    setPage(1);
  };

  // 监听底部触发器以加载下一页
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !loadingMore && hasNext && !pagingRef.current) {
          pagingRef.current = true;
          setPage((prev) => prev + 1);
        }
      },
      { root: null, rootMargin: '200px', threshold: 0 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, [hasNext, loadingMore]);

  // 处理充电记录点击
  const handleChargingClick = (chargingId: number) => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('scroll:/charging', String(window.scrollY || 0));
      } catch {}
    }
    router.push(`/charging/${chargingId}`);
  };

  // 在组件挂载后加载存储的时间过滤选项
  useEffect(() => {
    const storedFilter = getStoredTimeFilter();
    setSelectedFilter(storedFilter);
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      fetchChargingSessions(page);
    }
  }, [isInitialized, page, selectedFilter, useCurrentTime, customStartDate, customEndDate, customStartTime, customEndTime]);

  useEffect(() => {
    if (!loading && isInitialized) {
      try {
        const shouldRestore = sessionStorage.getItem('restore:/charging') === '1';
        if (shouldRestore) {
          const y = Number(sessionStorage.getItem('scroll:/charging') || '0');
          window.scrollTo({ top: y, behavior: 'auto' });
          sessionStorage.removeItem('restore:/charging');
        }
      } catch {}
    }
  }, [loading, isInitialized]);

  // 渲染充电记录卡片
  const renderChargingCard = (charging: ChargingProcess, index: number) => {
    const startTime = dayjs(charging.start_date);
    const endTime = dayjs(charging.end_date);
    const batteryGain = safeNumber(charging.end_battery_level) - safeNumber(charging.start_battery_level);
    // 计算平均充电功率 (kW) = 充电能量 (kWh) / 充电时长 (小时)
    const avgPower = safeNumber(charging.duration_min) > 0 ? (safeNumber(charging.charge_energy_added) / (safeNumber(charging.duration_min) / 60)) : 0;
    
    return (
      <Card
        key={charging.id}
        sx={{
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
          },
        }}
        onClick={() => handleChargingClick(charging.id)}
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
            <Chip 
              label={charging.charging_type || 'DC'}
              sx={{ 
                bgcolor: charging.charging_type === 'DC' ? '#FF5722' : '#2196F3',
                color: 'white',
                fontWeight: 700,
                fontSize: { xs: '0.875rem', sm: '1rem' },
                height: { xs: 40, sm: 48 },
                width: { xs: 50, sm: 60 },
                border: `2px solid ${charging.charging_type === 'DC' ? '#E64A19' : '#1976D2'}`,
                boxShadow: charging.charging_type === 'DC' 
                  ? '0 2px 8px rgba(255, 87, 34, 0.4)' 
                  : '0 2px 8px rgba(33, 150, 243, 0.4)',
                '& .MuiChip-label': {
                  px: { xs: 1, sm: 1.5 },
                  fontWeight: 700,
                },
              }}
            />
            <Stack flex={1} spacing={0.5}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '0.875rem', sm: '1.125rem' },
                  lineHeight: 1.2,
                }}
              >
                {startTime.format('YYYY-MM-DD HH:mm')} - {endTime.format('HH:mm')}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  opacity: 0.9,
                  fontSize: { xs: '0.625rem', sm: '0.875rem' },
                }}
              >
                充电记录 #{charging.id} · {charging.car_name || charging.car_model || '未知车辆'}
              </Typography>
            </Stack>
            <Chip 
              label={`+${formatBatteryLevel(batteryGain)}`}
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
            {/* 时间和地址信息 */}
            <Stack spacing={1}>
              <Box display="flex" alignItems="center" gap={1}>
                <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  充电时长: {formatDuration(safeNumber(charging.duration_min))}
                </Typography>
              </Box>
              {charging.address && (
                <Box display="flex" alignItems="center" gap={1}>
                  <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {formatAddress(charging.address)}
                  </Typography>
                </Box>
              )}
            </Stack>

            {/* 统计信息网格 */}
            <Box 
              display="grid" 
              gridTemplateColumns={{ xs: '1fr 1fr', sm: '1fr 1fr 1fr 1fr' }}
              gap={{ xs: 1.5, sm: 2 }}
            >
              <Box 
                display="flex" 
                alignItems="center" 
                gap={{ xs: 1, sm: 1.5 }}
                p={{ xs: 1.5, sm: 2 }}
                sx={{
                  borderRadius: 2,
                  bgcolor: 'rgba(33, 150, 243, 0.05)',
                  border: '1px solid rgba(33, 150, 243, 0.1)',
                }}
              >
                <Avatar sx={{ 
                  bgcolor: 'info.main', 
                  width: { xs: 32, sm: 36 }, 
                  height: { xs: 32, sm: 36 } 
                }}>
                  <Battery90 sx={{ fontSize: { xs: 16, sm: 18 } }} />
                </Avatar>
                <Box>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    fontSize={{ xs: '0.625rem', sm: '0.75rem' }}
                  >
                    起始电量
                  </Typography>
                  <Typography 
                    variant="body2" 
                    fontWeight={700} 
                    fontSize={{ xs: '0.75rem', sm: '0.875rem' }}
                    color="info.main"
                  >
                    {formatBatteryLevel(charging.start_battery_level)}
                  </Typography>
                </Box>
              </Box>

              <Box 
                display="flex" 
                alignItems="center" 
                gap={{ xs: 1, sm: 1.5 }}
                p={{ xs: 1.5, sm: 2 }}
                sx={{
                  borderRadius: 2,
                  bgcolor: 'rgba(76, 175, 80, 0.05)',
                  border: '1px solid rgba(76, 175, 80, 0.1)',
                }}
              >
                <Avatar sx={{ 
                  bgcolor: 'success.main', 
                  width: { xs: 32, sm: 36 }, 
                  height: { xs: 32, sm: 36 } 
                }}>
                  <Battery90 sx={{ fontSize: { xs: 16, sm: 18 } }} />
                </Avatar>
                <Box>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    fontSize={{ xs: '0.625rem', sm: '0.75rem' }}
                  >
                    结束电量
                  </Typography>
                  <Typography 
                    variant="body2" 
                    fontWeight={700} 
                    fontSize={{ xs: '0.75rem', sm: '0.875rem' }}
                    color="success.main"
                  >
                    {formatBatteryLevel(charging.end_battery_level)}
                  </Typography>
                </Box>
              </Box>

              <Box 
                display="flex" 
                alignItems="center" 
                gap={{ xs: 1, sm: 1.5 }}
                p={{ xs: 1.5, sm: 2 }}
                sx={{
                  borderRadius: 2,
                  bgcolor: 'rgba(255, 152, 0, 0.05)',
                  border: '1px solid rgba(255, 152, 0, 0.1)',
                }}
              >
                <Avatar sx={{ 
                  bgcolor: 'warning.main', 
                  width: { xs: 32, sm: 36 }, 
                  height: { xs: 32, sm: 36 } 
                }}>
                  <ElectricBolt sx={{ fontSize: { xs: 16, sm: 18 } }} />
                </Avatar>
                <Box>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    fontSize={{ xs: '0.625rem', sm: '0.75rem' }}
                  >
                    充电能量
                  </Typography>
                  <Typography 
                    variant="body2" 
                    fontWeight={700} 
                    fontSize={{ xs: '0.75rem', sm: '0.875rem' }}
                    color="warning.main"
                  >
                    {formatEnergy(safeNumber(charging.charge_energy_added))}
                  </Typography>
                </Box>
              </Box>

              <Box 
                display="flex" 
                alignItems="center" 
                gap={{ xs: 1, sm: 1.5 }}
                p={{ xs: 1.5, sm: 2 }}
                sx={{
                  borderRadius: 2,
                  bgcolor: 'rgba(156, 39, 176, 0.05)',
                  border: '1px solid rgba(156, 39, 176, 0.1)',
                }}
              >
                <Avatar sx={{ 
                  bgcolor: 'secondary.main', 
                  width: { xs: 32, sm: 36 }, 
                  height: { xs: 32, sm: 36 } 
                }}>
                  <TrendingUp sx={{ fontSize: { xs: 16, sm: 18 } }} />
                </Avatar>
                <Box>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    fontSize={{ xs: '0.625rem', sm: '0.75rem' }}
                  >
                    充电功率
                  </Typography>
                  <Typography 
                    variant="body2" 
                    fontWeight={700} 
                    fontSize={{ xs: '0.75rem', sm: '0.875rem' }}
                    color="secondary.main"
                  >
                    {formatPower(avgPower)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Stack>
        </Box>
      </Card>
    );
  };

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
            <BatteryChargingFull sx={{ fontSize: { xs: 20, sm: 24 } }} />
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
              Tesla 充电记录
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                mt: 0.5,
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
            >
              共 {totalCount} 条记录 · 追踪您的每一次充电体验
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box>
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
        onCustomStartTimeChange={setCustomStartTime}
        onCustomEndTimeChange={setCustomEndTime}
      />

      {/* 统计信息 */}
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          border: '1px solid rgba(0,0,0,0.05)',
          mb: 3,
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box
            display="grid"
            gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr 1fr' }}
            gap={2}
          >
            <Box textAlign="center">
              <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700 }}>
                {totalCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                充电次数
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
                {formatEnergy((chargingSessions || []).reduce((sum, c) => sum + safeNumber(c.charge_energy_added), 0))}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                总充电量
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h4" color="warning.main" sx={{ fontWeight: 700 }}>
                {formatDuration((chargingSessions || []).reduce((sum, c) => sum + safeNumber(c.duration_min), 0))}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                总充电时长
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* 充电记录列表 */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : chargingSessions.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <BatteryChargingFull sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            暂无充电记录
          </Typography>
          <Typography variant="body2" color="text.secondary">
            在选定的时间范围内没有找到充电记录
          </Typography>
        </Paper>
      ) : (
        <>
          <Stack spacing={{ xs: 2, sm: 3 }}>
            {chargingSessions.map((charging, index) => renderChargingCard(charging, index))}
          </Stack>
          
          {/* 加载更多触发器 */}
          <Box ref={loadMoreRef} sx={{ height: 1 }} />
          {loadingMore && (
            <Box display="flex" justifyContent="center" mt={3}>
              <CircularProgress size={24} />
            </Box>
          )}
        </>
      )}
      </Box>
    </Container>
  );
};

export default ChargingPage;
