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
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { 
  Timeline,
  Place,
  BatteryChargingFull,
  AccountCircle,
  Logout,
  Menu as MenuIcon,
  Palette,
} from '@mui/icons-material';
import TeslaShowLogo from './TeslaShowLogo';
import { useRouter, usePathname } from 'next/navigation';
import ThemeColorSelector from './ThemeColorSelector';
import AuthGuard from './AuthGuard';
import { useAuth } from '@/lib/AuthProvider';
import { useThemeColor } from '@/lib/ThemeColorProvider';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const { logout } = useAuth();
  const { currentTheme, setThemeColor, availableColors } = useThemeColor();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [themeMenuAnchor, setThemeMenuAnchor] = React.useState<null | HTMLElement>(null);
  const prevPathRef = React.useRef<string>(pathname);
  const isPopRef = React.useRef<boolean>(false);

  // 如果是登录页面，直接返回子组件，不显示导航栏
  if (pathname === '/login') {
    return (
      <>
        <CssBaseline />
        {children}
      </>
    );
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    router.push(newValue);
  };

  const getCurrentTab = () => {
    if (pathname.startsWith('/footprint')) return '/footprint';
    if (pathname.startsWith('/charging')) return '/charging';
    return '/';
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleUserMenuClose();
    router.push('/login');
  };

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  const handleMobileLogout = () => {
    logout();
    handleMobileMenuClose();
    router.push('/login');
  };

  const handleThemeMenuClose = () => {
    setThemeMenuAnchor(null);
  };

  const handleColorSelect = (colorId: string) => {
    setThemeColor(colorId);
    handleThemeMenuClose();
    handleMobileMenuClose();
  };

  const navigationItems = [
    { label: '行程', value: '/', icon: <Timeline /> },
    { label: '足迹', value: '/footprint', icon: <Place /> },
    { label: '充电', value: '/charging', icon: <BatteryChargingFull /> },
  ];

  React.useEffect(() => {
    const prev = prevPathRef.current;
    if (prev === pathname) return;
    if (typeof window !== 'undefined') {
      const isDrivesList = pathname === '/';
      const isChargingList = pathname === '/charging';
      if (isDrivesList && prev && prev.startsWith('/drives/') && isPopRef.current) {
        try {
          sessionStorage.setItem('restore:/', '1');
        } catch {}
      } else if (isChargingList && prev && prev.startsWith('/charging/') && isPopRef.current) {
        try {
          sessionStorage.setItem('restore:/charging', '1');
        } catch {}
      } else {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
      try {
        sessionStorage.setItem('last_path', prev || '');
      } catch {}
    }
    isPopRef.current = false;
    prevPathRef.current = pathname;
  }, [pathname]);

  React.useEffect(() => {
    const handler = () => {
      isPopRef.current = true;
    };
    window.addEventListener('popstate', handler);
    return () => {
      window.removeEventListener('popstate', handler);
    };
  }, []);

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
              
              {isMobile ? (
                // 移动端：菜单按钮
                <IconButton
                  onClick={handleMobileMenuOpen}
                  sx={{
                    color: 'text.secondary',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <MenuIcon />
                </IconButton>
              ) : (
                // 桌面端：主题选择器和用户菜单
                <>
                  <ThemeColorSelector />
                  <IconButton
                    onClick={handleUserMenuOpen}
                    sx={{
                      color: 'text.secondary',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <AccountCircle />
                  </IconButton>
                </>
              )}
            </Box>
          </Toolbar>
        </AppBar>
        
        {/* 桌面端用户菜单 */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleUserMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <Logout fontSize="small" />
            </ListItemIcon>
            <ListItemText>退出登录</ListItemText>
          </MenuItem>
        </Menu>

        {/* 移动端菜单 */}
        <Menu
          anchorEl={mobileMenuAnchor}
          open={Boolean(mobileMenuAnchor)}
          onClose={handleMobileMenuClose}
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
              minWidth: 180,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              border: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          <MenuItem 
            onClick={(e) => {
              e.stopPropagation();
              setThemeMenuAnchor(e.currentTarget);
            }}
          >
            <ListItemIcon>
              <Palette fontSize="small" />
            </ListItemIcon>
            <ListItemText>主题色</ListItemText>
          </MenuItem>
          
          <MenuItem onClick={handleMobileLogout}>
            <ListItemIcon>
              <Logout fontSize="small" />
            </ListItemIcon>
            <ListItemText>退出登录</ListItemText>
          </MenuItem>
        </Menu>

        {/* 主题颜色选择菜单 */}
        <Menu
          anchorEl={themeMenuAnchor}
          open={Boolean(themeMenuAnchor)}
          onClose={handleThemeMenuClose}
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
              minWidth: 200,
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
                fontSize: '0.75rem',
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
                    fontSize: '0.875rem',
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
        
        {/* 主内容区域 */}
        <Box 
          component="main"
          sx={{ 
            flexGrow: 1,
            py: { xs: 2, sm: 3 },
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          <AuthGuard>
            {children}
          </AuthGuard>
        </Box>
      </Box>
    </>
  );
};

export default Layout;
