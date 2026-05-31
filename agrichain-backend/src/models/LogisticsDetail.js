import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const LogisticsDetail = sequelize.define('LogisticsDetail', {
  batchId: { type: DataTypes.STRING(64), allowNull: false, field: 'batch_id' },
  vehicleInfo: { type: DataTypes.STRING(100), defaultValue: '', field: 'vehicle_info' },
  routeInfo: { type: DataTypes.STRING(200), defaultValue: '', field: 'route_info' },
  tempHumidity: { type: DataTypes.TEXT, field: 'temp_humidity' },
  fileHash: { type: DataTypes.STRING(66), defaultValue: '', field: 'file_hash' },
  operator: { type: DataTypes.STRING(42), defaultValue: '' },
  transactionHash: { type: DataTypes.STRING(66), defaultValue: '', field: 'tx_hash' },
}, {
  tableName: 'logistics_detail',
  timestamps: true,
  underscored: true,
});

export default LogisticsDetail;
