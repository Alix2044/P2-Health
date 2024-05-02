const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const sessions = require('express-session');
const dotenv = require('dotenv');
const path = require('path')
const passport = require('passport');
const morgan = require('morgan');
const MongoStore = require('connect-mongo');


const app = express(); 




dotenv.config({ path: './config/config.env' })

// EJS - looking for views/layout.ejs
app.use(expressLayouts)
app.set("view engine", "ejs")


// Enabling use of request body with user data
app.use(express.urlencoded({ extended: true }));


mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB successfully...");
    
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });


  app.use(morgan('dev'));
// Sessions from Express to save sessions for login + mongoDB sessions to keep the sessions after restart
app.use(sessions({
    secret: 'process.env.SECRET', 
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ 
        mongoUrl: 'process.env.MONGO_URI', 
        collectionName: 'sessions' 
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // milliseconds in a day. Session expiration time (1 day)
    }
}));


app.use(express.static(path.join(__dirname,'public')))

// Passport configuration
require('./auth/passportConfig')(passport);
app.use(passport.initialize());
app.use(passport.session());


// Routes 
app.use('/',require('./routes/index'))
app.use('/auth',require('./routes/auth'))
app.use('/posts',require('./routes/posts'))

app.use((req, res, next) => {
 res.status(404).render('404');
});


const PORT =  process.env.PORT || 3000;


app.listen( PORT, () => {
    console.log(`Server is running on port ${PORT} on http://localhost:${PORT}`);
});

 