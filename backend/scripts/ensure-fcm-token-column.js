const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { getPool } = require('../src/config/db');

async function main() {
  const pool = await getPool();
  await pool.request().query(`
    IF COL_LENGTH('dbo.Users', 'FcmToken') IS NULL
      ALTER TABLE dbo.Users ADD FcmToken NVARCHAR(512) NULL;
  `);
  console.log('FCM_TOKEN_COLUMN_OK');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
