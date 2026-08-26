'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Box, Alert, CircularProgress, IconButton } from '@mui/material';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import { MapPoint, MapPath } from '@/types';
import { convertToMapPoint } from '@/utils';

interface AmapMapProps {
  center?: MapPoint;
  zoom?: number;
  paths?: MapPath[];
  markers?: MapPoint[];
  height?: string | number;
  onMapReady?: (map: any) => void;
}

declare global {
  interface Window {
    AMap: any;
    AMapLoader: any;
    _AMapSecurityConfig: any;
    initAmapMap?: () => void;
  }
}

const AmapMap: React.FC<AmapMapProps> = ({
  center = { lat: 39.916, lng: 116.397 },
  zoom = 12,
  paths = [],
  markers = [],
  height = 350,
  onMapReady,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 安全的数值处理和坐标转换
  const safeMapPoint = (point: MapPoint): MapPoint => {
    const lat = Number(point.lat);
    const lng = Number(point.lng);
    
    // 如果坐标无效，返回默认坐标（北京）
    if (isNaN(lat) || isNaN(lng)) {
      return { lat: 39.916, lng: 116.397 };
    }
    
    // 进行WGS84到GCJ02坐标转换
    return convertToMapPoint(lat, lng);
  };

  useEffect(() => {
    const loadAmapMap = async () => {
      try {
        if (typeof window === 'undefined') return;

        // 设置安全密钥配置 - 必须在加载地图之前设置
        window._AMapSecurityConfig = {
          securityJsCode: process.env.NEXT_PUBLIC_AMAP_SECURITY_KEY || 'your_security_key'
        };

        // 检查是否已经加载了AMapLoader
        if (!window.AMapLoader) {
          // 动态加载AMapLoader
          const loaderScript = document.createElement('script');
          loaderScript.src = 'https://webapi.amap.com/loader.js';
          loaderScript.async = true;
          
          await new Promise((resolve, reject) => {
            loaderScript.onload = resolve;
            loaderScript.onerror = reject;
            document.head.appendChild(loaderScript);
          });
        }

        // 使用AMapLoader加载地图
        const AMap = await window.AMapLoader.load({
          key: process.env.NEXT_PUBLIC_AMAP_API_KEY || 'your_api_key',
          version: '2.0',
          plugins: ['AMap.Scale', 'AMap.ToolBar', 'AMap.Marker', 'AMap.Polyline']
        });

        // 初始化地图
        initMap(AMap);

      } catch (err) {
        console.error('高德地图加载失败:', err);
        setError('高德地图加载失败，请检查API密钥配置');
        setLoading(false);
      }
    };

    const initMap = (AMap: any) => {
      try {
        if (!mapRef.current || mapInstanceRef.current) return;

        const safeCenter = safeMapPoint(center);
        
        const map = new AMap.Map(mapRef.current, {
          center: [safeCenter.lng, safeCenter.lat],
          zoom: zoom,
          mapStyle: 'amap://styles/normal',
          viewMode: '2D',
          lang: 'zh_cn',
          features: ['bg', 'road', 'building', 'point'],
        });

        mapInstanceRef.current = map;

        // 添加控件 - 使用新的API方式
        try {
          // 添加比例尺控件
          const scale = new AMap.Scale({
            position: 'LB' // 左下角
          });
          map.addControl(scale);
        } catch (err) {
          console.warn('添加比例尺控件失败:', err);
        }

        try {
          // 添加工具条控件
          const toolbar = new AMap.ToolBar({
            position: 'RT' // 右上角
          });
          map.addControl(toolbar);
        } catch (err) {
          console.warn('添加工具条控件失败:', err);
        }

        // 添加标记点
        if (markers && markers.length > 0) {
          markers.forEach((marker) => {
            try {
              const safeMarker = safeMapPoint(marker);
              const mapMarker = new AMap.Marker({
                position: [safeMarker.lng, safeMarker.lat],
              });
              map.add(mapMarker);
            } catch (err) {
              console.warn('添加标记点失败:', err);
            }
          });
        }

        // 添加路径
        if (paths && paths.length > 0) {
          const allPoints: number[][] = [];
          
          paths.forEach((path) => {
            try {
              if (!path.points || path.points.length === 0) return;
              
              const points = path.points
                .filter(p => p && typeof p.lat === 'number' && typeof p.lng === 'number')
                .map(p => {
                  const safePoint = safeMapPoint(p);
                  const point = [safePoint.lng, safePoint.lat];
                  allPoints.push(point);
                  return point;
                });

              if (points.length > 1) {
                const polyline = new AMap.Polyline({
                  path: points,
                  strokeColor: path.color || '#FF6B6B',
                  strokeWeight: path.weight || 3,
                  strokeOpacity: path.opacity || 0.8,
                  lineJoin: 'round',
                  lineCap: 'round',
                });
                map.add(polyline);
              }
            } catch (err) {
              console.warn('添加路径失败:', err);
            }
          });

          // 如果有路径，自动调整视野
          try {
            if (allPoints.length > 0) {
              map.setFitView(null, false, [20, 20, 20, 20]);
            }
          } catch (err) {
            console.warn('调整视野失败:', err);
          }
        }

        setLoading(false);
        setError(null);

        if (onMapReady) {
          onMapReady(map);
        }
      } catch (err) {
        setError('地图初始化失败');
        setLoading(false);
        console.error('地图初始化错误:', err);
      }
    };

    loadAmapMap();

    return () => {
      try {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.clearMap();
          mapInstanceRef.current.destroy();
          mapInstanceRef.current = null;
        }
      } catch (err) {
        // 忽略清理错误
      }
    };
  }, [center, zoom, paths, markers, onMapReady]);

  // 全屏切换后，等样式生效再让地图适配新视口尺寸
  useEffect(() => {
    if (!isFullscreen) return;
    const timer = setTimeout(() => {
      const map = mapInstanceRef.current;
      if (!map) return;
      try {
        if (typeof map.resize === 'function') {
          map.resize();
        }
        if ((paths && paths.length > 0) || (markers && markers.length > 0)) {
          map.setFitView(null, false, [20, 20, 20, 20]);
        }
      } catch (err) {
        console.warn('全屏切换后调整地图失败:', err);
      }
    }, 50);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFullscreen]);

  // 全屏时支持 ESC 退出，并锁定页面滚动
  useEffect(() => {
    if (!isFullscreen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isFullscreen]);

  if (error) {
    return (
      <Box
        sx={{
          width: '100%',
          height: typeof height === 'number' ? `${height}px` : height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        height: typeof height === 'number' ? `${height}px` : height,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 2,
        ...(isFullscreen && {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          '@supports (height: 100dvh)': {
            height: '100dvh',
          },
          zIndex: 1300,
          borderRadius: 0,
          backgroundColor: 'background.paper',
        }),
      }}
    >
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            zIndex: 1000,
            borderRadius: 2,
          }}
        >
          <CircularProgress />
        </Box>
      )}
      <Box
        ref={mapRef}
        className="amap-container"
        sx={{
          width: '100%',
          height: '100%',
          borderRadius: 2,
          overflow: 'hidden',
          ...(isFullscreen && {
            borderRadius: 0,
          }),
        }}
      />
      <IconButton
        onClick={() => setIsFullscreen((v) => !v)}
        aria-label={isFullscreen ? '退出全屏' : '全屏显示'}
        size="small"
        sx={{
          position: 'absolute',
          top: isFullscreen ? 'max(12px, env(safe-area-inset-top))' : 12,
          left: 12,
          zIndex: 1001,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 1)',
          },
        }}
      >
        {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
      </IconButton>
    </Box>
  );
};

export default AmapMap;