import { Pool } from 'pg';

// 根据环境选择数据库主机
const getDbHost = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.DB_HOST || 'datebase';
  }
  // 开发环境默认使用192.168.2.9
  return process.env.DB_HOST || '192.168.2.9';
};

// 数据库配置
const dbConfig = {
  host: getDbHost(),
  port: parseInt(process.env.DB_PORT ?? '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// 打印数据库连接配置（隐藏密码）
console.log('🔗 数据库连接配置:');
console.log(`  主机: ${dbConfig.host}`);
console.log(`  端口: ${dbConfig.port}`);
console.log(`  数据库: ${dbConfig.database}`);
console.log(`  用户: ${dbConfig.user}`);
console.log(`  密码: ${dbConfig.password ? '***已设置***' : '未设置'}`);
console.log(`  环境: ${process.env.NODE_ENV || 'development'}`);

const pool = new Pool(dbConfig);

// 监听连接事件
pool.on('connect', async (client) => {
  try {
    // 设置会话时区为UTC，确保与TeslaMate一致
    await client.query("SET timezone = 'UTC'");
    console.log('✅ 数据库连接成功建立，时区已设置为UTC');
  } catch (error) {
    console.error('❌ 设置数据库时区失败:', error);
  }
});

pool.on('error', (err, client) => {
  console.error('❌ 数据库连接池错误:', err);
});

export default pool;