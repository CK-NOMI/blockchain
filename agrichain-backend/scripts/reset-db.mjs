import { sequelize } from '../src/models/index.js';

async function resetDB() {
  console.log('Dropping all tables...');
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  await sequelize.query('DROP TABLE IF EXISTS batch_index, farm_detail, process_detail, sys_user, audit_records');
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  console.log('Tables dropped. Recreating via sync...');
  await sequelize.sync({ alter: true });
  console.log('Database reset complete.');
  process.exit(0);
}

resetDB().catch(err => {
  console.error('Reset failed:', err);
  process.exit(1);
});
