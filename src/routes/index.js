const toursRouter = require('./tours');
const usersRouter = require('./users');
const AppError = require('../utils/AppError');

function route(app) {
  app.use('/api/v1/tours', toursRouter);
  app.use('/api/v1/users', usersRouter);
  app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
  });
}
module.exports = route;
