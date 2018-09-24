'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const app = require('../server');
const { TEST_MONGODB_URI } = require('../config');
const Folder = require('../models/folder');
const { folders } = require('../db/seed/folders');
const expect = chai.expect;
chai.use(chaiHttp);


describe.only('Noteful API', function() {
  before(function() {
    return mongoose.connect(TEST_MONGODB_URI, { useNewUrlParser: true })
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function() {
    return Promise.all([
      Folder.insertMany(folders),
      Folder.createIndexes()
    ]);
  });

  afterEach(function() {
    return mongoose.connection.db.dropDatabase();
  });

  after(function() {
    return mongoose.disconnect();
  });

  describe('GET /api/folders', function() {
    it('should return the correct number of folders', function() {
      return Promise.all([
        Folder.find(),
        chai.request(app).get('/api/folders')
      ])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.length(data.length);
        });
    });

    it('should return a list with the correct fields and values', function() {
      return Promise.all([
        Folder.find().sort('name'),
        chai.request(app).get('/api/folders')
      ])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.length(data.length);
          res.body.forEach(function(item, i) {
            expect(item).to.be.an('object');
            expect(item).to.have.all.keys('id', 'name', 'createdAt', 'updatedAt');
            expect(item.id).to.equal(data[i].id);
            expect(item.name).to.equal(data[i].name);
            expect(new Date(item.createdAt)).to.eql(data[i].createdAt);
            expect(new Date(item.updatedAt)).to.eql(data[i].updatedAt);
          });
        });
    });
  });

  describe('GET /api/folders/:id', function() {
    it('should get a folder by ID', function() {
      let data;
      return Folder.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app).get(`/api/folders/${data.id}`);
        })
        .then(res => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body.id).to.equal(data.id);
          expect(res.body.name).to.equal(data.name);
        });
    });
  });

  describe('POST /api/folders', function() {
    it('should create a new folder', function() {
      const newFolder = { name: 'new'};
      let res;
      return chai.request(app).post('/api/folders').send(newFolder)
        .then(_res => {
          res = _res;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          return Folder.findById(res.body.id);
        })
        .then(data => {
          expect(res.body.id).to.equal(data.id);
          expect(res.body.name).to.equal(data.name);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
        });
    });
  });

  describe('PUT /api/folders/:id', function() {
    it('should update a folder by ID', function() {
      const updateFolder = { name: 'update' };
      return Folder.findOne()
        .then(folder => {
          updateFolder.id = folder.id;
          return chai.request(app).put(`/api/folders/${folder.id}`).send(updateFolder);
        })
        .then(res => {
          expect(res).to.have.status(200);
          return Folder.findById(updateFolder.id);
        })
        .then(folder => {
          expect(folder.id).to.equal(updateFolder.id);
          expect(folder.name).to.equal(updateFolder.name);
        });
    });
  });

  describe('DELETE /api/folders/:id', function() {
    it('should delete a folder by ID', function() {
      let id;
      return Folder.findOne()
        .then(folder => {
          id = folder.id;
          return chai.request(app).delete(`/api/folders/${id}`);
        })
        .then(res => {
          expect(res).to.have.status(204);
          return Folder.findById(id);
        })
        .then(data => {
          expect(data).to.be.null;
        });
    });
  });
});