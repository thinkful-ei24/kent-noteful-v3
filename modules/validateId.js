'use strict';

const mongoose = require('mongoose');

const validateId = function(req, res, next) {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('Invalid ID');
    err.status = 400;
    return next(err);
  }
  return next();
};

module.exports = {
  validateId
};