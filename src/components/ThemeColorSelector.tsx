'use client';

import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  Box,
  Typography,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Palette } from '@mui/icons-material';
import { useThemeColor } from '@/lib/ThemeColorProvider';

const ThemeColorSelector: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { currentTheme, setThemeColor, availableColors } = useThemeColor();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleColorSelect = (colorId: string) => {
    setThemeColor(colorId);
    handleClose();
  };

  return (
    <>
      <Tooltip title="切换主题色" arrow>
        <IconButton
          onClick={handleClick}
          sx={{
            color: 'text.secondary',
            '&:hover': {
              bgcolor: 'action.hover',
              color: 'primary.main',
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          <Palette />
        </IconButton>
      </Tooltip>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: 2,
            minWidth: isMobile ? 200 : 240,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            border: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography 
            variant="subtitle2" 
            color="text.secondary"
            sx={{ 
              fontWeight: 600,
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
            }}
          >
            选择主题色
          </Typography>
        </Box>
        
        {availableColors.map((color) => (
          <MenuItem
            key={color.id}
            onClick={() => handleColorSelect(color.id)}
            sx={{
              px: 2,
              py: 1.5,
              mx: 1,
              mb: 0.5,
              borderRadius: 1.5,
              '&:hover': {
                bgcolor: 'action.hover',
              },
              '&:last-child': {
                mb: 1,
              },
            }}
          >
            <Box display="flex" alignItems="center" gap={2} width="100%">
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  bgcolor: color.primary,
                  border: currentTheme.id === color.id ? '2px solid' : '1px solid',
                  borderColor: currentTheme.id === color.id ? color.primary : 'divider',
                  transform: currentTheme.id === color.id ? 'scale(1.1)' : 'scale(1)',
                  transition: 'all 0.2s ease-in-out',
                }}
              />
              
              <Typography 
                variant="body2"
                sx={{ 
                  fontWeight: currentTheme.id === color.id ? 600 : 400,
                  color: currentTheme.id === color.id ? color.primary : 'text.primary',
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                }}
              >
                {color.name}
              </Typography>
              
              {currentTheme.id === color.id && (
                <Box
                  sx={{
                    ml: 'auto',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: color.primary,
                  }}
                />
              )}
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default ThemeColorSelector;