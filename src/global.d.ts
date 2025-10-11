import type { Logger } from 'loglevel';

declare global {
    var log: Logger; // 全局 log 对象，可在任何地方直接使用
}
