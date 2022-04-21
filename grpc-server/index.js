const cluster = require("cluster");
const runGrpcServer = require("./grpcServer");
const numCPUs = 8;

if (cluster.isMaster) {
  // Fork processes
  for (let i = 1; i < numCPUs; i++) {
    // Using 808[X] ports
    const port = `808${i}`;
    cluster.fork({
      PORT: port,
    });
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log("worker " + worker.process.pid + " died");
  });
} else {
  runGrpcServer();
}
