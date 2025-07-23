# Tesla Show Logo 设计说明

## 设计理念

Tesla Show 的 logo 设计融合了以下元素：

### 🚗 Tesla 元素
- **T字母轮廓**：代表Tesla品牌的标志性T字母设计
- **车身造型**：简化的电动汽车轮廓，体现Tesla的核心产品
- **车轮设计**：圆形车轮，象征运动和行程
- **电动标识**：闪电符号，突出电动车的特性

### 📊 数据可视化元素
- **图表线条**：波浪形的数据线，代表行程轨迹和数据分析
- **数据点**：圆形节点，象征数据采集点和关键信息
- **装饰图表**：小型柱状图元素，强化数据可视化概念

### 🎨 设计特点
- **现代简约**：采用简洁的线条和几何形状
- **层次分明**：使用不同的透明度营造层次感
- **色彩统一**：主要使用白色和主题蓝色，保持品牌一致性
- **可扩展性**：SVG格式确保在各种尺寸下都清晰显示

## 文件说明

### Logo 组件
- `src/components/TeslaShowLogo.tsx` - React SVG 组件，用于应用内显示

### Favicon 文件
- `public/favicon.svg` - 主要的 favicon 文件 (32x32)
- `public/favicon-16x16.svg` - 小尺寸 favicon (16x16)
- `public/icon-192x192.svg` - PWA 应用图标 (192x192)
- `public/apple-touch-icon.svg` - Apple Touch 图标 (180x180)

## 使用方式

### 在组件中使用
```tsx
import TeslaShowLogo from '@/components/TeslaShowLogo';

// 基本使用
<TeslaShowLogo />

// 自定义大小和颜色
<TeslaShowLogo sx={{ fontSize: 40, color: 'primary.main' }} />
```

### 在 Material-UI Avatar 中使用
```tsx
<Avatar sx={{ bgcolor: 'primary.main' }}>
  <TeslaShowLogo />
</Avatar>
```

## 设计规范

### 颜色
- **主色调**：#1976d2 (Material-UI primary blue)
- **辅助色**：#0d47a1 (深蓝色边框)
- **文字色**：白色 (在深色背景上)

### 尺寸
- **最小尺寸**：16x16px
- **推荐尺寸**：32x32px, 40x40px
- **大尺寸**：192x192px (PWA)

### 间距
- Logo 周围建议保留至少 8px 的空白区域
- 在 Avatar 中使用时，容器大小建议为 36-40px

## 技术特性

- **格式**：SVG (矢量图形)
- **兼容性**：支持所有现代浏览器
- **响应式**：自动适应容器大小
- **主题适配**：支持 Material-UI 主题色彩
- **无障碍**：包含适当的 aria 标签

## 更新历史

- **v1.0** (2024): 初始设计，替换 ElectricCar 图标
  - 创建自定义 Tesla Show logo
  - 添加完整的 favicon 支持
  - 集成到应用布局中