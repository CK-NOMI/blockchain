import sequelize from '../config/database.js';
import User from './User.js';
import BatchIndex from './BatchIndex.js';
import FarmDetail from './FarmDetail.js';
import ProcessRecord from './ProcessRecord.js';
import LogisticsDetail from './LogisticsDetail.js';
import RetailDetail from './RetailDetail.js';

export { sequelize, User, BatchIndex, FarmDetail, ProcessRecord, LogisticsDetail, RetailDetail };
