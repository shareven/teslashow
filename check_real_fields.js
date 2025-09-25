const { Pool } = require('pg');

// 从环境变量读取数据库配置
const pool = new Pool({
  host: '192.168.2.9',
  port: 5433,
  database: 'teslamate',
  user: 'teslamate',
  password: 'xrw920406',
  ssl: false,
});

async function checkFields() {
  try {
    console.log('正在连接数据库...');
    
    // 查询 charging_processes 表的字段
    console.log('\n=== charging_processes 表字段 ===');
    const chargingProcessesFields = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'charging_processes' 
      ORDER BY ordinal_position;
    `);
    
    chargingProcessesFields.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type}`);
    });
    
    // 查询 charges 表的字段
    console.log('\n=== charges 表字段 ===');
    const chargesFields = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'charges' 
      ORDER BY ordinal_position;
    `);
    
    chargesFields.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type}`);
    });
    
    // 查找温度相关字段
    console.log('\n=== 温度相关字段 ===');
    const tempFields = await pool.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name IN ('charging_processes', 'charges') 
      AND column_name LIKE '%temp%'
      ORDER BY table_name, column_name;
    `);
    
    if (tempFields.rows.length > 0) {
      tempFields.rows.forEach(row => {
        console.log(`${row.table_name}.${row.column_name}: ${row.data_type}`);
      });
    } else {
      console.log('未找到温度相关字段');
    }
    
    // 查找里程相关字段
    console.log('\n=== 里程相关字段 ===');
    const rangeFields = await pool.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name IN ('charging_processes', 'charges') 
      AND (column_name LIKE '%range%' OR column_name LIKE '%km%')
      ORDER BY table_name, column_name;
    `);
    
    if (rangeFields.rows.length > 0) {
      rangeFields.rows.forEach(row => {
        console.log(`${row.table_name}.${row.column_name}: ${row.data_type}`);
      });
    } else {
      console.log('未找到里程相关字段');
    }
    
    // 查询一条 charging_processes 记录看实际数据
    console.log('\n=== charging_processes 表样本数据 ===');
    const sampleData = await pool.query(`
      SELECT * FROM charging_processes 
      WHERE id = 295 
      LIMIT 1;
    `);
    
    if (sampleData.rows.length > 0) {
      console.log('字段名和值:');
      Object.keys(sampleData.rows[0]).forEach(key => {
        console.log(`${key}: ${sampleData.rows[0][key]}`);
      });
    }
    
  } catch (error) {
    console.error('查询失败:', error.message);
  } finally {
    await pool.end();
  }
}

checkFields();