const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const user = require('../queries/usersQuery');

const getAccount = async (req, res) => {
  if (req.session.user && req.session.user.role === 'superadmin') {
    const users = await user.checkProfile(req.session.user.email);
    res.render('account', {
      usr: users,
      user: req.session.user.email,
      title: req.t('account.title'),
    });
  } else if (req.session.user && req.session.user.role === 'user') {
    const users = await user.checkProfile(req.session.user.email);
    res.render('account', {
      usr: users,
      us: req.session.user.email,
      title: req.t('account.title'),
    });
  } else {
    res.status(401);
    res.render('401', { title: req.t('errors.401') });
  }
};

const changeEmail = [
  body('email').custom(async (value, { req }) => {
    const duplicate = await user.checkDuplicate(value.toLowerCase());
    if (value === req.body.oldEmail) {
      throw new Error('account.changeEmailSameEmail');
    }
    if (duplicate) {
      throw new Error('account.changeEmailDuplicate');
    }
    return true;
  }),
  body('password').custom(async (value, { req }) => {
    const checkPass = await bcrypt.compare(value, req.body.matchPass);
    if (!checkPass) {
      throw new Error('account.changeEmailWrongPassword');
    }
    return true;
  }),
  async (req, res) => {
    if (req.session.user && req.session.user.email !== 'superadmin@email.com') {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.render('account', {
          title: req.t('account.title'),
          errors: errors.array().map((e) => ({ ...e, msg: req.t(e.msg) })),
          usr: req.body,
          user: req.session.user.email,
        });
      } else {
        await user.updateEmail(req.body);
        req.session = null;
        res.render('login', {
title: req.t('login.title'),
          logout: req.t('account.changeEmailSuccess'),
        });
      }
    } else {
      res.status(401);
      res.render('401', { title: req.t('errors.401') });
    }
  },
];

const changePassword = [
  body('oldPassword').custom(async (value, { req }) => {
    const checkPass = await bcrypt.compare(value, req.body.matchPass);
    if (!checkPass) {
      throw new Error('account.changePasswordWrongOld');
    }
    return true;
  }),
  body('password').custom(async (value, { req }) => {
    const checkPass = await bcrypt.compare(value, req.body.matchPass);
    if (checkPass) {
      throw new Error('account.changePasswordSameAsOld');
    }
    return true;
  }),
  body('confirmPassword').custom(async (value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('account.changePasswordMismatch');
    }
    return true;
  }),
  async (req, res) => {
    if (req.session.user && req.session.user.role === 'superadmin') {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.render('account', {
          title: req.t('account.title'),
          errors: errors.array().map((e) => ({ ...e, msg: req.t(e.msg) })),
          usr: req.body,
          user: req.session.user.email,
        });
      } else {
        const password = await bcrypt.hash(req.body.password, 10);
        const { id } = req.body;

        await user.updatePassword(password, id);
        req.session = null;
        res.render('login', {
          title: req.t('login.title'),
          logout: req.t('account.changePasswordSuccess'),
        });
      }
    } else if (req.session.user && req.session.user.role === 'user') {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.render('account', {
          title: req.t('account.title'),
          errors: errors.array().map((e) => ({ ...e, msg: req.t(e.msg) })),
          usr: req.body,
          us: req.session.user.email,
        });
      } else {
        const password = await bcrypt.hash(req.body.password, 10);
        const { id } = req.body;

        await user.updatePassword(password, id);
        req.session = null;
        res.render('login', {
          title: req.t('login.title'),
          logout: req.t('account.changePasswordSuccess'),
        });
      }
    } else {
      res.status(401);
      res.render('401', { title: req.t('errors.401') });
    }
  },
];

const changeRole = [
  body('password').custom(async (value, { req }) => {
    const checkPass = await bcrypt.compare(value, req.body.matchPass);
    if (!checkPass) {
      throw new Error('account.changeRoleWrongPassword');
    }
    return true;
  }),
  async (req, res) => {
    if (req.session.user && req.session.user.email !== 'superadmin@email.com') {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.render('account', {
          title: req.t('account.title'),
          errors: errors.array().map((e) => ({ ...e, msg: req.t(e.msg) })),
          usr: req.body,
          user: req.session.user.email,
        });
      } else {
        await user.updateRole(req.body);
        req.session = null;
        res.render('login', {
          title: req.t('login.title'),
          logout: req.t('account.changeRoleSuccess'),
        });
      }
    } else {
      res.status(401);
      res.render('401', { title: req.t('errors.401') });
    }
  },
];

module.exports = {
  getAccount,
  changeEmail,
  changePassword,
  changeRole,
};
