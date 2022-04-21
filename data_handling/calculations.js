// Reference for multiplication taken from: https://stackoverflow.com/questions/27205018/multiply-2-matrices-in-javascript

function multiplication(A, B, MAX) {
  const result = [...Array(MAX)].map((_) => Array(MAX).fill(0));
  return result.map((row, i) => {
    return row.map((val, j) => {
      return A[i].reduce((sum, elm, k) => sum + elm * B[k][j], 0);
    });
  });
}

function addition(A, B, MAX) {
  const C = [...Array(MAX)].map((_) => Array(MAX));

  for (let i = 0; i < C.length; i++) {
    for (let j = 0; j < C.length; j++) {
      C[i][j] = A[i][j] + B[i][j];
    }
  }

  return C;
}

module.exports = {
  addition,
  multiplication,
};
