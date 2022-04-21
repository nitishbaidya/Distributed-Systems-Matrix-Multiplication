const grpc = require("grpc");
const proto_loader = require("@grpc/proto-loader");
const { performance } = require("perf_hooks");
const utils = require("../data_handling/matrix_conv");
const blockMult = require("../data_handling/calculations");
const proto_file = "blockmult.proto";

//  Fetching the grpc definition file and creating the client server
const definition = proto_loader.loadSync(proto_file, {
  keepCase: true,
  longs: String,
  enums: String,
  arrays: true,
});

const BlockMultService = grpc.loadPackageDefinition(definition)
  .BlockMultService;

// Creating upto 8 instances
function createGrpcClient(i) {
  // Ports ranging from 8081-8088
  const port = process.env.PORT || `808${i}`;
  const host = process.env.HOST || "0.0.0.0";
  const address = `${host}:${port}`;
  const client = new BlockMultService(
    address,
    grpc.credentials.createInsecure()
  );

  return client;
}

const constants = {
  deadline: 50, // deadline in ms  
  footprint: -1, // -1 = not been set yet
  numberOfCalls: 7, // 7 multiplication calls
  clients: [{ client: createGrpcClient(1), id: 0 }], //Starting off with 1 ready client
  clientIndex: 0, // keeping count
};

// Scaling Function
function scale() {
  let numberOfClients = Math.ceil(
    (constants.footprint * constants.numberOfCalls) /
      Math.abs(constants.deadline - constants.footprint)
  );

  console.log("footprint: " + constants.footprint);

  //Restricting number of clients to 8
  if (numberOfClients > 8) {
    numberOfClients = 8;
  }

  console.log("Scaling to: " + numberOfClients);

  for (let i = 1; i < numberOfClients; i++) {
    constants.clients[i] = {
      id: i,
      client: createGrpcClient(i),
    };
  }
}

// Fetching the next available client
function getClient() {
  
  const client = constants.clients[constants.clientIndex];
  constants.clientIndex = ++constants.clientIndex % constants.clients.length;

  if (!client) {
    console.log("Could not find an available client.");
    process.exit(1);
  }

  return client;
}

// Scaling down after completion
function resetGrpcClient() {
  constants.footprint = -1;
  constants.clientIndex = 0;

  // Close activate connections
  for (const clientObj of constants.clients) {
    clientObj.client.close();
  }

  constants.clients = [{ client: createGrpcClient(1), id: 0 }];
}

function setDeadline(deadline) {
  constants.deadline = deadline;
}

async function multiplicationRPC(A, B, MAX) {
  // Get the next available client
  const client = await getClient();

  console.log("Client in use: " + (client.id + 1));

  return new Promise((resolve, reject) => {
    const block = utils.createBlock(A, B, MAX);
    const footPrintTimer1 = performance.now();

    client.client.multiplication(block, (err, res) => {
      if (err) reject(err);

      // Set and measure footprint during first call, and scale up accordingly
      if (constants.footprint === -1) {
        constants.footprint = performance.now() - footPrintTimer1;
        scale();
      }

      const matrix = utils.Proto_Array(res.block);
      resolve(matrix);
    });
  });
}

async function additionRPC(A, B, MAX) {
  // Get the next available client
  const client = await getClient();

  console.log("Client in use: " + (client.id + 1));

  return new Promise((resolve, reject) => {
    const block = utils.createBlock(A, B, MAX);

    client.client.addition(block, (err, res) => {
      if (err) reject(err);
      // Make client available again
      client.isAvailable = true;

      const matrix = utils.Proto_Array(res.block);
      resolve(matrix);
    });
  });
}

module.exports = {
  additionRPC,
  multiplicationRPC,
  resetGrpcClient,
  setDeadline,
};
