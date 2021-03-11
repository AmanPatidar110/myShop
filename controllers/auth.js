const crypto = require('crypto');

const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');

const User = require('../models/user');
const user = require('../models/user');
const { use } = require('../routes/shop');
const ConnectMongoDBSession = require('connect-mongodb-session');
const { Console } = require('console');

const transporter = nodemailer.createTransport(sendgridTransport({
  auth: {
    api_key: process.env.SG_API_KEY
  }
}));

exports.getLogin = (req, res, next) => {
  message = req.flash('error')[0];
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    isAuthenticated: false,
    errorMessage: message
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  User.findOne({ email: email })
    .then(user => {
      if (!user) {
        req.flash('error', 'Invalid Email!');
        return res.redirect('login');
      }

      bcrypt.compare(password, user.password)
        .then(doMatch => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save(err => {
              console.log(err);
              res.redirect('/');
            })
          }
          req.flash('error', 'Invalid Password!');
          res.redirect('/login');
        })
    })
    .catch(err => console.log(err));
};

exports.getSignup = (req, res, next) => {
  message = req.flash('error')[0];
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    isAuthenticated: false,
    errorMessage: message
  });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({ email: email })
    .then(userDoc => {
      if (userDoc) {
        req.flash('error', "E-Mail already registered, please use a different one!");
        return res.redirect('signup');
      }
      return bcrypt
        .hash(password, 12)
        .then(hashedPassword => {
          const user = new User({
            email: email,
            password: hashedPassword,
            cart: { item: [] }
          });
          user.save()
            .then(result => {
              res.redirect('login');
              return transporter.sendMail({
                to: email,
                from: process.env.MAIL_AUTHORIZED_WITH_SENDGRID,
                subject: 'SignUp Succeeded!',
                html: `
                  <h1> You are successfully signedIn to MyShop. <h1/>
                  <h1> Happy Shopping <h1/>
                `
              })
            }).catch(err => console.log(err));
        })
    })
    .catch(err => console.log(err));
};


exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};


exports.getReset = (req, res, next) => {
  message = req.flash('error')[0];
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: message
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect('/reset');
    }
    const token = buffer.toString('hex');
    const email = req.body.email;

    user.findOne({ email: email })
      .then(user => {
        if (!user) {
          req.flash('error', 'No account matching with the entered email found!');
          return res.redirect('/reset');
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save()
          .then(result => {
            transporter.sendMail({
              to: email,
              from: process.env.MAIL_AUTHORIZED_WITH_SENDGRID,
              subject: 'Password Reset',
              html: `
            <p> You requested a password reset </p>
            <p> Click this <a href="http://localhost:4000/reset/${token}">link</a> to set a new password. </p>
            <p> Note: The above link will be valid for 1 Hour. </p>
          `
            })
          }).then(result => {
            res.redirect('/');
          }).catch(err => console.log(err));
      })
      .catch(err => console.log(err));
  })
};


exports.getSetPassword = (req, res, next) => {
  const token = req.params.token;

  User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then(user => {
      if (!user) {
        return res.redirect('/');
      }
      message = req.flash('error')[0];
      res.render('auth/set-password', {
        path: '/set-password',
        pageTitle: 'Set Password',
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken: token
      })
    })
    .catch(err => console.log(err));
};

exports.postSetPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;

  User.findOne({ resetToken: passwordToken, resetTokenExpiration: { $gt: Date.now() }, _id: userId })
    .then(user => {
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then(hashedPassword => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then(result => {
      res.redirect('/login');
    })
    .catch(err => {
      console.log(err);
    });
}