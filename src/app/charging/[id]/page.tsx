'use client';

import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import { useParams } from 'next/navigation';
import ChargingDetail from '@/components/ChargingDetail';

const ChargingDetailPage: React.FC = () => {
  const params = useParams();
  const chargingId = parseInt(params.id as string);

  return (
    <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>

      
      <ChargingDetail chargingId={chargingId} />
    </Container>
  );
};

export default ChargingDetailPage;