'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Box, Alert, CircularProgress, IconButton } from '@mui/material';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import { MapPoint, MapPath } from '@/types';

interface TiandituMapProps {
  center?: MapPoint;
  zoom?: number;
  paths?: MapPath[];
  markers?: MapPoint[];
  height?: string | number;
  onMapReady?: (map: any) => void;
}

declare global {
  interface Window {
    T: any;
    TMAP_ANCHOR_TOP_RIGHT?: string;
    __tdtPromise?: Promise<any> | null;
  }
}

// 单例加载天地图 JSAPI 4.0（CGCS2000 坐标系，与 TeslaMate 的 WGS84 原始坐标兼容，无需偏移转换）
const loadTdtScript = (): Promise<any> => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('SSR 环境'));
  }
  if (window.T) {
    return Promise.resolve(window.T);
  }
  if (window.__tdtPromise) {
    return window.__tdtPromise;
  }

  const key = process.env.NEXT_PUBLIC_TDT_KEY || '';
  if (!key) {
    // 用户还配置着 v2.x 的高德参数时，给出针对性迁移提示
    const amapLegacy =
      (process.env.NEXT_PUBLIC_AMAP_API_KEY || '').trim() !== '' ||
      (process.env.NEXT_PUBLIC_AMAP_SECURITY_KEY || '').trim() !== '';
    return Promise.reject(
      new Error(
        amapLegacy
          ? '检测到配置的仍是高德地图参数（NEXT_PUBLIC_AMAP_API_KEY / NEXT_PUBLIC_AMAP_SECURITY_KEY），v3.0 已改用天地图，请配置 NEXT_PUBLIC_TDT_KEY 后重启容器'
          : '缺少 NEXT_PUBLIC_TDT_KEY 配置'
      )
    );
  }

  window.__tdtPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://api.tianditu.gov.cn/api?v=4.0&tk=${key}`;
    script.async = true;
    script.onload = () => {
      if (window.T) {
        resolve(window.T);
      } else {
        window.__tdtPromise = null;
        reject(new Error('天地图脚本加载异常（请检查 Key 是否有效）'));
      }
    };
    script.onerror = () => {
      window.__tdtPromise = null;
      reject(new Error('网络错误，无法加载天地图脚本'));
    };
    document.head.appendChild(script);
  });
  return window.__tdtPromise;
};

const TiandituMap: React.FC<TiandituMapProps> = ({
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

  // 数值校验（天地图为 CGCS2000 坐标系，WGS84 数据可直接使用）
  const safeMapPoint = (point: MapPoint): MapPoint => {
    const lat = Number(point.lat);
    const lng = Number(point.lng);

    if (isNaN(lat) || isNaN(lng)) {
      return { lat: 39.916, lng: 116.397 };
    }

    return { lat, lng };
  };

  useEffect(() => {
    let cancelled = false;

    const initMap = (T: any) => {
      if (cancelled || !mapRef.current || mapInstanceRef.current) return;

      const safeCenter = safeMapPoint(center);

      const map = new T.Map(mapRef.current);
      map.centerAndZoom(new T.LngLat(safeCenter.lng, safeCenter.lat), zoom);
      mapInstanceRef.current = map;

      // 控件：比例尺（左下）、缩放按钮（右上，避开左上角的全屏按钮）
      try {
        map.addControl(new T.Control.Scale());
      } catch (err) {
        console.warn('添加比例尺控件失败:', err);
      }

      try {
        const anchor = window.TMAP_ANCHOR_TOP_RIGHT || 'topRight';
        map.addControl(new T.Control.Zoom({ anchor }));
      } catch (err) {
        console.warn('添加缩放控件失败:', err);
      }

      // 添加标记点
      if (markers && markers.length > 0) {
        markers.forEach((marker) => {
          try {
            const safeMarker = safeMapPoint(marker);
            map.addOverLay(new T.Marker(new T.LngLat(safeMarker.lng, safeMarker.lat)));
          } catch (err) {
            console.warn('添加标记点失败:', err);
          }
        });
      }

      // 添加路径
      if (paths && paths.length > 0) {
        const allLngLats: any[] = [];

        paths.forEach((path) => {
          try {
            if (!path.points || path.points.length === 0) return;

            const points = path.points
              .filter(p => p && typeof p.lat === 'number' && typeof p.lng === 'number')
              .map(p => {
                const safePoint = safeMapPoint(p);
                const lngLat = new T.LngLat(safePoint.lng, safePoint.lat);
                allLngLats.push(lngLat);
                return lngLat;
              });

            if (points.length > 1) {
              const polyline = new T.Polyline(points, {
                color: path.color || '#FF6B6B',
                weight: path.weight || 3,
                opacity: path.opacity || 0.8,
              });
              map.addOverLay(polyline);
            }
          } catch (err) {
            console.warn('添加路径失败:', err);
          }
        });

        // 如果有覆盖物，自动调整视野
        try {
          if (allLngLats.length > 0) {
            map.setViewport(allLngLats);
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
    };

    loadTdtScript()
      .then((T) => {
        if (!cancelled) initMap(T);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('天地图加载失败:', err);
        setError(err instanceof Error ? err.message : '天地图加载失败');
        setLoading(false);
      });

    return () => {
      cancelled = true;
      try {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.clearOverLays();
          if (typeof mapInstanceRef.current.destroy === 'function') {
            mapInstanceRef.current.destroy();
          }
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
        if (typeof map.checkResize === 'function') {
          map.checkResize();
        }
        if ((paths && paths.length > 0) || (markers && markers.length > 0)) {
          const overlays = map.getOverLays ? map.getOverLays() : [];
          if (overlays.length > 0) {
            map.setViewport(overlays.reduce((acc: any[], o: any) => {
              if (o.getLngLats) {
                return acc.concat(o.getLngLats());
              }
              if (o.getLngLat) {
                acc.push(o.getLngLat());
              }
              return acc;
            }, []));
          }
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
        <Alert severity="error">{'天地图加载失败：' + error}</Alert>
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
        className="tdt-container"
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

export default TiandituMap;
