const mongoose = require('mongoose');

const { MONGODB_URI } = require('../config');
const Folder = require('../models/folder');
const Note = require('../models/note');

const { folders } = require('../db/seed/folders');
const { notes } = require('../db/seed/notes');

mongoose.connect(MONGODB_URI, { useNewUrlParser:true })
  .then(() => mongoose.connection.db.dropDatabase())
  .then(() => {
    return Promise.all([
      Note.insertMany(notes),
      Folder.insertMany(folders),
      Folder.createIndexes
    ]);
  })
  .then(() => mongoose.disconnect())
  .catch(err => {
    console.error(err);
  });