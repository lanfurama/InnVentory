const express = require('express');
require('express-async-errors');
const methodOverride = require('method-override');
const cookieSession = require('cookie-session');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const path = require('path');
const morgan = require('morgan');

const i18n = require('./config/i18n');
const i18nMiddleware = require('i18next-http-middleware');
const log = require('./queries/logQuery');

const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const usersRoutes = require('./routes/usersRoutes');
const accountRoutes = require('./routes/accountRoutes');
const assetRoutes = require('./routes/assetRoutes');
const assetCategoryRoutes = require('./routes/assetCategoryRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const assetTransferRoutes = require('./routes/assetTransferRoutes');
const assetMaintenanceRoutes = require('./routes/assetMaintenanceRoutes');
const depreciationRoutes = require('./routes/depreciationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const logRoutes = require('./routes/logRoutes');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(cookieParser());
app.use(i18nMiddleware.handle(i18n));
app.use((req, res, next) => {
  res.locals.t = req.t;
  res.locals.lang = req.language || 'en';
  next();
});
const sessionKeys = process.env.SESSION_KEYS
  ? process.env.SESSION_KEYS.split(',').map((k) => k.trim()).filter(Boolean)
  : [crypto.randomBytes(16).toString('hex')];
app.use(
  cookieSession({
    name: 'session',
    keys: sessionKeys.length ? sessionKeys : [crypto.randomBytes(16).toString('hex')],
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  }),
);

// Expose user/us and path to all views (for nav and error pages using main layout)
app.use((req, res, next) => {
  if (req.session && req.session.user) {
    if (req.session.user.role === 'superadmin') res.locals.user = req.session.user.email;
    else res.locals.us = req.session.user.email;
  }
  res.locals.path = req.path;
  next();
});

// Full origin for asset URLs so CSS/JS always load correctly on redirect (no relative resolution)
const APP_VERSION = Date.now();
app.use((req, res, next) => {
  res.locals.baseUrl = `${req.protocol}://${req.get('host')}`;
  res.locals.v = APP_VERSION;
  next();
});

// Prevent caching of HTML pages (avoids stale/bfcache causing "lost CSS" on navigation)
const staticPrefixes = ['/css', '/js', '/uploads', '/images', '/plugins', '/dist', '/node_modules'];
app.use((req, res, next) => {
  const isStatic = staticPrefixes.some((p) => req.path === p || req.path.startsWith(p + '/'));
  if (!isStatic) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
  next();
});

// Static files
app.use('/css', express.static(path.join(__dirname, '../public/css')));
app.use('/js', express.static(path.join(__dirname, '../public/js')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use('/images', express.static(path.join(__dirname, '../public/images')));
app.use('/plugins', express.static(path.join(__dirname, '../node_modules/admin-lte/plugins')));
app.use('/dist', express.static(path.join(__dirname, '../node_modules/admin-lte/dist')));
app.use('/node_modules', express.static(path.join(__dirname, '../node_modules')));

// Custom logger
const custom = (tokens, req, res) => {
  if (req.session && req.session.user) {
    const user = req.session.user.email;
    const method = tokens.method(req, res);
    const endpoint = tokens.url(req, res);
    const statusCode = tokens.status(req, res);

    log.addLog(user, method, endpoint, statusCode);
  }
  return [
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens.res(req, res, 'content-length'),
    '-',
    tokens['response-time'](req, res),
    'ms',
  ].join(' ');
};

app.use(morgan(custom));

app.use(authRoutes);
app.use(dashboardRoutes);
app.use(usersRoutes);
app.use(accountRoutes);
app.use(assetRoutes);
app.use(assetCategoryRoutes);
app.use(departmentRoutes);
app.use(assetTransferRoutes);
app.use(assetMaintenanceRoutes);
app.use(depreciationRoutes);
app.use(reportRoutes);
app.use(logRoutes);

app.get('/lang/:lng', (req, res) => {
  const { lng } = req.params;
  if (['en', 'vi'].includes(lng)) {
    res.cookie('lang', lng, { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: true });
  }
  res.redirect('back');
});

app.get('*', (req, res) => {
  res.status(404).render('404', { title: req.t ? req.t('errors.404') : '404 Error' });
});

// Error handler: catches errors passed to next(err) and async rejections (express-async-errors)
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || err.statusCode || 500;
  res.status(status);
  const title = req.t ? req.t('errors.500') : 'Error 500 - Server Error';
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    res.json({ error: title, message: err.message });
    return;
  }
  res.render('500', { title, message: err.message });
});

module.exports = app;
