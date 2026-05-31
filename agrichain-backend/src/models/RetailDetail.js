import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const RetailDetail = sequelize.define('RetailDetail', {
  batchId: { type: DataTypes.STRING(64), allowNull: false, field: 'batch_id' },
  storeLocation: { type: DataTypes.STRING(200), defaultValue: '', field: 'store_location' },
  saleStatus: { type: DataTypes.STRING(50), defaultValue: '', field: 'sale_status' },
  fileHash: { type: DataTypes.STRING(66), defaultValue: '', field: 'file_hash' },
  operator: { type: DataTypes.STRING(42), defaultValue: '' },
  transactionHash: { type: DataTypes.STRING(66), defaultValue: '', field: 'tx_hash' },
}, {
  tableName: 'retail_detail',
  timestamps: true,
  underscored: true,
});

export default RetailDetail;
