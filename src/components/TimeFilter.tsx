'use client';

import React from 'react';
import {
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Backdrop,
} from '@mui/material';
import { FilterList } from '@mui/icons-material';
import { DatePicker, TimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { timeFilterOptions } from '@/utils';
import type { TimeFilter } from '@/types';

interface TimeFilterProps {
  selectedFilter: TimeFilter;
  customStartDate: dayjs.Dayjs | null;
  customEndDate: dayjs.Dayjs | null;
  customStartTime: dayjs.Dayjs | null;
  customEndTime: dayjs.Dayjs | null;
  onFilterChange: (filter: TimeFilter) => void;
  onCustomStartDateChange: (date: dayjs.Dayjs | null) => void;
  onCustomEndDateChange: (date: dayjs.Dayjs | null) => void;
  onCustomStartTimeChange: (time: dayjs.Dayjs | null) => void;
  onCustomEndTimeChange: (time: dayjs.Dayjs | null) => void;
  onCustomTimeSelected?: () => void;
  loading?: boolean;
}

const TimeFilter: React.FC<TimeFilterProps> = ({
  selectedFilter,
  customStartDate,
  customEndDate,
  customStartTime,
  customEndTime,
  onFilterChange,
  onCustomStartDateChange,
  onCustomEndDateChange,
  onCustomStartTimeChange,
  onCustomEndTimeChange,
  onCustomTimeSelected,
  loading = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleStartDateChange = (newDate: dayjs.Dayjs | null) => {
    onCustomStartDateChange(newDate);
    if (newDate && !customStartTime) {
      onCustomStartTimeChange(newDate.startOf('day'));
    }
    if (newDate && customEndDate && newDate.isAfter(customEndDate, 'day')) {
      onCustomEndDateChange(newDate);
      if (!customEndTime) {
        onCustomEndTimeChange(newDate.endOf('day'));
      }
    }
  };

  const handleEndDateChange = (newDate: dayjs.Dayjs | null) => {
    if (newDate && customStartDate && newDate.isBefore(customStartDate, 'day')) {
      return;
    }
    onCustomEndDateChange(newDate);
    if (newDate && !customEndTime) {
      onCustomEndTimeChange(newDate.endOf('day'));
    }
  };

  const handleTimeChange = (
    setter: (time: dayjs.Dayjs | null) => void,
    newTime: dayjs.Dayjs | null
  ) => {
    setter(newTime);
  };

  const handleFilterSelectChange = (value: string) => {
    const filter = timeFilterOptions.find(f => f.value === value);
    if (filter) {
      onFilterChange(filter);
    } else if (value === 'custom') {
      onFilterChange({ value: 'custom', label: '自定义' });
      
      if (customStartDate && !customStartTime) {
        onCustomStartTimeChange(customStartDate.startOf('day'));
      }
      if (customEndDate && !customEndTime) {
        onCustomEndTimeChange(customEndDate.endOf('day'));
      }
      
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
          时间过滤
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size={isMobile ? 'small' : 'medium'}>
              <InputLabel sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>时间范围</InputLabel>
              <Select
                value={selectedFilter.value}
                label="时间范围"
                onChange={(e) => handleFilterSelectChange(e.target.value)}
                sx={{
                  borderRadius: 2,
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

          {selectedFilter.value === 'custom' && (
            <>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="开始日期"
                    value={customStartDate}
                    onChange={handleStartDateChange}
                    slotProps={{ 
                      textField: { 
                        size: isMobile ? 'small' : 'medium',
                        fullWidth: true,
                        sx: {
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
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
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <TimePicker
                    label="开始时间"
                    value={customStartTime}
                    onChange={(newTime) => handleTimeChange(onCustomStartTimeChange, newTime)}
                    slotProps={{ 
                      textField: { 
                        size: isMobile ? 'small' : 'medium',
                        fullWidth: true,
                        sx: {
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
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
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="结束日期"
                    value={customEndDate}
                    onChange={handleEndDateChange}
                    minDate={customStartDate || undefined}
                    slotProps={{ 
                      textField: { 
                        size: isMobile ? 'small' : 'medium',
                        fullWidth: true,
                        sx: {
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
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
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <TimePicker
                    label="结束时间"
                    value={customEndTime}
                    onChange={(newTime) => handleTimeChange(onCustomEndTimeChange, newTime)}
                    slotProps={{ 
                      textField: { 
                        size: isMobile ? 'small' : 'medium',
                        fullWidth: true,
                        sx: {
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
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
      </CardContent>
    </Card>
  );
};

export default TimeFilter;