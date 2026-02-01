const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const user = require('../queries/usersQuery');

const getUsers = async (req, res) => {
  const users = await user.getUsers();
  res.render('users', { usr: users, title: req.t('users.title') });
};

const addUser = [
  body('email').custom(async (value) => {
    const duplicate = await user.email2(value.toLowerCase());
    if (duplicate) {
      throw new Error('users.addFailEmailExists');
    }
    return true;
  }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const users = await user.getUsers();
      return res.render('users', {
        title: req.t('users.title'),
        errors: errors.array().map((e) => ({ ...e, msg: req.t(e.msg) })),
        usr: users,
      });
    }
    const { email, role } = req.body;
    const password = await bcrypt.hash(req.body.password, 10);
    await user.addUser(email, password, role);
    res.redirect('/users');
  },
];

const updateUser = [
  body('email').custom(async (value, { req }) => {
    const duplicate = await user.checkDuplicate(value.toLowerCase());
    if (value !== req.body.oldEmail && duplicate) {
      throw new Error('users.editFailEmailExists');
    }
    return true;
  }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const users = await user.getUsers();
      return res.render('users', {
        title: req.t('users.title'),
        errors: errors.array().map((e) => ({ ...e, msg: req.t(e.msg) })),
        usr: users,
      });
    }
    await user.updateUser(req.body);
    res.redirect('/users');
  },
];

const deleteUser = async (req, res) => {
  await user.delUser(req.params.id);
  res.redirect('/users');
};

const resetPassword = async (req, res) => {
  const password = await bcrypt.hash('password', 10);
  await user.updatePassword(password, req.params.id);
  const users = await user.getUsers();
  res.render('users', {
    usr: users,
    title: req.t('users.title'),
    resetSuccess: req.t('users.resetSuccess'),
  });
};

module.exports = {
  getUsers,
  addUser,
  updateUser,
  deleteUser,
  resetPassword,
};
