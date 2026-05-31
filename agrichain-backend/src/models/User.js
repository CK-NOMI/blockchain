import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const User = sequelize.define('User', {
  username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING(255), allowNull: false, field: 'password_hash' },
  role: { type: DataTypes.STRING(20), allowNull: false },
  organization: { type: DataTypes.STRING(100), defaultValue: '' },
  address: { type: DataTypes.STRING(42), defaultValue: '' },
  privateKey: { type: DataTypes.STRING(255), defaultValue: '', field: 'private_key' },
  chainInited: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'chain_inited' },
  status: { type: DataTypes.STRING(20), defaultValue: 'PENDING' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_active' },
  tokenVersion: { type: DataTypes.INTEGER, defaultValue: 1, field: 'token_version' },
  lastLoginAt: { type: DataTypes.DATE, field: 'last_login_at' },
}, {
  tableName: 'sys_user',
  timestamps: true,
  underscored: true,
});

export default User;
