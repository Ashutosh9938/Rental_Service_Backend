require('dotenv').config();
require('express-async-errors');
const cookieParser = require('cookie-parser');
const express = require('express');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const path = require('path');
const helmet = require('helmet');
const xss = require('xss-clean');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');

const app = express();

const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const connectDB = require('./db/connect');
const stripeController = require('./routes/stripe');
const authRouter = require('./routes/auth');
const postRouter = require('./routes/postRent');
const kycRouter = require('./routes/userVerification');
const profileRouter = require('./routes/profile');

const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');
const { profile } = require('console');

app.set('trust proxy', 1);

// Middleware setup

app.use(cors({
  origin: 
  process.env.HOST_URL  ||
    'http://localhost:5173',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser(process.env.JWT_SECRET));
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet());
app.use(xss());
app.use(mongoSanitize());
app.use(fileUpload({ useTempFiles: false }));
// Routes  
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/post',  postRouter);
app.use('/api/v1/kyc', kycRouter);
app.use('/api/v1/stripe', stripeController);
app.use('/api/v1/profile', profileRouter);




// Error handling middlewares
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

// Start the server
const port = process.env.PORT || 5000;
const start = async () => {
  try {
    await connectDB(process.env.MONGOO_URL);
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();
