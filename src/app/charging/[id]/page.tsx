'use client';

import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import ChargingDetail from '@/components/ChargingDetail';

interface ChargingDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

const ChargingDetailPage: React.FC<ChargingDetailPageProps> = ({ params }) => {
  const resolvedParams = React.use(params);
  const chargingId = parseInt(resolvedParams.id);

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Box sx={{ mb: 3 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            fontWeight: 700,
            color: 'text.primary',
            mb: 1,
          }}
        >
          充电详情 #{chargingId}
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary"
        >
          查看充电过程中的详细数据变化
        </Typography>
      </Box>
      
      <ChargingDetail chargingId={chargingId} />
    </Container>
  );
};

export default ChargingDetailPage;