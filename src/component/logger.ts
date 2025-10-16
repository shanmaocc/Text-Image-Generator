import log from 'loglevel';
import { APP_CONSTANTS } from './config/constants';

// 根据环境变量设置日志级别
const logLevel = APP_CONSTANTS.LOG_LEVEL as log.LogLevelDesc;
log.setLevel(logLevel);

export default log;
