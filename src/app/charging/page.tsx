'use client';

import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import ChargingPage from '../../components/ChargingPage';

const Charging: React.FC = () => {
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
          充电记录
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary"
        >
          查看和分析您的充电历史数据
        </Typography>
      </Box>
      
      <ChargingPage />
    </Container>
  );
};

export default Charging;