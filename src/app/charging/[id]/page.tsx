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
    <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>

      
      <ChargingDetail chargingId={chargingId} />
    </Container>
  );
};

export default ChargingDetailPage;