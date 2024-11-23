const mongoose = require('mongoose');

async function connect() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/natours-test');
    console.log('Connect db successfully');
  } catch (error) {
    console.log('Connect db failed');
  }
}
module.exports = { connect };