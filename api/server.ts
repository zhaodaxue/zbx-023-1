import app from './app.js';
import { runMigrations, closeDb } from './db/index.js';

const PORT = process.env.PORT || 3001;

runMigrations();
console.log('数据库迁移完成');

const server = app.listen(PORT, () => {
  console.log(`布袋戏偶头修复服务已启动，端口: ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号');
  server.close(() => {
    closeDb();
    console.log('服务已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信号');
  server.close(() => {
    closeDb();
    console.log('服务已关闭');
    process.exit(0);
  });
});

export default app;
