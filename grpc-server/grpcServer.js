const grpc = require("grpc");
const proto_loader = require("@grpc/proto-loader");
const utils = require("../data_handling/matrix_conv");
const blockMult = require("../data_handling/calculations");
const proto_file = "blockmult.proto";

//main server block that runs on each thread
function runGrpcServer() {
  const definition = proto_loader.loadSync(proto_file, {
    keepCase: true,
    longs: String,
    enums: String,
    arrays: true,
  });
  const blockMultProto = grpc.loadPackageDefinition(definition);
  const server = new grpc.Server();

  //calls the multiplication function and logs
  const all_cals = {
    multiplication: (body, cb) => {
      console.log("Processing Multiplication");
      const { A, B, MAX } = body.request;
      const multMatrix = blockMult.multiplication(
        utils.Proto_Array(A),
        utils.Proto_Array(B),
        MAX
      );

      const response = utils.Array_Proto(multMatrix);
      cb(null, { block: response });
    },
    //calls the addition function and logs
    addition: (body, cb) => {
      console.log("Processing Addition");
      const { A, B, MAX } = body.request;
      const multMatrix = blockMult.addition(
        utils.Proto_Array(A),
        utils.Proto_Array(B),
        MAX
      );
      const response = utils.Array_Proto(multMatrix);
      cb(null, { block: response });
    },
  };

  server.addService(blockMultProto.BlockMultService.service, all_cals);

  const port = process.env.PORT || 8081;
  const host = process.env.HOST || "0.0.0.0";
  const address = `${host}:${port}`;

  server.bind(address, grpc.ServerCredentials.createInsecure());
  console.log(`Server live at ${address}`);
  server.start();
}

module.exports = runGrpcServer;
