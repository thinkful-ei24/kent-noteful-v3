'use strict';

const mongoose = require('mongoose');
const Folder = require('../models/folder');
const Tag = require('../models/tag');

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

const validateFolderId = function(req, res, next) {
  const { folderId } = req.body;
  const userId = req.user.id;

  if (!folderId) return next();

  if (!mongoose.Types.ObjectId.isValid(folderId)) {
    const err = new Error('Invalid Folder ID');
    err.status = 400;
    return next(err);
  }

  return Folder.count({ _id: folderId, userId })
    .then(count => {
      if (!count) {
        const err = new Error('This is not your folder');
        err.status = 400;
        return next(err);
      }
      return next();
    });

};

const validateTagIds = function(req, res, next) {
  const { tags } = req.body;
  const userId = req.user.id;

  if (tags === undefined) return next();

  if (!Array.isArray(tags)) {
    const err = new Error('Tags must be an array');
    err.status = 400;
    return next(err);
  }

  tags.forEach(tag => {
    if (!mongoose.Types.ObjectId.isValid(tag)) {
      const err = new Error('Invalid Tag ID');
      err.status = 400;
      return next(err);
    }
  });

  return Tag.count({ _id: { $in: req.body.tags }, userId })
    .then(count => {
      if (count !== tags.length) {
        const err = new Error('ID in `tags` does not exist.');
        err.status = 400;
        return next(err);
      }
      else return next();
    })
    .catch(err => next(err));
};

module.exports = {
  validateId,
  validateName,
  validateTitle,
  validateFolderId,
  validateTagIds
};