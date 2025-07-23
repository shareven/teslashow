'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  FormControlLabel,
  Switch,
  Typography,
  Stack,
  Avatar,
  IconButton,
  Collapse,
  Chip,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Backdrop,
} from '@mui/material';
import {
  FilterList,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { DatePicker, TimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useThemeColor } from '@/lib/ThemeColorProvider';
import { timeFilterOptions } from '@/utils';
import type { TimeFilter } from '@/types';

interface TimeFilterProps {
  selectedFilter: TimeFilter;
  useCurrentTime: boolean;
  customStartDate: dayjs.Dayjs | null;
  customEndDate: dayjs.Dayjs | null;
  customStartTime: dayjs.Dayjs | null;
  customEndTime: dayjs.Dayjs | null;
  onFilterChange: (filter: TimeFilter) => void;
  onUseCurrentTimeChange: (useCurrentTime: boolean) => void;
  onCustomStartDateChange: (date: dayjs.Dayjs | null) => void;
  onCustomEndDateChange: (date: dayjs.Dayjs | null) => void;
  onCustomStartTimeChange: (time: dayjs.Dayjs | null) => void;
  onCustomEndTimeChange: (time: dayjs.Dayjs | null) => void;
  onCustomTimeSelected?: () => void;
  variant?: 'collapsible' | 'simple';
  title?: string;
  loading?: boolean;
}

const TimeFilter: React.FC<TimeFilterProps> = ({
  selectedFilter,
  useCurrentTime,
  customStartDate,
  customEndDate,
  customStartTime,
  customEndTime,
  onFilterChange,
  onUseCurrentTimeChange,
  onCustomStartDateChange,
  onCustomEndDateChange,
  onCustomStartTimeChange,
  onCustomEndTimeChange,
  onCustomTimeSelected,
  variant = 'simple',
  title = '时间过滤',
  loading = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { currentTheme } = useThemeColor();
  const [filterExpanded, setFilterExpanded] = useState(false);

  // 日期验证函数
  const handleStartDateChange = (newDate: dayjs.Dayjs | null) => {
    onCustomStartDateChange(newDate);
    // 如果开始时间为空，设置为00:00:00
    if (newDate && !customStartTime) {
      onCustomStartTimeChange(newDate.startOf('day'));
    }
    // 如果开始日期晚于结束日期，自动调整结束日期
    if (newDate && customEndDate && newDate.isAfter(customEndDate, 'day')) {
      onCustomEndDateChange(newDate);
      // 同时设置结束时间为23:59:59
      if (!customEndTime) {
        onCustomEndTimeChange(newDate.endOf('day'));
      }
    }
    // 如果有结束日期，触发自动更新
    if (customEndDate && onCustomTimeSelected) {
      setTimeout(() => onCustomTimeSelected(), 100);
    }
  };

  const handleEndDateChange = (newDate: dayjs.Dayjs | null) => {
    // 如果结束日期早于开始日期，不允许设置
    if (newDate && customStartDate && newDate.isBefore(customStartDate, 'day')) {
      return;
    }
    onCustomEndDateChange(newDate);
    // 如果结束时间为空，设置为23:59:59
    if (newDate && !customEndTime) {
      onCustomEndTimeChange(newDate.endOf('day'));
    }
    // 如果有开始日期，触发自动更新
    if (customStartDate && onCustomTimeSelected) {
      setTimeout(() => onCustomTimeSelected(), 100);
    }
  };

  const handleTimeChange = (
    setter: (time: dayjs.Dayjs | null) => void,
    newTime: dayjs.Dayjs | null
  ) => {
    setter(newTime);
    // 如果有完整的日期范围，触发自动更新
    if (customStartDate && customEndDate && onCustomTimeSelected) {
      setTimeout(() => onCustomTimeSelected(), 100);
    }
  };

  const handleFilterSelectChange = (value: string) => {
    const filter = timeFilterOptions.find(f => f.value === value);
    if (filter) {
      onFilterChange(filter);
    } else if (value === 'custom') {
      onFilterChange({ value: 'custom', label: '自定义' });
      
      // 当选择自定义时，如果没有设置时间，自动设置默认时间
      if (customStartDate && !customStartTime) {
        onCustomStartTimeChange(customStartDate.startOf('day'));
      }
      if (customEndDate && !customEndTime) {
        onCustomEndTimeChange(customEndDate.endOf('day'));
      }
      
      // 如果没有设置日期，设置为今天
      if (!customStartDate) {
        const today = dayjs().startOf('day');
        onCustomStartDateChange(today);
        onCustomStartTimeChange(today);
      }
      if (!customEndDate) {
        const today = dayjs().endOf('day');
        onCustomEndDateChange(today.startOf('day'));
        onCustomEndTimeChange(today);
      }
    }
  };

  const renderFilterContent = () => (
    <Grid container spacing={2} alignItems="center">
      <Grid size={{ xs: 12, sm: 6, md: variant === 'collapsible' ? 3 : 2 }}>
        <FormControl fullWidth size={variant === 'collapsible' ? 'small' : isMobile ? 'small' : 'medium'}>
          <InputLabel sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>时间范围</InputLabel>
          <Select
            value={selectedFilter.value}
            label="时间范围"
            onChange={(e) => handleFilterSelectChange(e.target.value)}
            sx={{
              borderRadius: 2,
              minHeight: variant === 'collapsible' ? { xs: 48, sm: 40 } : undefined,
              '& .MuiSelect-select': {
                fontSize: { xs: '0.875rem', sm: '1rem' },
              },
            }}
          >
            {timeFilterOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
            <MenuItem value="custom">自定义</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      {selectedFilter.value !== 'custom' && selectedFilter.value !== 'all' && (
        <Grid size={{ xs: 12, sm: 6, md: variant === 'collapsible' ? 4 : 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={useCurrentTime}
                onChange={(e) => onUseCurrentTimeChange(e.target.checked)}
                color="primary"
                size={variant === 'collapsible' ? 'small' : isMobile ? 'small' : 'medium'}
              />
            }
            label={
              <Typography sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                使用当前时间作为结束时间
              </Typography>
            }
            sx={{
              '& .MuiFormControlLabel-label': {
                fontSize: variant === 'collapsible' ? { xs: '0.875rem', sm: '1rem' } : { xs: '0.8rem', sm: '0.875rem' },
              },
            }}
          />
        </Grid>
      )}

      {selectedFilter.value === 'custom' && (
        <>
          <Grid size={{ xs: 12, sm: 6, md: variant === 'collapsible' ? 3 : 2 }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="开始日期"
                value={customStartDate}
                onChange={handleStartDateChange}
                slotProps={{ 
                  textField: { 
                    size: variant === 'collapsible' ? 'small' : isMobile ? 'small' : 'medium',
                    fullWidth: true,
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        minHeight: variant === 'collapsible' ? { xs: 48, sm: 40 } : undefined,
                      },
                      '& .MuiInputBase-root': {
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                      },
                    },
                  } 
                }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: variant === 'collapsible' ? 3 : 2 }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <TimePicker
                label="开始时间"
                value={customStartTime}
                onChange={(newTime) => handleTimeChange(onCustomStartTimeChange, newTime)}
                slotProps={{ 
                  textField: { 
                    size: variant === 'collapsible' ? 'small' : isMobile ? 'small' : 'medium',
                    fullWidth: true,
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        minHeight: variant === 'collapsible' ? { xs: 48, sm: 40 } : undefined,
                      },
                      '& .MuiInputBase-root': {
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                      },
                    },
                  } 
                }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: variant === 'collapsible' ? 3 : 2 }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="结束日期"
                value={customEndDate}
                onChange={handleEndDateChange}
                minDate={customStartDate || undefined}
                slotProps={{ 
                  textField: { 
                    size: variant === 'collapsible' ? 'small' : isMobile ? 'small' : 'medium',
                    fullWidth: true,
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        minHeight: variant === 'collapsible' ? { xs: 48, sm: 40 } : undefined,
                      },
                      '& .MuiInputBase-root': {
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                      },
                    },
                  } 
                }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: variant === 'collapsible' ? 3 : 2 }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <TimePicker
                label="结束时间"
                value={customEndTime}
                onChange={(newTime) => handleTimeChange(onCustomEndTimeChange, newTime)}
                slotProps={{ 
                  textField: { 
                    size: variant === 'collapsible' ? 'small' : isMobile ? 'small' : 'medium',
                    fullWidth: true,
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        minHeight: variant === 'collapsible' ? { xs: 48, sm: 40 } : undefined,
                      },
                      '& .MuiInputBase-root': {
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                      },
                    },
                  } 
                }}
              />
            </LocalizationProvider>
          </Grid>
        </>
      )}
    </Grid>
  );

  if (variant === 'collapsible') {
    return (
      <Card
        sx={{
          mb: { xs: 2, sm: 3 },
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.06)',
          background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
          position: 'relative',
        }}
        className="fade-in"
        style={{ animationDelay: '0.2s' }}
      >
        {loading && (
          <Backdrop
            sx={{
              position: 'absolute',
              zIndex: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              borderRadius: 3,
            }}
            open={loading}
          >
            <CircularProgress size={40} />
          </Backdrop>
        )}
        <Box
          sx={{
            p: { xs: 2, sm: 3 },
            background: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.secondary} 100%)`,
            color: 'white',
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Avatar
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  width: { xs: 32, sm: 36 },
                  height: { xs: 32, sm: 36 },
                }}
              >
                <FilterList sx={{ fontSize: { xs: 18, sm: 20 } }} />
              </Avatar>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: '1rem', sm: '1.125rem' },
                }}
              >
                {title}
              </Typography>
              {selectedFilter.value !== 'all' && (
                <Chip 
                  label="已筛选" 
                  size="small" 
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontSize: '0.75rem',
                    height: 24,
                  }}
                />
              )}
            </Stack>
            <IconButton
              onClick={() => setFilterExpanded(!filterExpanded)}
              disabled={loading}
              sx={{
                color: 'white',
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                },
                '&:disabled': {
                  color: 'rgba(255, 255, 255, 0.5)',
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                },
                minHeight: { xs: 44, sm: 40 },
                minWidth: { xs: 44, sm: 40 },
              }}
              className="touch-target"
            >
              {filterExpanded ? (
                <ExpandLess sx={{ fontSize: { xs: 20, sm: 24 } }} />
              ) : (
                <ExpandMore sx={{ fontSize: { xs: 20, sm: 24 } }} />
              )}
            </IconButton>
          </Stack>
        </Box>
        
        <Collapse in={filterExpanded}>
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {renderFilterContent()}
          </Box>
        </Collapse>
      </Card>
    );
  }

  // Simple variant
  return (
    <Card 
      sx={{ 
        mb: { xs: 2, sm: 3 },
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
        border: '1px solid rgba(0,0,0,0.05)',
        position: 'relative',
      }}
    >
      {loading && (
        <Backdrop
          sx={{
            position: 'absolute',
            zIndex: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderRadius: 3,
          }}
          open={loading}
        >
          <CircularProgress size={40} />
        </Backdrop>
      )}
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography 
          variant="h6" 
          gutterBottom 
          sx={{ 
            fontWeight: 600, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            fontSize: { xs: '1.1rem', sm: '1.25rem' },
            mb: { xs: 1.5, sm: 2 },
          }}
        >
          <FilterList color="primary" sx={{ fontSize: { xs: 20, sm: 24 } }} />
          {title}
        </Typography>
        
        {renderFilterContent()}
      </CardContent>
    </Card>
  );
};

export default TimeFilter;