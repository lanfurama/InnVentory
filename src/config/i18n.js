const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const i18nextMiddleware = require('i18next-http-middleware');
const path = require('path');

const localesPath = path.join(__dirname, '../locales');

const ready = i18next
  .use(Backend)
  .use(i18nextMiddleware.LanguageDetector)
  .init({
    backend: {
      loadPath: path.join(localesPath, '{{lng}}.json'),
    },
    fallbackLng: 'en',
    preload: ['en', 'vi'],
    supportedLngs: ['en', 'vi'],
    detection: {
      order: ['cookie', 'querystring', 'header'],
      caches: ['cookie'],
      lookupCookie: 'lang',
      lookupQuerystring: 'lang',
    },
  });

i18next.ready = ready;
module.exports = i18next;
