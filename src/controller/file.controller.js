const uploadFile = require("../middleware/upload");
const fs = require("fs");

const baseUrl = "http://localhost:8080/files/";
const { createFFmpeg, fetchFile } = require('@ffmpeg/ffmpeg');
const ffmpeg = createFFmpeg({ log: true });

const upload = async (req, res) => {
  try {
    await uploadFile(req, res);
    await convert(req.file.originalname);

    if (req.file == undefined) {
      return res.status(400).send({ message: "Please upload a file!" });
    }

    res.status(200).send({
      message: "Converted file " + req.file.originalname + ".mp4",
    });

  } catch (err) {
    console.log(err);

    if (err.code == "LIMIT_FILE_SIZE") {
      return res.status(500).send({
        message: "File size cannot be larger than 2MB!",
      });
    }

    res.status(500).send({
      message: `Could not upload the file: ${req.file.originalname}. ${err}`,
    });
  }
};

// ffmpeg -i video.webm -preset veryfast video.mp4
// ffmpeg -i video.webm -c:v copy video.mp4
const convert = async (fileName) => {
    if (!ffmpeg.isLoaded()) { await ffmpeg.load(); }
    ffmpeg.FS('writeFile', fileName, await fetchFile(__basedir + "/resources/static/assets/uploads/"+ fileName));
    await ffmpeg.run('-i', fileName, fileName+".mp4");
    await fs.promises.writeFile(__basedir + "/resources/static/assets/mp4/"+ fileName + ".mp4", ffmpeg.FS('readFile', fileName+'.mp4'));
};

const getListFiles = (req, res) => {
  const directoryPath = __basedir + "/resources/static/assets/uploads/";

  fs.readdir(directoryPath, function (err, files) {
    if (err) {
      res.status(500).send({
        message: "Unable to scan files!",
      });
    }

    let fileInfos = [];

    files.forEach((file) => {
      fileInfos.push({
        name: file,
        url: baseUrl + file,
      });
    });

    res.status(200).send(fileInfos);
  });
};

const download = (req, res) => {
  const fileName = req.params.name;
  const directoryPath = __basedir + "/resources/static/assets/uploads/";

  res.download(directoryPath + fileName, fileName, (err) => {
    if (err) {
      res.status(500).send({
        message: "Could not download the file. " + err,
      });
    }
  });
};

module.exports = {
  upload,
  getListFiles,
  download,
};
