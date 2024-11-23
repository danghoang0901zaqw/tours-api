const Tour = require('../models/Tour');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
    this.page = +this.queryString.page || 1;
    this.limit = +this.queryString.limit || 10;
    this.total = 0;
  }
  filter() {
    const queryObj = {
      ...this.queryString,
    };
    const excludedFields = ['page', 'sort', 'order', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    const queryStr = JSON.stringify(queryObj).replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`
    );
    const parseQuery = JSON.parse(queryStr);

    this.query = this.query.find(parseQuery);
    return this;
  }
  sort() {
    if (this.queryString.sort) {
      const order = this.queryString.order === 'desc' ? -1 : 1;
      this.query = this.query.sort({ [this.queryString.sort]: order });
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  pagination() {
    const page = +this.queryString.page;
    const limit = +this.queryString.limit;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    Tour.countDocuments()
      .then((total) => {
        this.total = total;
        if (skip >= total) throw new Error('This page does not exist');
      })
      .catch();
    return this;
  }
}

class ToursController {
  // [GET] /top-5-cheap
  async aliasTopTour(req, res, next) {
    req.query.limit = 5;
    req.query.sort = 'price';
    req.query.order = 'asc';
    next();
  }

  // [GET] /
  getAllTour = catchAsync(async (req, res, next) => {
    console.log(req.user);
    const features = new ApiFeatures(Tour.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .pagination();

    const tours = await features.query;
    res.status(200).json({
      status: 'success',
      pagination: {
        total: features.total,
        page: features.page,
        limit: features.limit,
      },
      data: {
        tours,
      },
    });
  });

  // [GET] /tours/:id
  getTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findById(req.params.id);
    if (!tour) {
      return next(new AppError('No tour found with that ID', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  });

  // [POST] /tours/
  async createTour(req, res) {
    try {
      const newTour = new Tour(req.body);
      await newTour.save();
      res.status(201).json({
        status: 'create tour success',
        data: {
          tour: newTour,
        },
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        status: 'create tour failed',
        data: {
          error,
        },
      });
    }
  }

  updateTour = catchAsync(async (req, res, next) => {
    const newTour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!newTour) {
      return next(new AppError('No tour found with that ID', 404));
    }
    res.status(201).json({
      status: 'update tour success',
      data: {
        tour: newTour,
      },
    });
  });

  deleteTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findByIdAndDelete(req.params.id);
    if (!tour) {
      return next(new AppError('No tour found with that ID', 404));
    }
    res.status(204).json({
      status: 'delete tour success',
      data: null,
    });
  });

  async tourStats(req, res) {
    try {
      const stats = await Tour.aggregate([
        {
          $match: { ratingsAverage: { $gte: 4.5 } },
        },
        {
          $group: {
            _id: { $toUpper: '$difficulty' },
            numTours: { $sum: 1 },
            numRatings: { $sum: '$ratingsQuantity' },
            avgRating: { $avg: '$ratingsAverage' },
            avgPrice: { $avg: '$price' },
            minPrice: { $min: '$price' },
            maxPrice: { $max: '$price' },
          },
        },
        {
          $sort: { avgPrice: 1 },
        },
        // {
        //   $match: { _id: { $ne: 'EASY' } }
        // }
      ]);
      res.status(200).json({
        status: 'success',
        data: {
          stats,
        },
      });
    } catch (error) {
      res.status(500).json({
        status: 'failed',
        data: {
          error,
        },
      });
    }
  }
  async monthlyPlanStats(req, res) {
    try {
      const year = req.params.year * 1;
      const plan = await Tour.aggregate([
        {
          $unwind: '$startDates',
        },
        {
          $match: {
            startDates: {
              $gte: new Date(`${year}-01-01`),
              $lte: new Date(`${year}-12-31`),
            },
          },
        },
        {
          $group: {
            _id: { $month: '$startDates' },
            numTourStarts: { $sum: 1 },
            tours: { $push: '$name' },
          },
        },
        {
          $addFields: { month: '$_id' },
        },
        {
          $project: {
            _id: 0,
          },
        },
        {
          $sort: { numTourStarts: -1 },
        },
        {
          $limit: 12,
        },
      ]);
      res.status(200).json({
        status: 'success',
        data: {
          plan,
        },
      });
    } catch (error) {
      res.status(500).json({
        status: 'failed',
        data: {
          error,
        },
      });
    }
  }
}
module.exports = new ToursController();
