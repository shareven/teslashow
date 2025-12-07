'use client';

import React, { useState } from 'react';
import { IconButton, Button, Menu, MenuItem, Box, Typography, Tooltip, useTheme, useMediaQuery } from '@mui/material';
import { DirectionsCar } from '@mui/icons-material';
import { useVehicle } from '@/lib/VehicleProvider';
import { useThemeColor } from '@/lib/ThemeColorProvider';

const VehicleSelector: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { cars, selectedCarId, setSelectedCarId } = useVehicle();
  const { currentTheme } = useThemeColor();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const currentLabel = selectedCarId === null
    ? '所有车辆'
    : (cars.find(c => c.id === selectedCarId)?.name || cars.find(c => c.id === selectedCarId)?.model || `#${selectedCarId}`);

  return (
    <>
      {isMobile ? (
        <Button
          onClick={handleClick}
          startIcon={<DirectionsCar />}
          sx={{
            color: 'text.secondary',
            '&:hover': { bgcolor: 'action.hover', color: 'primary.main' },
            borderRadius: 2,
            px: 1.5,
            py: 0.5,
            minHeight: 36,
          }}
        >
          {currentLabel}
        </Button>
      ) : (
        <Tooltip title="切换车辆" arrow>
          <IconButton
            onClick={handleClick}
            sx={{
              color: 'text.secondary',
              '&:hover': { bgcolor: 'action.hover', color: 'primary.main' },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            <DirectionsCar />
          </IconButton>
        </Tooltip>
      )}

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: 2,
            minWidth: isMobile ? 220 : 240,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            border: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            选择车辆
          </Typography>
        </Box>

        <MenuItem
          onClick={() => { setSelectedCarId(null); handleClose(); }}
          sx={{
            px: 2,
            py: 1.5,
            mx: 1,
            mb: 0.5,
            borderRadius: 1.5,
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <Box display="flex" alignItems="center" gap={2} width="100%">
            <DirectionsCar sx={{ color: selectedCarId === null ? currentTheme.primary : 'text.secondary' }} />
            <Typography
              variant="body2"
              sx={{
                fontWeight: selectedCarId === null ? 600 : 400,
                color: selectedCarId === null ? currentTheme.primary : 'text.primary',
                fontSize: { xs: '0.875rem', sm: '1rem' },
              }}
            >
              所有车辆
            </Typography>
            {selectedCarId === null && (
              <Box sx={{ ml: 'auto', width: 6, height: 6, borderRadius: '50%', bgcolor: currentTheme.primary }} />
            )}
          </Box>
        </MenuItem>

        {cars.map(c => {
          const isSelected = selectedCarId === c.id;
          const label = c.name || c.model || `#${c.id}`;
          return (
            <MenuItem
              key={c.id}
              onClick={() => { setSelectedCarId(c.id); handleClose(); }}
              sx={{
                px: 2,
                py: 1.5,
                mx: 1,
                mb: 0.5,
                borderRadius: 1.5,
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Box display="flex" alignItems="center" gap={2} width="100%">
                <DirectionsCar sx={{ color: isSelected ? currentTheme.primary : 'text.secondary' }} />
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: isSelected ? 600 : 400,
                    color: isSelected ? currentTheme.primary : 'text.primary',
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                  }}
                >
                  {label}
                </Typography>
                {isSelected && (
                  <Box sx={{ ml: 'auto', width: 6, height: 6, borderRadius: '50%', bgcolor: currentTheme.primary }} />
                )}
              </Box>
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
};

export default VehicleSelector;