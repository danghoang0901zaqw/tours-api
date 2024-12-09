const express = require('express');
const path = require('path');
const morgan = require('morgan');
const dotenv = require('dotenv');
const route = require('./src/routes');
const db = require('./src/config/db');
const ErrorController = require('./src/controllers/ErrorController');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan('dev'));
dotenv.config();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, 'public')));
db.connect();

route(app);
app.use(ErrorController.error);
const port = 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}`);
});