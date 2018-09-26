'use strict';

const Folder = require('../models/folder');

const getAllFolders = function(req, res, next) {
  const userId = req.user.id;
  return Folder.find({ userId })
    .sort({ name: 1 })
    .then(folders => res.json(folders))
    .catch(err => next(err));
};

const getFolderById = function(req, res, next) {
  const { id } = req.params;
  const userId = req.user.id;

  return Folder.findOne({ _id: id, userId })
    .then(folder => folder ? res.json(folder) : next())
    .catch(err => next(err));
};

const createNewFolder = function(req, res, next) {
  const { name } = req.body;
  const userId = req.user.id;

  const newFolder = { name, userId };
  return Folder.create(newFolder)
    .then(folder => {
      if (folder) {
        res.location(`${req.originalUrl}/${folder.id}`).status(201).json(folder);
      } else {
        next();
      }
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The folder name already exists');
        err.status = 400;
      }
      next(err);
    });
};
const updateFolderById = function(req, res, next) {
  const { name } = req.body;
  const { id } = req.params;
  const userId = req.user.id;

  const updateData = { name, userId };
  return Folder.findOneAndUpdate({ _id: id }, updateData, { new: true })
    .then(folder => folder ? res.json(folder) : next())
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The folder name already exists');
        err.status = 400;
      }
      next(err);
    });
};

const deleteFolderById = function(req, res, next) {
  const userId = req.user.id;
  const { id } = req.params;

  return Folder.findOneAndRemove({ _id: id, userId })
    .then(() => res.sendStatus(204))
    .catch(err => next(err));
};

module.exports = {
  getAllFolders,
  getFolderById,
  createNewFolder,
  updateFolderById,
  deleteFolderById
};