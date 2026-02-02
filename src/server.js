require('dotenv').config();

const host = process.env.HOSTNAME;
const port = process.env.PORT;
const i18n = require('./config/i18n');

function setupGracefulShutdown(server) {
  const shutdown = (signal) => {
    console.log(`\n${signal} received. Đang đóng server...`);
    server.close(() => {
      console.log('Server đã đóng. Port được giải phóng.');
      process.exit(0);
    });
    // Buộc thoát nếu sau 5 giây vẫn chưa đóng
    setTimeout(() => {
      console.error('Buộc thoát do timeout.');
      process.exit(1);
    }, 5000);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));   // Ctrl+C
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

i18n.ready.then(() => {
  const app = require('./app');
  const server = app.listen(port, () => {
    console.log(`Listening to the server on http://${host}:${port}`);
  });
  setupGracefulShutdown(server);
}).catch((err) => {
  console.error('i18n init failed:', err);
  process.exit(1);
});
