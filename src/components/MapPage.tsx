'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Container,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useRouter, useSearchParams } from 'next/navigation';
import AmapMap from './AmapMap';
import { MapPoint } from '@/types';

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

  // 页面加载时滚动到顶部
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [searchParams]);

  const handleBack = () => {
    router.back();
  };

  return (
    <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
      {/* 返回按钮 */}
      <Button
        startIcon={<ArrowBack />}
        onClick={handleBack}
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
        返回
      </Button>

      {/* 地址标题 */}
      {address && (
        <Typography 
          variant="h6" 
          component="h1" 
          sx={{ 
            mb: { xs: 2, sm: 3 },
            fontSize: { xs: '1rem', sm: '1.25rem' },
            fontWeight: 500,
            color: 'text.primary'
          }}
        >
          {formatAddress(address)}
        </Typography>
      )}

      {/* 地图区域 */}
      <Box sx={{ 
        height: 'calc(100vh - 200px)',
        minHeight: '400px',
        borderRadius: 2,
        overflow: 'hidden',
        boxShadow: 1
      }}>
        <AmapMap
          center={mapCenter}
          zoom={15}
          markers={markers}
          height="100%"
          onMapReady={(map) => {
            console.log('地图加载完成:', map);
          }}
        />
      </Box>
    </Container>
  );
};

export default MapPage;