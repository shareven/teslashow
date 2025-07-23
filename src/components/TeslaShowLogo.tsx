import React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';

const TeslaShowLogo: React.FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      {/* 车身 - 中心主体 */}
      <rect x="5" y="7" width="14" height="4" rx="2" fill="white" />
      
      {/* 车轮 - 更大的设计 */}
      <circle cx="8" cy="13" r="2" fill="none" stroke="white" strokeWidth="1.5" />
      <circle cx="16" cy="13" r="2" fill="none" stroke="white" strokeWidth="1.5" />
      <circle cx="8" cy="13" r="0.8" fill="white" />
      <circle cx="16" cy="13" r="0.8" fill="white" />
      
      {/* 数据流线 - 更粗更明显 */}
      <path
        d="M2 18C4 17 6 18 8 17.5C10 17 12 18 14 17.5C16 17 18 18 20 17.5C22 17 22 17 22 17"
        stroke="white"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      
      {/* 数据点 - 更大 */}
      <circle cx="6" cy="17.8" r="1" fill="white" />
      <circle cx="12" cy="17.2" r="1" fill="white" />
      <circle cx="18" cy="17.6" r="1" fill="white" />
      
      {/* 能量符号 - 更大更明显 */}
      <path
        d="M10 8.5L14 9.5L12 9.5L13.5 10.5L9.5 9.5L11.5 9.5Z"
        fill="white"
      />
      
      {/* 顶部装饰线条 */}
      <path
        d="M8 4C10 3.5 12 3.5 14 4C16 4.5 16 4.5 16 4.5"
        stroke="white"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </SvgIcon>
  );
};

export default TeslaShowLogo;