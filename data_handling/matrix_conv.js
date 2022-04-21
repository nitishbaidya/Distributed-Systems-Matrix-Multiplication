function Array_Proto(array) {
  return array.map((row) => {
    return {
      array: row,
    };
  });
}

function Proto_Array(array) {
  return array.map((row) => row.array);
}

function createBlock(A, B, MAX) {
  return {
    A: Array_Proto(A),
    B: Array_Proto(B),
    MAX,
  };
}

function textToMatrix(file) {
  return file
    .split("\n")
    .map((row) => row.split(" ").map((el) => parseInt(el)));
}

function powerOfTwo(x) {
  return (Math.log(x) / Math.log(2)) % 1 === 0;
}

module.exports = {
  Array_Proto,
  Proto_Array,
  createBlock,
  textToMatrix,
  powerOfTwo,
};
