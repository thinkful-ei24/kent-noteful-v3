const mongoose = require('mongoose');
const { MONGODB_URI } = require('../config');

const Note = require('../models/note');

mongoose.connect(MONGODB_URI, { useNewUrlParser:true })
  .then(() => {
    const searchTerm = /lady gaga/gi;
    let filter = {};

    if (searchTerm) {
      filter.title = { $regex: searchTerm };
    }

    return Note.find(filter).sort({ updatedAt: 'desc' });
  })
  .then(results => {
    console.log(results);
  })
  .then(() => {
    return mongoose.disconnect();
  })
  .catch(err => {
    console.error(`ERROR: ${err.message}`);
    console.error(err);
  });

mongoose.connect(MONGODB_URI, { useNewUrlParser:true })
  .then(() => {
    const id = '000000000000000000000005';

    return Note.findById(id);
  })
  .then(results => {
    console.log(results);
  })
  .then(() => {
    return mongoose.disconnect();
  })
  .catch(err => {
    console.error(`ERROR: ${err.message}`);
    console.error(err);
  });

mongoose.connect(MONGODB_URI, { useNewUrlParser:true })
  .then(() => {
    const newNote = {
      title: 'New Note', 
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam rhoncus, mi a pharetra gravida, elit lectus blandit nibh, non venenatis velit felis in enim. Etiam non sodales sem. Nunc quis arcu eget quam tincidunt gravida. Vestibulum laoreet sem ut dignissim malesuada. Aenean congue posuere justo laoreet pretium. Cras sem ligula, sollicitudin non magna non, dictum aliquam neque. Etiam luctus maximus quam, ut efficitur ex. Phasellus eu turpis ornare, varius felis vel, eleifend lacus. Proin scelerisque ligula et nunc cursus lacinia. Phasellus placerat diam et feugiat fringilla.'
    };

    Note.create(newNote)
      .then(results => {
        console.log(results);
      })
      .then(() => {
        return mongoose.disconnect();
      })
      .catch(err => {
        console.error(`ERROR: ${err.message}`);
        console.error(err);
      });
  });