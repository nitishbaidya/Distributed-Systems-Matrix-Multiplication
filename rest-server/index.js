const path = require("path");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const { performance } = require("perf_hooks");
const multiplyMatrixBlock = require("./multiplyMatrixBlock");
const utils = require("../data_handling/matrix_conv");
const app = express();

app.use(cors());
app.use(fileUpload());

//Homepage at localhost:8080
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname,"homepage.html"));
});

//Fecthing matrix files uploaded by the user and checking for upload errors
app.post("/multiply", async (req, res) => {
  // Error handling for when no files where uploaded
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({ error: "Error: No Matrix files uploaded" });
  }

  if (!req.files.hasOwnProperty("A")) {
    return res.status(400).json({ error: 'Error: "1st Matrix" not uploaded' });
  }

  if (!req.files.hasOwnProperty("B")) {
    return res.status(400).json({ error: 'Error: "2nd Matrix" not uploaded' });
  }

  const deadline = parseInt(req.body.deadline); // default 50 ms

  const fileA = req.files.A.data.toString().trim();
  const fileB = req.files.B.data.toString().trim();

  const matrixA = utils.textToMatrix(fileA);
  const matrixB = utils.textToMatrix(fileB);

  const dimension = matrixA.length;

  // Error handling for when matrices do not have the same dimensions
  if (matrixA.length !== matrixB.length) {
    return res
      .status(400)
      .json({ error: "Error: Dimensions of uploaded Matrices are different" });
  }

  // Error handling for when the matrices do not have dimensions which are powers of 2
  if (!utils.powerOfTwo(dimension)) {
    return res.status(400).json({
      error: "Error: Matrix dimensions must be powers of 2 e.g. 2x2, 4x4, 8x8",
    });
  }

  try {
    const p1 = performance.now();
    const resultingMatrix = await multiplyMatrixBlock(
      matrixA,
      matrixB,
      deadline
    );
    const p2 = performance.now();
    const totalTimeTaken = (p2 - p1) / 1000;

    console.log(
      "Matrix Size: " +
        resultingMatrix[0].length +
        " in " +
        totalTimeTaken.toFixed(4) +
        " seconds with deadline: " +
        deadline
    );
    res.json(resultingMatrix).status(200);
  } catch (error) {
    console.log(error);
    res.status(500);
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log("REST API running on " + port);
});
