const mongoose = require('mongoose');

const { MONGODB_URI } = require('../config');
const Tag = require('../models/tag');
const Folder = require('../models/folder');
const Note = require('../models/note');

const { tags } = require('../db/seed/tags');
const { folders } = require('../db/seed/folders');
const { notes } = require('../db/seed/notes');

mongoose.connect(MONGODB_URI, { useNewUrlParser:true })
  .then(() => mongoose.connection.db.dropDatabase())
  .then(() => {
    return Promise.all([
      Note.insertMany(notes),
      Folder.insertMany(folders),
      Tag.insertMany(tags),
      Folder.createIndexes(),
      Tag.createIndexes()
    ]);
  })
  .then(() => mongoose.disconnect())
  .catch(err => {
    console.error(err);
  });