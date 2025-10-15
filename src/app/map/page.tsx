import { Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import MapPage from '@/components/MapPage';

export default function Map() {
  return (
    <Suspense 
      fallback={
        <Box 
          sx={{ 
            height: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}
        >
          <CircularProgress />
        </Box>
      }
    >
      <MapPage />
    </Suspense>
  );
}

export const metadata = {
  title: '地图位置 - Tesla Show',
  description: '查看充电位置地图',
};