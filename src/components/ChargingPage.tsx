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
  BatteryChargingFull,
  Schedule,
  ElectricBolt,
  Battery90,
  AccessTime,
  LocationOn,
  TrendingUp,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { ChargingProcess, TimeFilter as TimeFilterType } from '@/types';
import { formatDateRange, timeFilterOptions, getDateRange } from '@/utils';
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

const ChargingPage: React.FC = () => {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { currentTheme } = useThemeColor();
  
  const [chargingSessions, setChargingSessions] = useState<ChargingProcess[]>([]);
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
    if (newDate && !customStartTime) {
      setCustomStartTime(dayjs().startOf('day'));
    }
    if (newDate && customEndDate && newDate.isAfter(customEndDate, 'day')) {
      setCustomEndDate(newDate);
      setCustomEndTime(dayjs().endOf('day'));
    }
    if (customEndDate) {
      setTimeout(() => {
        setPage(1);
        fetchChargingSessions(1);
      }, 100);
    }
  };

  const handleEndDateChange = (newDate: dayjs.Dayjs | null) => {
    if (newDate && customStartDate && newDate.isBefore(customStartDate, 'day')) {
      return;
    }
    setCustomEndDate(newDate);
    if (newDate && !customEndTime) {
      setCustomEndTime(dayjs().endOf('day'));
    }
    if (customStartDate) {
      setTimeout(() => {
        setPage(1);
        fetchChargingSessions(1);
      }, 100);
    }
  };
  
  const fetchChargingSessions = async (pageNum: number) => {
    try {
      setLoading(true);
      
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
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('获取充电数据失败');
      }

      const data = await response.json();
      setChargingSessions(data.chargingProcesses || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  // 处理时间过滤变化
  const handleFilterChange = (filter: TimeFilterType) => {
    setSelectedFilter(filter);
    setPage(1);
    fetchChargingSessions(1);
  };

  const handleUseCurrentTimeChange = (useCurrentTime: boolean) => {
    setUseCurrentTime(useCurrentTime);
    setPage(1);
    fetchChargingSessions(1);
  };

  // 处理分页变化
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    fetchChargingSessions(value);
  };

  // 处理充电记录点击
  const handleChargingClick = (chargingId: number) => {
    router.push(`/charging/${chargingId}`);
  };

  // 初始化数据
  useEffect(() => {
    fetchChargingSessions(1);
  }, []);

  // 渲染充电记录卡片
  const renderChargingCard = (charging: ChargingProcess) => {
    const startTime = dayjs(charging.start_date).add(8, 'hour');
    const endTime = dayjs(charging.end_date).add(8, 'hour');
    const batteryGain = safeNumber(charging.end_battery_level) - safeNumber(charging.start_battery_level);
    // 计算平均充电功率 (kW) = 充电能量 (kWh) / 充电时长 (小时)
    const avgPower = safeNumber(charging.duration_min) > 0 ? (safeNumber(charging.charge_energy_added) / (safeNumber(charging.duration_min) / 60)) : 0;
    
    return (
      <Card
        key={charging.id}
        sx={{
          mb: 2,
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[4],
          },
          border: '1px solid',
          borderColor: 'divider',
        }}
        onClick={() => handleChargingClick(charging.id)}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          {/* 头部信息 */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <Avatar
                sx={{
                  bgcolor: `${currentTheme}.main`,
                  width: 40,
                  height: 40,
                }}
              >
                <BatteryChargingFull />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  充电记录 #{charging.id}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {charging.car_name || charging.car_model || '未知车辆'}
                </Typography>
              </Box>
            </Box>
            <Chip
              label={`+${formatBatteryLevel(batteryGain)}`}
              color="success"
              size="small"
              sx={{ fontWeight: 600 }}
            />
          </Box>

          {/* 时间信息 */}
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Schedule sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {startTime.format('YYYY-MM-DD HH:mm')} - {endTime.format('HH:mm')}
            </Typography>
            <Chip
              label={formatDuration(safeNumber(charging.duration_min))}
              size="small"
              variant="outlined"
            />
          </Box>

          {/* 地址信息 */}
          {charging.address && (
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary" noWrap>
                {charging.address}
              </Typography>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          {/* 充电数据 */}
          <Box
            display="grid"
            gridTemplateColumns={{ xs: '1fr 1fr', sm: '1fr 1fr 1fr 1fr' }}
            gap={2}
          >
            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary" gutterBottom>
                起始电量
              </Typography>
              <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                <Battery90 sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {formatBatteryLevel(charging.start_battery_level)}
                </Typography>
              </Box>
            </Box>

            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary" gutterBottom>
                结束电量
              </Typography>
              <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                <Battery90 sx={{ fontSize: 16, color: 'success.main' }} />
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {formatBatteryLevel(charging.end_battery_level)}
                </Typography>
              </Box>
            </Box>

            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary" gutterBottom>
                充电能量
              </Typography>
              <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                <ElectricBolt sx={{ fontSize: 16, color: 'warning.main' }} />
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {formatEnergy(safeNumber(charging.charge_energy_added))}
                </Typography>
              </Box>
            </Box>

            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary" gutterBottom>
                充电功率
              </Typography>
              <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                <TrendingUp sx={{ fontSize: 16, color: 'info.main' }} />
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {formatPower(avgPower)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      {/* 时间过滤器 */}
      <Paper sx={{ p: 3, mb: 3 }}>
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
      </Paper>

      {/* 统计信息 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          充电统计
        </Typography>
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
      </Paper>

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
          {chargingSessions.map(renderChargingCard)}
          
          {/* 分页 */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size={isMobile ? 'small' : 'medium'}
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default ChargingPage;