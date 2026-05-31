import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const BatchIndex = sequelize.define('BatchIndex', {
  batchId: { type: DataTypes.STRING(64), allowNull: false, unique: true, field: 'batch_id' },
  chainBatchId: { type: DataTypes.STRING(66), defaultValue: '', field: 'chain_batch_id' },
  nonce: { type: DataTypes.BIGINT, defaultValue: 0 },
  productName: { type: DataTypes.STRING(100), defaultValue: '', field: 'product_name' },
  variety: { type: DataTypes.STRING(100), defaultValue: '' },
  origin: { type: DataTypes.STRING(200), defaultValue: '' },
  category: { type: DataTypes.STRING(50), defaultValue: '' },
  quantity: { type: DataTypes.INTEGER, defaultValue: 0 },
  fileHash: { type: DataTypes.STRING(66), defaultValue: '', field: 'file_hash' },
  reportFile: { type: DataTypes.STRING(255), defaultValue: '', field: 'report_file' },
  currentState: { type: DataTypes.INTEGER, defaultValue: 0, field: 'current_state' },
  createdBy: { type: DataTypes.STRING(42), defaultValue: '', field: 'created_by' },
  transactionHash: { type: DataTypes.STRING(66), defaultValue: '', field: 'tx_hash' },
  blockNumber: { type: DataTypes.INTEGER, field: 'block_number' },
  chainPending: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'chain_pending' },
}, {
  tableName: 'batch_index',
  timestamps: true,
  underscored: true,
});

export default BatchIndex;
