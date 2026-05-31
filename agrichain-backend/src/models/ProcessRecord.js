import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ProcessRecord = sequelize.define('ProcessRecord', {
  batchId: { type: DataTypes.STRING(64), allowNull: false, field: 'batch_id' },
  processType: { type: DataTypes.STRING(50), defaultValue: '', field: 'process_type' },
  description: { type: DataTypes.TEXT },
  reportHash: { type: DataTypes.STRING(66), defaultValue: '', field: 'report_hash' },
  operator: { type: DataTypes.STRING(42), defaultValue: '' },
  transactionHash: { type: DataTypes.STRING(66), defaultValue: '', field: 'tx_hash' },
}, {
  tableName: 'process_detail',
  timestamps: true,
  underscored: true,
});

export default ProcessRecord;
