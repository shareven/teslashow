'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Box, Alert, CircularProgress } from '@mui/material';
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

  // 地图初始化 useEffect - 只在组件挂载时执行一次
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
  }, []); // 只在组件挂载时执行一次

  // 更新地图中心和缩放级别
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    try {
      const safeCenter = safeMapPoint(center);
      mapInstanceRef.current.setCenter([safeCenter.lng, safeCenter.lat]);
      mapInstanceRef.current.setZoom(zoom);
    } catch (err) {
      console.warn('更新地图中心和缩放失败:', err);
    }
  }, [center, zoom]);

  // 更新标记点
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    try {
      // 清除现有标记点
      mapInstanceRef.current.clearMap();

      // 添加新的标记点
      if (markers && markers.length > 0) {
        markers.forEach((marker) => {
          try {
            const safeMarker = safeMapPoint(marker);
            const mapMarker = new window.AMap.Marker({
              position: [safeMarker.lng, safeMarker.lat],
            });
            mapInstanceRef.current.add(mapMarker);
          } catch (err) {
            console.warn('添加标记点失败:', err);
          }
        });
      }
    } catch (err) {
      console.warn('更新标记点失败:', err);
    }
  }, [markers]);

  // 更新路径
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    try {
      // 清除现有路径（保留标记点）
      const overlays = mapInstanceRef.current.getAllOverlays('polyline');
      if (overlays && overlays.length > 0) {
        mapInstanceRef.current.remove(overlays);
      }

      // 添加新的路径
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
              const polyline = new window.AMap.Polyline({
                path: points,
                strokeColor: path.color || '#FF6B6B',
                strokeWeight: path.weight || 3,
                strokeOpacity: path.opacity || 0.8,
                lineJoin: 'round',
                lineCap: 'round',
              });
              mapInstanceRef.current.add(polyline);
            }
          } catch (err) {
            console.warn('添加路径失败:', err);
          }
        });

        // 如果有路径，自动调整视野
        try {
          if (allPoints.length > 0) {
            mapInstanceRef.current.setFitView(null, false, [20, 20, 20, 20]);
          }
        } catch (err) {
          console.warn('调整视野失败:', err);
        }
      }
    } catch (err) {
      console.warn('更新路径失败:', err);
    }
  }, [paths]);

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
        }}
      />
    </Box>
  );
};

export default AmapMap;