const moment = require('moment');
const log = require('../queries/logQuery');

const getLog = async (req, res) => {
  const logs = await log.getLog();
  res.render('log', { log: logs, title: req.t('log.title'), moment });
};

module.exports = getLog;
