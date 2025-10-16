'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthProvider';
import { CircularProgress, Box } from '@mui/material';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 如果不在登录页面且未认证，跳转到登录页面
    if (!loading && !isAuthenticated && pathname !== '/login') {
      router.push('/login');
    }
  }, [isAuthenticated, loading, pathname, router]);

  // 如果正在加载认证状态，显示加载指示器
  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // 如果在登录页面，直接显示内容
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // 如果已认证，显示内容
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // 如果未认证且不在登录页面，显示空内容（即将跳转）
  return null;
}