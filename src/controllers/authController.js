const bcrypt = require('bcrypt');
const user = require('../queries/usersQuery');

const login = async (req, res) => {
  const { email } = req.body;
  const { password } = req.body;

  const checkPass = await bcrypt.compare(
    password,
    await user.checkPassword(email),
  );

  if (
    email === (await user.email(email))
    && checkPass
    && (await user.checkRole(email)) === 'superadmin'
  ) {
    req.session.user = {
      email,
      role: 'superadmin',
    };
    res.redirect('/');
  } else if (
    email === (await user.email(email))
    && checkPass
    && (await user.checkRole(email)) === 'user'
  ) {
    req.session.user = {
      email,
      role: 'user',
    };
    res.redirect('/');
  } else {
    res.render('login', {
      title: req.t('login.title'),
      loginFail: req.t('login.loginFail'),
    });
  }
};

const logout = (req, res) => {
  req.session = null;
  res.render('login', { title: req.t('login.title'), logout: req.t('login.logoutSuccess') });
};

module.exports = {
  login,
  logout,
};
