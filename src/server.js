require('dotenv').config();

const host = process.env.HOSTNAME;
const port = process.env.PORT;
const i18n = require('./config/i18n');

i18n.ready.then(() => {
  const app = require('./app');
  app.listen(port, () => {
    console.log(`Listening to the server on http://${host}:${port}`);
  });
}).catch((err) => {
  console.error('i18n init failed:', err);
  process.exit(1);
});
