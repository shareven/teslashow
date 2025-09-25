'use client';

import React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Tabs, 
  Tab, 
  Box,
  IconButton,
  Avatar,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { 
  Timeline,
  Place,
  BatteryChargingFull,
} from '@mui/icons-material';
import TeslaShowLogo from './TeslaShowLogo';
import { useRouter, usePathname } from 'next/navigation';
import ThemeColorSelector from './ThemeColorSelector';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    router.push(newValue);
  };

  const getCurrentTab = () => {
    if (pathname.startsWith('/footprint')) return '/footprint';
    if (pathname.startsWith('/charging')) return '/charging';
    return '/';
  };

  const navigationItems = [
    { label: '行程', value: '/', icon: <Timeline /> },
    { label: '足迹', value: '/footprint', icon: <Place /> },
    { label: '充电', value: '/charging', icon: <BatteryChargingFull /> },
  ];

  return (
    <>
      <CssBaseline />
      <Box sx={{ 
        flexGrow: 1, 
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}>
        {/* 顶部导航栏 */}
        <AppBar 
          position="sticky" 
          elevation={0}
          sx={{
            bgcolor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
            color: 'text.primary',
          }}
        >
          <Toolbar 
            sx={{ 
              px: { xs: 2, sm: 3 },
              minHeight: { xs: 64, sm: 72 },
            }}
          >
            {/* Logo和标题 */}
            <Box display="flex" alignItems="center" gap={2} sx={{ flexGrow: 1 }}>
              <Avatar 
                sx={{ 
                  bgcolor: 'primary.main',
                  width: { xs: 36, sm: 40 },
                  height: { xs: 36, sm: 40 },
                }}
              >
                <TeslaShowLogo />
              </Avatar>
              <Box>
                <Typography 
                  variant="h6" 
                  component="div" 
                  sx={{ 
                    fontWeight: 700,
                    fontSize: { xs: '1.1rem', sm: '1.25rem' },
                    color: 'text.primary',
                    lineHeight: 1.2,
                  }}
                >
                  Tesla Show
                </Typography>
                {!isMobile && (
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ fontSize: '0.75rem' }}
                  >
                    行程数据可视化
                  </Typography>
                )}
              </Box>
            </Box>
            
            {/* 导航标签和主题选择器 */}
            <Box display="flex" alignItems="center" gap={1}>
              {isMobile ? (
                // 移动端：图标导航
                <Box display="flex" gap={1}>
                  {navigationItems.map((item) => (
                    <IconButton
                      key={item.value}
                      onClick={() => router.push(item.value)}
                      sx={{
                        color: getCurrentTab() === item.value ? 'primary.main' : 'text.secondary',
                        bgcolor: getCurrentTab() === item.value ? 'primary.50' : 'transparent',
                        '&:hover': {
                          bgcolor: getCurrentTab() === item.value ? 'primary.100' : 'action.hover',
                        },
                      }}
                    >
                      {item.icon}
                    </IconButton>
                  ))}
                </Box>
              ) : (
                // 桌面端：标签导航
                <Tabs
                  value={getCurrentTab()}
                  onChange={handleTabChange}
                  sx={{
                    '& .MuiTab-root': {
                      color: 'text.secondary',
                      fontWeight: 500,
                      minHeight: 48,
                      '&.Mui-selected': {
                        color: 'primary.main',
                      },
                    },
                    '& .MuiTabs-indicator': {
                      backgroundColor: 'primary.main',
                      height: 3,
                      borderRadius: '3px 3px 0 0',
                    },
                  }}
                >
                  {navigationItems.map((item) => (
                    <Tab 
                      key={item.value}
                      label={item.label} 
                      value={item.value}
                      icon={item.icon}
                      iconPosition="start"
                      sx={{
                        '& .MuiTab-iconWrapper': {
                          marginRight: 1,
                          marginBottom: 0,
                        },
                      }}
                    />
                  ))}
                </Tabs>
              )}
              
              {/* 主题色选择器 */}
              <ThemeColorSelector />
            </Box>
          </Toolbar>
        </AppBar>
        
        {/* 主内容区域 */}
        <Box 
          component="main"
          sx={{ 
            flexGrow: 1,
            py: { xs: 2, sm: 3 },
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          {children}
        </Box>
      </Box>
    </>
  );
};

export default Layout;