const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: { type: String, required: true},
  content: String
});

noteSchema.set('timestamps', true);

noteSchema.set('toObject', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
  }
});

module.exports = mongoose.model('Note', noteSchema);
