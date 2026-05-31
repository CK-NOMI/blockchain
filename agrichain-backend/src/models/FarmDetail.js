import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const FarmDetail = sequelize.define('FarmDetail', {
  batchId: { type: DataTypes.STRING(64), allowNull: false, field: 'batch_id' },
  plantDate: { type: DataTypes.STRING(20), defaultValue: '', field: 'plant_date' },
  sowingDate: { type: DataTypes.STRING(20), defaultValue: '', field: 'sowing_date' },
  harvestDate: { type: DataTypes.STRING(20), defaultValue: '', field: 'harvest_date' },
  fertilizerRecord: { type: DataTypes.TEXT, field: 'fertilizer_record' },
  pesticideRecord: { type: DataTypes.TEXT, field: 'pesticide_record' },
  principalName: { type: DataTypes.STRING(50), defaultValue: '', field: 'principal_name' },
  fileHash: { type: DataTypes.STRING(66), defaultValue: '', field: 'file_hash' },
  operator: { type: DataTypes.STRING(42), defaultValue: '' },
  transactionHash: { type: DataTypes.STRING(66), defaultValue: '', field: 'tx_hash' },
}, {
  tableName: 'farm_detail',
  timestamps: true,
  underscored: true,
});

export default FarmDetail;
