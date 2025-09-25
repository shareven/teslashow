const { Pool } = require('pg');

const pool = new Pool({
  host: '192.168.2.9',
  port: 5433,
  database: 'teslamate',
  user: 'teslamate',
  password: process.env.DB_PASSWORD || 'teslamate',
  ssl: false,
});

async function checkSchema() {
  try {
    console.log('查询 charges 表结构...');
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'charges' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\ncharges 表字段:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    console.log('\n查询 charging_processes 表结构...');
    const result2 = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'charging_processes' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\ncharging_processes 表字段:');
    result2.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // 查询一条实际数据看看有哪些字段有值
    console.log('\n查询 charges 表实际数据样本...');
    const sampleResult = await pool.query(`
      SELECT * FROM charges 
      WHERE charging_process_id = 295 
      LIMIT 1;
    `);
    
    if (sampleResult.rows.length > 0) {
      console.log('\n实际数据字段:');
      Object.keys(sampleResult.rows[0]).forEach(key => {
        const value = sampleResult.rows[0][key];
        console.log(`- ${key}: ${value} (${typeof value})`);
      });
    }

  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    await pool.end();
  }
}

checkSchema();