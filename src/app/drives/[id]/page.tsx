'use client';

import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    const fetchDriveDetail = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/drives/${driveId}`);
        
        if (!response.ok) {
          throw new Error('获取行程详情失败');
        }

        const data = await response.json();
        setDrive(data.drive);
        setPositions(data.positions);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : '未知错误');
      } finally {
        setLoading(false);
      }
    };

    if (driveId) {
      fetchDriveDetail();
    }
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