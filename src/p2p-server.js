// import the ws module
const WebSocket = require("ws");
const pidusage = require("pidusage");
const findDevices = require("local-devices");
const cpuStat = require("cpu-stat");
const detect = require("detect-port");
const loading = require("loading-cli");

// import the min approval constant which will be used to compare the count the messages
const { MIN_APPROVALS } = require("./config");

// decalre a p2p server port on which it would listen for messages
// we will pass the port through command line
let P2P_PORT = 3000;

// the neighbouring nodes socket addresses will be passed in command line
// this statemet splits them into an array
const peers = process.env.PEERS ? process.env.PEERS.split(",") : [];

// message types used to avoid typing messages
// also used in swtich statement in message handlers
const MESSAGE_TYPE = {
  sync_request: "SYNC-REQUEST",
  sync_data: "SYNC-DATA",
  transaction: "TRANSACTION",
  prepare: "PREPARE",
  pre_prepare: "PRE-PREPARE",
  commit: "COMMIT",
  round_change: "ROUND_CHANGE",
  sync_heart_beat: "SYNC_HEART_BEAT",
  vote_request: "VOTE_REQUEST",
  vote_response: "VOTE_RESPONSE",
  request_node_data: "REQUEST_NODE_DATA",
  response_node_data: "RESPONSE_NODE_DATA",
  get_peer_stats: "GET_PEERS_STATS",
  secret: "SECRET",
};

// Heart beat duration in 5000 milli second
const MIN_HEART_BEAT_DURATION = 25000; // 25 sec
const PEER_STATS_SHARE_DURATION = 5000; // 25 sec
const PER_SEC_IN_MILLI_SEC = 1000;
const PRECISION_COUNT_VALUE = 0.0000000000001;

// Node state
const NODE_STATE = {
  leader: "LEADER",
  follower: "FOLLOWER",
};

// PBFT STATUS
const PBFT_STATUS = {
  prePrepare: "PRE_PREPARE",
  prepare: "PREPARE",
  commit: "COMMIT",
  none: "",
};

const P2P_PORTS = [
  3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010,
];

// Track UI Node
// let UI_NODES = [];

class P2pserver {
  constructor(
    blockchain,
    transactionPool,
    wallet,
    blockPool,
    preparePool,
    commitPool,
    messagePool,
    validators
  ) {
    this.blockchain = blockchain;
    this.sockets = [];
    this.transactionPool = transactionPool;
    this.wallet = wallet;
    this.blockPool = blockPool;
    this.preparePool = preparePool;
    this.commitPool = commitPool;
    this.messagePool = messagePool;
    this.validators = validators;
    this.term = 0;
    this.nodeName = "NODE-BLOCK";
    this.nodeState = NODE_STATE.follower;
    this.heartBeat = {
      current: 0,
      updatedAt: null,
    };
    this.nodeTime = 0;
    this.totalVoteReceived = 0;
    this.pbftStatus = PBFT_STATUS.none;
    this.peerStats = {};
    this.connectedPeers = {};
    this.secrets = {};

    this.checkHeartBeatTimeout();
    this.sendPeerStats();
  }

  // Creates a server on a given port
  listen(PORT = P2P_PORT) {
    detect(PORT).then((_PORT) => {
      if (PORT === _PORT) {
        P2P_PORT = PORT;

        const server = new WebSocket.Server({ port: PORT });
        server.on("connection", (socket) => {
          this.connectSocket(socket);

          socket.send(
            JSON.stringify({
              type: MESSAGE_TYPE.secret,
              secret: global.__secret,
              from: `${global.__localIp}:${PORT}`,
            })
          );
          // console.log("new connection");
        });

        this.connectToPeers();
        console.log(`LISTENING FOR PEER TO PEER CONNECTION ON PORT: ${PORT}`);
      } else {
        if (PORT < 3010) {
          this.listen(PORT + 1);
        } else {
          console.log("ALL PORTS ARE ALREADY IN USE.");
        }
      }
    });
  }

  // connects to a given socket and registers the message handler on it
  connectSocket(socket) {
    const socketIndex = this.sockets.length;
    this.sockets.push(socket);
    this.messageHandler(socket, socketIndex);
    console.log(
      `CONNECTED TO BEW PEER, TOTALLY ${this.validators.list.length} PEER's ARE AVAILABLE.`
    );
  }

  // connects to the peers passed in command line
  connectToPeers() {
    setInterval(() => {
      // const load = loading("Searching for local nodes to connect...").start();
      findDevices()
        .then((devices) => {
          [devices, { ip: global.__localIp, mac: "current-pc" }].forEach(
            (device) => {
              P2P_PORTS.forEach((PORT) => {
                if (device.ip === global.__localIp && PORT == P2P_PORT) return;
                if (
                  this.connectedPeers[`${device.ip}:${PORT}`] &&
                  this.connectedPeers[`${device.ip}:${PORT}`] == PORT
                )
                  return;

                try {
                  const socket = new WebSocket(`ws://${device.ip}:${PORT}`);

                  socket &&
                    socket.on("open", () => {
                      global.__numberOfNodes += 1;

                      this.connectedPeers[`${device.ip}:${PORT}`] = PORT;

                      this.connectSocket(socket);
                    });
                  socket &&
                    socket.on("error", (error) => {
                      // console.log(error);
                    });
                  socket &&
                    socket.on("close", () => {
                      global.__numberOfNodes -= 1;

                      delete this.connectedPeers[`${device.ip}:${PORT}`];
                      delete this.secrets[`${device.ip}:${PORT}`];

                      global.__secrets = Object.values(this.secrets);

                      this.validators.generateAddresses();
                      this.blockchain.updateValidatorList();
                    });
                } catch {
                  console.log(`NO CONNECTION ${PORT}`);
                }
              });
            }
          );
        })
        .finally(() => {
          setTimeout(() => {
            // load.stop();
          }, 5000);
        });
    }, 15000);
  }

  // Get Peers stats
  sendPeerStats() {
    setInterval(async () => {
      const stats = await pidusage(process.pid);

      this.peerStats[this.nodeName] = {
        ...this.peerStats[this.nodeName],
        peerName: this.nodeName,
        peerPbftStatus: this.pbftStatus,
        peerRaftStatus: this.nodeState,
        peerRaftLastHearbeatUpdate: this.heartBeat.updatedAt,
      };

      stats.totalCores = cpuStat.totalCores();
      stats.clockMHz = cpuStat.clockMHz(0);
      stats.avgClockMHz = cpuStat.avgClockMHz();

      if ("peerStats" in this.peerStats[this.nodeName]) {
        this.peerStats[this.nodeName].peerStats?.unshift(stats);
      } else {
        this.peerStats[this.nodeName].peerStats = [stats];
      }

      if (this.peerStats[this.nodeName]?.peerStats?.length > 25) {
        this.peerStats[this.nodeName].peerStats.pop();
      }

      this.sockets.forEach((socket) => {
        socket.send(
          JSON.stringify({
            type: MESSAGE_TYPE.get_peer_stats,
            message: this.peerStats[this.nodeName],
          })
        );
      });
    }, PEER_STATS_SHARE_DURATION);
  }

  // broadcasts transactions
  broadcastTransaction(transaction) {
    this.sockets.forEach((socket) => {
      this.sendTransaction(socket, transaction);
    });
  }

  // sends transactions to a perticular socket
  sendTransaction(socket, transaction) {
    socket.send(
      JSON.stringify({
        type: MESSAGE_TYPE.transaction,
        transaction: transaction,
      })
    );
    // this.sendNodeData(socket);
  }

  // broadcasts preprepare
  broadcastPrePrepare(block) {
    this.sockets.forEach((socket) => {
      this.sendPrePrepare(socket, block);
    });
  }

  // sends preprepare to a particular socket
  sendPrePrepare(socket, block) {
    this.pbftStatus = PBFT_STATUS.prePrepare;
    socket.send(
      JSON.stringify({
        type: MESSAGE_TYPE.pre_prepare,
        block: block,
      })
    );
    // this.sendNodeData(socket);
  }

  // broadcast prepare
  broadcastPrepare(prepare) {
    this.sockets.forEach((socket) => {
      this.sendPrepare(socket, prepare);
    });
  }

  // sends prepare to a particular socket
  sendPrepare(socket, prepare) {
    this.pbftStatus = PBFT_STATUS.prepare;
    socket.send(
      JSON.stringify({
        type: MESSAGE_TYPE.prepare,
        prepare: prepare,
      })
    );
    // this.sendNodeData(socket);
  }

  // broadcasts commit
  broadcastCommit(commit) {
    this.sockets.forEach((socket) => {
      this.sendCommit(socket, commit);
    });
  }

  // sends commit to a particular socket
  sendCommit(socket, commit) {
    this.pbftStatus = PBFT_STATUS.commit;
    socket.send(
      JSON.stringify({
        type: MESSAGE_TYPE.commit,
        commit: commit,
      })
    );
    // this.sendNodeData(socket);
  }

  // broacasts round change
  broadcastRoundChange(message) {
    this.sockets.forEach((socket) => {
      this.sendRoundChange(socket, message);
    });
  }

  // sends round change message to a particular socket
  sendRoundChange(socket, message) {
    socket.send(
      JSON.stringify({
        type: MESSAGE_TYPE.round_change,
        message: message,
      })
    );
    // this.sendNodeData(socket);
  }

  // Check for heart beat timeout
  checkHeartBeatTimeout() {
    setInterval(() => {
      this.nodeTime += 1;

      if (
        this.nodeState !== NODE_STATE.leader &&
        this.nodeTime > MIN_HEART_BEAT_DURATION / PER_SEC_IN_MILLI_SEC &&
        (this.heartBeat.updatedAt === null ||
          (new Date().getTime() - this.heartBeat.updatedAt) / 1000 > 10)
      ) {
        this.nodeTime = 0;
        this.sentVoteRequestToNodes();
      }
    }, PER_SEC_IN_MILLI_SEC);
  }

  // Send vote request to nodes
  sentVoteRequestToNodes() {
    if (
      this.nodeState === NODE_STATE.leader &&
      !(
        this.heartBeat.updatedAt === null ||
        (new Date().getTime() - this.heartBeat.updatedAt) / 1000 > 10
      )
    )
      return;

    this.term += 1;
    this.nodeTime = 0;
    this.heartBeat.current = 0;
    this.heartBeat.updatedAt = null;
    this.nodeState = NODE_STATE.candidate;

    this.sockets.forEach((socket) => {
      socket.send(
        JSON.stringify({
          type: MESSAGE_TYPE.vote_request,
          message: this.term,
        })
      );
      // this.sendNodeData(socket);
    });
  }

  // Sent vote response
  sentVoteResponseToNode(socket, term) {
    if (
      this.nodeState === NODE_STATE.leader &&
      !(
        this.heartBeat.updatedAt === null ||
        (new Date().getTime() - this.heartBeat.updatedAt) / 1000 > 10
      )
    )
      return;

    if (this.term != term) {
      this.term += 1;
      this.nodeTime = 0;
      this.heartBeat.current = 0;
      this.heartBeat.updatedAt = null;

      socket.send(
        JSON.stringify({
          type: MESSAGE_TYPE.vote_response,
          message: true,
        })
      );
    } else {
      socket.send(
        JSON.stringify({
          type: MESSAGE_TYPE.vote_response,
          message: false,
        })
      );
    }
    // this.sendNodeData(socket);
  }

  // Received vote from node
  receivedVoteFromNode(vote) {
    if (vote) {
      this.totalVoteReceived += 1;
    }

    if (this.totalVoteReceived === this.sockets.length) {
      this.nodeTime = 0;
      this.heartBeat.current = 0;
      this.heartBeat.updatedAt = null;
      this.nodeState = NODE_STATE.leader;
      this.sentHeartBeatWithDuration();
    }
  }

  // Sync heart beat from leader
  syncHeartBeatFromLeader({ chain, term }) {
    this.term = term;
    this.nodeTime = 0;
    this.nodeState = NODE_STATE.follower;
    this.heartBeat.updatedAt = new Date().getTime();
    this.heartBeat.current += PRECISION_COUNT_VALUE;

    if (chain.length > this.blockchain.chain.length) {
      this.blockchain.chain = chain;
      this.blockchain.writeBlockToFile();
    }
  }

  // sent heart beat with duration
  sentHeartBeatWithDuration() {
    if (this.nodeState !== NODE_STATE.leader) return;

    setInterval(() => {
      this.sockets.forEach((socket) => {
        if (this.nodeState === NODE_STATE.leader) {
          socket.send(
            JSON.stringify({
              type: MESSAGE_TYPE.sync_heart_beat,
              message: { chain: this.blockchain.chain, term: this.term },
            })
          );
          // this.sendNodeData(socket);
        }
      });
    }, MIN_HEART_BEAT_DURATION);
  }

  sendNodeData(socket) {
    socket.send(
      JSON.stringify({
        type: MESSAGE_TYPE.response_node_data,
        data: {
          term: this.term,
          device: "",
          wallet: this.wallet.publicKey,
          nodeState: this.nodeState,
          transactionPool: this.transactionPool.transactions,
          blockchain: this.blockchain.chain,
          pbftStaus: this.pbftStatus,
        },
      })
    );
  }

  // handles any message sent to the current node
  messageHandler(socket, index) {
    // Request sync
    socket.send(
      JSON.stringify({
        type: MESSAGE_TYPE.sync_request,
      })
    );

    // registers message handler
    socket.on("message", (message) => {
      const data = JSON.parse(message);

      // console.log("RECEIVED", data.type);

      // select a perticular message handler
      switch (data.type) {
        case MESSAGE_TYPE.secret:
          this.secrets[data?.from] = data?.secret;
          global.__secrets = Object.values(this.secrets);

          this.validators.generateAddresses();
          this.blockchain.updateValidatorList();

          break;
        case MESSAGE_TYPE.sync_request:
          socket.send(
            JSON.stringify({
              type: MESSAGE_TYPE.sync_data,
              term: this.term,
              // transactionPool: this.transactionPool.transactions,
              blockchain: this.blockchain.chain,
            })
          );
          // this.sendNodeData(socket);
          break;
        case MESSAGE_TYPE.sync_data:
          // @note Need to optimize in future
          this.term = data.term;
          // this.transactionPool.transactions = data.transactionPool;
          // this.transactionPool.writeTransactionToFile();
          this.blockchain.chain = data.blockchain;
          this.blockchain.writeBlockToFile();
          break;
        case MESSAGE_TYPE.transaction:
          // check if transactions is valid
          if (
            !this.transactionPool.transactionExists(data.transaction) &&
            this.transactionPool.verifyTransaction(data.transaction) &&
            this.validators.isValidValidator(data.transaction.from)
          ) {
            let thresholdReached = this.transactionPool.addTransaction(
              data.transaction
            );
            // send transactions to other nodes
            this.broadcastTransaction(data.transaction);

            // check if limit reached
            if (thresholdReached) {
              console.log("TRANSACTION THRESHOLD REACHED.");

              // check the current node is the proposer
              // console.log(
              //   this.blockchain.getProposer(),
              //   "============",
              //   this.wallet.getPublicKey()
              // );
              if (this.blockchain.getProposer() == this.wallet.getPublicKey()) {
                console.log("PROPOSING NEW BLOCK REQUEST.");

                // if the node is the proposer, create a block and broadcast it
                let block = this.blockchain.createBlock(
                  this.transactionPool.transactions,
                  this.wallet
                );
                console.log("NEW BLOCK CREATED FROM TRANSACTION's.");
                this.broadcastPrePrepare(block);
              }
            } else {
              console.log("NEW TRANSACTION ADDED.");
            }
          }
          break;
        case MESSAGE_TYPE.pre_prepare:
          // check if block is valid
          if (
            !this.blockPool.exisitingBlock(data.block) &&
            this.blockchain.isValidBlock(data.block)
          ) {
            // add block to pool
            this.blockPool.addBlock(data.block);

            // send to other nodes
            this.broadcastPrePrepare(data.block);

            // create and broadcast a prepare message
            let prepare = this.preparePool.prepare(data.block, this.wallet);
            this.broadcastPrepare(prepare);
          }
          break;
        case MESSAGE_TYPE.prepare:
          // check if the prepare message is valid
          if (
            this.preparePool.existingPrepare(data.prepare) &&
            this.preparePool.isValidPrepare(data.prepare, this.wallet) &&
            this.validators.isValidValidator(data.prepare.publicKey)
          ) {
            // add prepare message to the pool
            this.preparePool.addPrepare(data.prepare);

            // send to other nodes
            this.broadcastPrepare(data.prepare);

            // if no of prepare messages reaches minimum required
            // send commit message
            if (
              this.preparePool.list[data?.prepare?.blockHash]?.length >=
              global.__minApprovals(this.validators.list.length - 1)
            ) {
              let commit = this.commitPool.commit(data.prepare, this.wallet);
              this.broadcastCommit(commit);
            }
          }
          break;
        case MESSAGE_TYPE.commit:
          // check the validity commit messages
          if (
            this.commitPool.existingCommit(data.commit) &&
            this.commitPool.isValidCommit(data.commit) &&
            this.validators.isValidValidator(data.commit.publicKey)
          ) {
            // add to pool
            this.commitPool.addCommit(data.commit);

            // send to other nodes
            this.broadcastCommit(data.commit);

            // if no of commit messages reaches minimum required
            // add updated block to chain
            if (
              this.commitPool.list[data.commit.blockHash].length >=
              global.__minApprovals(this.validators.list.length - 1)
            ) {
              this.blockchain.addUpdatedBlock(
                data.commit.blockHash,
                this.blockPool,
                this.preparePool,
                this.commitPool
              );
            }
            // Send a round change message to nodes
            let message = this.messagePool.createMessage(
              this.blockchain.chain[this.blockchain.chain.length - 1].hash,
              this.wallet
            );
            this.broadcastRoundChange(message);
          }
          break;
        case MESSAGE_TYPE.round_change:
          // check the validity of the round change message
          if (
            !this.messagePool.existingMessage(data.message) &&
            this.messagePool.isValidMessage(data.message) &&
            this.validators.isValidValidator(data.message.publicKey)
          ) {
            // add to pool
            this.messagePool.addMessage(data.message);

            // send to other nodes
            this.broadcastRoundChange(data.message);

            // if enough messages are received, clear the pools
            if (
              this.messagePool.list[data.message.blockHash].length >=
              global.__minApprovals(this.validators.list.length - 1)
            ) {
              this.transactionPool.clear();
            }
          }
          break;
        case MESSAGE_TYPE.sync_heart_beat:
          this.syncHeartBeatFromLeader(data.message);
          break;
        case MESSAGE_TYPE.vote_request:
          this.sentVoteResponseToNode(socket, data.message);
          break;
        case MESSAGE_TYPE.vote_response:
          this.receivedVoteFromNode(data.message);
          break;
        case MESSAGE_TYPE.get_peer_stats:
          this.peerStats[data?.message?.peerName] = data?.message;
          break;
      }
    });
  }
}

module.exports = P2pserver;
