const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { getPool } = require('../src/config/db');

async function main() {
  const pool = await getPool();

  await pool.request().query(`
    IF COL_LENGTH('dbo.Users', 'ProfileImageUrl') IS NULL
      ALTER TABLE dbo.Users ADD ProfileImageUrl NVARCHAR(500) NULL;
  `);

  console.log('PROFILE_IMAGE_COLUMN_OK');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
