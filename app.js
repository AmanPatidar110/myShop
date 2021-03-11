const path = require('path');
const crypto = require('crypto');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
const dotenv = require('dotenv');


const User = require('./models/user');

dotenv.config();
const MONGODB_URI = process.env.MONGO_URI;


const app = express();

const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions'
});



let random ;
crypto.randomBytes(15, (err, buffer) => {
  if(err) {
    console.log(err);
    return res.redirect('/admin/add-product');
  };
  random = buffer.toString('hex');
});


const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'data/images');
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + random + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' ||file.mimetype === 'image/jpeg' ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
}



const csrfProtection = csrf();

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/data',express.static(path.join(__dirname, 'data')));
app.use(session({ secret: 'my secret', resave: false, saveUninitialized: false, store: store }));


app.use(csrfProtection); 
app.use(flash());

app.use((req, res, next) => {
  if (!req.session.user) return next();
  User.findById(req.session.user._id)
    .then(user => {
      req.user = user;
      next();
    })
    .catch(err => console.log(err));
});

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
})

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

mongoose
  .connect(MONGODB_URI)
  .then(result => {
    app.listen(process.env.PORT || 4000);
  })
  .catch(err => {
    console.log(err);
  });



