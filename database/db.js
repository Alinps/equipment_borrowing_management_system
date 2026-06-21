const mongoose = require('mongoose');
console.log(process.env.MONGO_URI);
mongoose.connect( process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('DB Error:', err));

module.exports = mongoose;