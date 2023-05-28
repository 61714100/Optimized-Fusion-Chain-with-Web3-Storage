global.__projectname = __dirname;
global.__secret = "";
global.__secrets = [];
global.__localIp = "0.0.0.0";
global.__numberOfNodes = 0;
global.__minApprovals = (validators) => 2 * (validators / validators) + 1;
process.on("uncaughtException", () => {});

// Import all required modeles
require("dotenv").config();
const HTTP_PORT = 49152;
const fs = require("fs");
const express = require("express");
const bodyParser = require("body-parser");
const { File, Blob } = require("web3.storage");
const { NUMBER_OF_NODES } = require("./src/config");
const Wallet = require("./src/wallet");
const TransactionPool = require("./src/transaction-pool");
const P2pserver = require("./src/p2p-server");
const Validators = require("./src/validators");
const Blockchain = require("./src/blockchain");
const BlockPool = require("./src/block-pool");
const CommitPool = require("./src/commit-pool");
const PreparePool = require("./src/prepare-pool");
const MessagePool = require("./src/message-pool");
const web3Storage = require("./src/web3storage")();
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const path = require("path");
const os = require("os");
const open = require("open");
const detect = require("detect-port");
const si = require('systeminformation');
// const { Blob } = require("buffer");

// Create data directory when not exists
if (!fs.existsSync("data")) {
  fs.mkdirSync("data");
}

// Instantiate all objects
const app = express();
// Middlewares
app.use(function (req, res, next) {
  res.header("Cross-Origin-Embedder-Policy", "credentialless ");
  res.header("Cross-Origin-Opener-Policy", "unsafe-none");
  next();
});
// app.use(cors());
// app.use(helmet());
// app.use(compression());
app.use(bodyParser.json());

const wallet = new Wallet();
const transactionPool = new TransactionPool();
const validators = new Validators();
const blockchain = new Blockchain(validators);
const blockPool = new BlockPool();
const preparePool = new PreparePool();
const commitPool = new CommitPool();
const messagePool = new MessagePool();
const p2pserver = new P2pserver(
  blockchain,
  transactionPool,
  wallet,
  blockPool,
  preparePool,
  commitPool,
  messagePool,
  validators
);

app.use("/", express.static(path.join(__dirname, "ui", "dist")));

app.get('/cpu', async (req, res) => {
  const [cpu, memory] = await Promise.all([
    si.currentLoad(),
    si.mem()
  ])
  res.json({
    cpu,
    memory,
    processUsage: process.cpuUsage(),
    memoryUsage: process.memoryUsage.rss()
  })
  debugger
});
// Send all node info
app.get("/peers/info", async (req, res) => {
  res.json(Object.values(p2pserver.peerStats));
});

// sends all transactions in the transaction pool to the user
app.get("/device/transaction/list", (req, res) => {
  const transactionsObject = {};

  const createMappedTransaction = (transaction) => {
    const mappedTransaction = {
      data: transaction?.input?.data,
      timestamp: transaction?.input?.timestamp,
      fileName: transaction?.fileName,
    };

    if (!transactionsObject[transaction.id]?.length) {
      transactionsObject[transaction.id] = [mappedTransaction];
    } else {
      transactionsObject[transaction.id].push(mappedTransaction);
    }
  };

  transactionPool.transactions.forEach(createMappedTransaction);
  blockchain.chain.forEach((block) => {
    block?.data?.forEach(createMappedTransaction);
  });

  const transactions = [];
  for (key in transactionsObject) {
    transactions.push({
      transactionId: key,
      transactions: transactionsObject[key],
    });
  }

  res.json(transactions);
});

// creates transactions for the sent data
app.post("/device/transaction/new", async (req, res) => {
  try {
    const { data } = req.body;

    const fileName = `${new Date().getTime()}.json`;
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const files = [new File([blob], fileName)];
    const cid = await web3Storage.put(files);

    const transaction = wallet.createTransaction(cid);
    transaction.id = data.id;
    transaction.fileName = fileName;

    transactionPool.addTransaction(transaction);
    p2pserver.broadcastTransaction(transaction);

    return res.json(transactionPool.transactions);
  } catch (error) {
    console.log(error);
    return res.json(error);
  }
});

// sends the entire chain to the user
app.get("/device/unverified/transaction", (req, res) => {
  res.json(transactionPool.transactions);
});

// sends the entire chain to the user
app.get("/device/blocks", (req, res) => {
  res.json(
    blockchain.chain.map((each) => ({
      timestamp: each.timestamp,
      lastHash: each.lastHash,
      hash: each.hash,
      data: each.data,
      signature: each.signature,
    }))
  );
});

// starts the app server
const init = (PORT = HTTP_PORT) => {
  detect(PORT).then((_PORT) => {
    if (PORT === _PORT) {
      app.listen(PORT, () => {
        console.log('server running on', PORT)
        let ip = "127.0.0.1";
        // starts the p2p server
        global.__localIp = ip;
        p2pserver.listen();

        open(`http://${ip}:${PORT}`);
        console.log(`UI DASHBOARD LOADING IN http://${ip}:${PORT}`);
      });
    } else {
      if (PORT < 49162) {
        init(PORT + 1);
      } else {
        console.log("ALL PORTS ARE ALREADY IN USE.");
      }
    }
  });
};

init();
