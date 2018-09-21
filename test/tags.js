'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const app = require('../server');
const { TEST_MONGODB_URI } = require('../config');
const Tag = require('../models/tag');
const { tags } = require('../db/seed/tags');
const expect = chai.expect;
chai.use(chaiHttp);

describe('Tags API', function() {
  before(function() {
    return mongoose.connect(TEST_MONGODB_URI, { useNewUrlParser: true })
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function() {
    return Tag.insertMany(tags);
  });

  afterEach(function() {
    return mongoose.connection.db.dropDatabase();
  });

  after(function() {
    return mongoose.disconnect();
  });

  describe('GET /api/tags', function() {
    it('should get all tags', function() {
      return Promise.all([
        Tag.find(),
        chai.request(app).get('/api/tags')
      ])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.length(data.length);
        });
    });
  });

  describe('GET /api/tags/:id', function() {
    it('should get a tag by ID', function() {
      let data;
      return Tag.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app).get(`/api/tags/${data.id}`);
        })
        .then(res => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body.id).to.equal(data.id);
          expect(res.body.name).to.equal(data.name);
        });
    });
  });

  describe('POST /api/tags', function() {
    it('should create a new tag', function() {
      const newTag = { name: 'new'};
      let res;
      return chai.request(app).post('/api/tags').send(newTag)
        .then(_res => {
          res = _res;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          return Tag.findById(res.body.id);
        })
        .then(data => {
          expect(res.body.id).to.equal(data.id);
          expect(res.body.name).to.equal(data.name);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
        });
    });
  });

  describe('PUT /api/tags/:id', function() {
    it('should update a tag by ID', function() {
      const updateTag = { name: 'update' };
      return Tag.findOne()
        .then(tag => {
          updateTag.id = tag.id;
          return chai.request(app).put(`/api/tags/${tag.id}`).send(updateTag);
        })
        .then(res => {
          expect(res).to.have.status(200);
          return Tag.findById(updateTag.id);
        })
        .then(tag => {
          expect(tag.id).to.equal(updateTag.id);
          expect(tag.name).to.equal(updateTag.name);
        });
    });
  });

  describe('DELETE /api/tags/:id', function() {
    it('should delete a tag by ID', function() {
      let id;
      return Tag.findOne()
        .then(tag => {
          id = tag.id;
          return chai.request(app).delete(`/api/tags/${id}`);
        })
        .then(res => {
          expect(res).to.have.status(204);
          return Tag.findById(id);
        })
        .then(data => {
          expect(data).to.be.null;
        });
    });
  });
});