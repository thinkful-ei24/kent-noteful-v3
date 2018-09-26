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

const validateName = function(req, res, next) {
  const { name } = req.body;
  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }
  return next();
};

const validateTitle = function(req, res, next) {
  const { title } = req.body;
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }
  return next();
};

module.exports = {
  validateId,
  validateName,
  validateTitle
};