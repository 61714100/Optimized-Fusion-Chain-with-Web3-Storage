// Import transaction class used for verification
const fs = require("fs");
const path = require("path");
const Transaction = require("./transaction");

// Transaction threshold is the limit or the holding capacity of the nodes
// Once this exceeds a new block is generated
const { TRANSACTION_THRESHOLD } = require("./config");
const TRANSACTION_PATH = path.join(
  global.__projectname,
  "data",
  `transaction.txt`
);

class TransactionPool {
  constructor() {
    // @note Need to optimize in future
    if (fs.existsSync(TRANSACTION_PATH)) {
      const data = fs.readFileSync(TRANSACTION_PATH);
      const transactionFromFile = JSON.parse(data?.toString() || "[]");
      this.transactions = transactionFromFile;
    } else {
      this.transactions = [];
      this.writeTransactionToFile();
    }
  }

  // pushes transactions in the list
  // returns true if it is full
  // else returns false
  addTransaction(transaction) {
    this.transactions.push(transaction);
    this.writeTransactionToFile();
    if (this.transactions.length >= TRANSACTION_THRESHOLD) {
      return true;
    } else {
      return false;
    }
  }

  // Persist transaction locally
  writeTransactionToFile() {
    fs.writeFileSync(TRANSACTION_PATH, JSON.stringify(this.transactions));
  }

  // wrapper function to verify transactions
  verifyTransaction(transaction) {
    return Transaction.verifyTransaction(transaction);
  }

  // checks if transactions exists or not
  transactionExists(transaction) {
    let exists = this.transactions.find(
      (t) => t.uniqueId === transaction.uniqueId
    );
    return exists ? true : false;
  }

  // empties the pool
  clear() {
    console.log("TRANSACTION POOL CLEARED");
    this.transactions = [];
    this.writeTransactionToFile();
  }
}

module.exports = TransactionPool;
