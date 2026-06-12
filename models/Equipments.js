const mongoose = require('../database/db');

const equipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  catogory: {
    type: String,
    required: true,
    trim: true
  },
  serialNumber:{
    type: String,
    required: true,
    trim:true
  },
  availableQuantity:{
    type:Number,
    min:0
  },
  status: {
    type: String,
    enum :['Available','Maintenance','Retired'],
    default:'Available'
  },
});

module.exports = mongoose.model('Equipment', equipmentSchema);