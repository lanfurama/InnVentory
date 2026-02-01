const moment = require('moment');
const log = require('../queries/logQuery');

const getLog = async (req, res) => {
  if (req.session.user && req.session.user.role === 'superadmin') {
    const logs = await log.getLog();
    res.render('log', {
      log: logs,
      user: req.session.user.email,
      title: req.t('log.title'),
      moment,
    });
  } else {
    res.status(401);
    res.render('401', { title: req.t('errors.401') });
  }
};

module.exports = getLog;
