const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const crypto = require('crypto');
const serverless = require("serverless-http");

const app = express();

app.use(express.json());
app.use(cors());

const router = express.Router();

const mongoURI = "mongodb+srv://huanwu:ABCD1234@webproject.qhq6u.mongodb.net/?retryWrites=true&w=majority";
// Create mongo connection
const conn = mongoose.createConnection(mongoURI, { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true });
// Init gfs
let gfs;
conn.once('open', () => {
  // Init stream
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
});
// Create storage engine
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        //const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: file.originalname,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({ storage });

// @route POST /upload
// @desc  Uploads file to DB
router.post('/upload', upload.single('file'), (req, res) => {
  res.json({ files: true });
});

// @route GET /
// @desc Loads form
router.get('/getUploadedFileList', (req, res) => {
  gfs.files.find().toArray((err, files) => {
    // Check if files
    if (!files || files.length === 0) {
      res.json({ files: false });
    } else {
      res.json({ files: files });
    }
  });
});

// @route DELETE /files/:id
// @desc  Delete file
router.delete('/delete/:id', (req, res) => {
  gfs.remove({ _id: req.params.id, root: 'uploads' }, (err, gridStore) => {
    if (err) {
      return res.status(404).json({ err: err });
    }
    else {
      res.json({ files: true });
    }
  });
});

router.get("/", (req, res) => {
  res.json({
    'path': 'Home',
    'hello': "hi!"
  });
});

//For Local Test
// app.use("/", router);
// app.listen(3003);


//For deploy
app.use(`/.netlify/functions/api`, router);

module.exports = app;
module.exports.handler = serverless(app);