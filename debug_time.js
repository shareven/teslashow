const { Pool } = require('pg');

const pool = new Pool({
  user: 'teslamate',
  host: '192.168.2.9',
  database: 'teslamate',
  password: 'teslamate',
  port: 5432,
});

async function checkTimeData() {
  try {
    const result = await pool.query(`
      SELECT date, battery_level 
      FROM charges 
      WHERE charging_process_id = 1 
      ORDER BY date ASC 
      LIMIT 3
    `);
    
    console.log('前3条数据的时间:');
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. 原始时间: ${row.date}`);
      console.log(`   类型: ${typeof row.date}`);
      console.log(`   电池电量: ${row.battery_level}%`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    await pool.end();
  }
}

checkTimeData();