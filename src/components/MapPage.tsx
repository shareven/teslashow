'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useRouter, useSearchParams } from 'next/navigation';
import AmapMap from './AmapMap';
import { MapPoint } from '@/types';

const MapPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [mapCenter, setMapCenter] = useState<MapPoint>({ lat: 39.916, lng: 116.397 });
  const [address, setAddress] = useState<string>('');
  const [markers, setMarkers] = useState<MapPoint[]>([]);

  useEffect(() => {
    // 从URL参数获取地址和坐标信息
    const addressParam = searchParams.get('address');
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');

    if (addressParam) {
      setAddress(decodeURIComponent(addressParam));
    }

    if (latParam && lngParam) {
      const lat = parseFloat(latParam);
      const lng = parseFloat(lngParam);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        const center = { lat, lng };
        setMapCenter(center);
        setMarkers([center]);
      }
    } else if (addressParam) {
      // 如果没有坐标但有地址，可以在这里添加地址解析逻辑
      // 暂时使用默认坐标
      setMarkers([mapCenter]);
    }
  }, [searchParams]);

  const handleBack = () => {
    router.back();
  };

  // 计算地图高度：屏幕高度减去AppBar高度
  const appBarHeight = isMobile ? 56 : 64;
  const mapHeight = `calc(100vh - ${appBarHeight}px)`;

  return (
    <Box sx={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* 顶部返回按钮 */}
      <AppBar 
        position="static" 
        elevation={1}
        sx={{ 
          backgroundColor: 'background.paper',
          color: 'text.primary',
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleBack}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontSize: { xs: '1rem', sm: '1.25rem' },
              fontWeight: 600
            }}
          >
            {address || '地图位置'}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* 地图区域 */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'hidden',
        position: 'relative'
      }}>
        <AmapMap
          center={mapCenter}
          zoom={15}
          markers={markers}
          height={mapHeight}
          onMapReady={(map) => {
            console.log('地图加载完成:', map);
          }}
        />
      </Box>
    </Box>
  );
};

export default MapPage;