# 环境配置说明

## 数据库主机配置

本项目根据不同环境自动选择数据库主机：

### 开发环境 (Development)
- **DB_HOST**: `192.168.2.9`
- **配置文件**: `.env.local`
- **NODE_ENV**: `development`

### 生产环境 (Production)
- **DB_HOST**: `localhost`
- **配置文件**: `.env.production` 或 Docker环境变量
- **NODE_ENV**: `production`

## 配置文件说明

### 开发环境配置
使用 `.env.local` 文件，已配置为使用远程数据库服务器 `192.168.2.9`。

### 生产环境配置

#### 方式1: 传统部署
1. 复制 `.env.production.example` 为 `.env.production`
2. 修改其中的配置值

#### 方式2: Docker部署 (推荐)
1. 复制 `.env.docker.example` 为 `.env`
2. 修改其中的配置值，特别是：
   - `DB_PASSWORD`: 数据库密码
   - `AMAP_API_KEY`: 高德地图API密钥
   - `AMAP_SECURITY_KEY`: 高德地图安全密钥
   - `USER`: 登录用户名
   - `PASSWORD`: 登录密码

## 自动环境检测

代码会自动根据 `NODE_ENV` 环境变量选择合适的数据库主机：

```typescript
const getDbHost = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.DB_HOST || 'localhost';
  }
  // 开发环境默认使用192.168.2.9
  return process.env.DB_HOST || '192.168.2.9';
};
```

## 部署说明

### 开发环境启动
```bash
npm run dev
```

### 生产环境构建和启动

#### 传统方式
```bash
npm run build
npm start
```

#### Docker方式 (推荐)

1. **配置环境变量**
   ```bash
   cp .env.docker.example .env
   # 编辑 .env 文件，填入实际的配置值
   ```

2. **使用部署脚本**
   ```bash
   ./deploy-docker.sh
   ```

3. **手动部署**
   ```bash
   # 构建镜像
   docker build -t teslashow:latest .
   
   # 启动容器
   docker-compose up -d
   
   # 查看日志
   docker-compose logs -f
   
   # 停止容器
   docker-compose down
   ```

### Docker环境变量说明

在 `docker-compose.yml` 中，环境变量通过以下方式配置：

- **直接设置**: 如 `NODE_ENV=production`
- **从.env文件读取**: 如 `DB_PASSWORD=${DB_PASSWORD}`
- **带默认值**: 如 `NEXTAUTH_URL=${NEXTAUTH_URL:-http://localhost:3000}`

### 生产环境注意事项

1. **安全性**: 确保 `.env` 文件不被提交到版本控制系统
2. **数据库连接**: 确保数据库服务可访问
3. **端口配置**: 默认使用3000端口，可在docker-compose.yml中修改
4. **SSL证书**: 生产环境建议配置HTTPS

确保在生产环境中设置了正确的环境变量或创建了相应的配置文件。