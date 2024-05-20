const express = require('express');
const flash = require('express-flash');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const sessions = require('express-session');
const dotenv = require('dotenv');
const path = require('path')
const passport = require('passport');
const morgan = require('morgan');
const MongoStore = require('connect-mongo');
const {Server } = require('socket.io');
const Challenge = require('./models/Challenge');
const methodOverride= require('method-override');
const Message = require('./models/Message');


const app = express(); 




dotenv.config({ path: './config/config.env' })

// EJS - looking for views/layout.ejs
app.use(expressLayouts)
app.set('layout', 'layouts/main.ejs');
app.set("view engine", "ejs")


// Enabling use of request body with user data
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.json());

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
    secret: process.env.SECRET, 
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ 
        mongoUrl: process.env.MONGO_URI, 
        collectionName: 'sessions' 
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // milliseconds in a day. Session expiration time (1 day)
    }
}));

// Adding flash middleware for flash messages
app.use(flash());
app.use(express.static(path.join(__dirname,'public')))


app.use('/uploads', express.static('uploads'));

// Passport configuration
require('./auth/passportConfig')(passport);
app.use(passport.initialize());
app.use(passport.session());


// Routes 
app.use('/',require('./routes/index'))
app.use('/auth',require('./routes/auth'))
app.use('/posts',require('./routes/posts'))
app.use('/chat',require('./routes/chat'))
app.use('/challenges', require('./routes/challenge'));
app.use('/mealplan',require('./routes/mealplan'))
app.use('/profileSettings',require('./routes/profileSettings'))





// Route doesn't exist
app.use((req, res, next) => {
 res.render('index');
});


const PORT =  process.env.PORT || 3000;


const server  = app.listen( PORT, () => {
    console.log(`Server is running on port ${PORT} on http://localhost:${PORT}`);
});

const io = new Server(server);

/*

io.on('connection', (socket) => {
  socket.on('joinRoom', (roomId) => {
    socket.join(roomId); 
  });

  socket.on('chatMessage', ({ roomId, msg }) => {
    io.to(roomId).emit('message', msg); 
  });
});*/
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinRoom', ({ roomId, userId }) => {
    socket.join(roomId);
    console.log(`User ${userId} joined room: ${roomId}`);
  });

  socket.on('chatMessage', async ({ roomId, userId, message }) => {
    try {
      const newMessage = new Message({ roomId, user: userId, text: message });
      await newMessage.save();

      io.to(roomId).emit('message', { userId, message, timestamp: newMessage.timestamp });
    } catch (err) {
      console.error('Error saving message to database:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});