class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
    this.page = +this.queryString.page;
    this.limit = +this.queryString.limit;
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
    const page = +this.queryString.page || 1;
    const limit = +this.queryString.limit || 10;
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
module.exports = ApiFeatures;