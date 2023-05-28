const fs = require("fs");
const path = require("path");
const { SHA256, enc } = require("crypto-js");
// Import the ChainUtil class used for hashing and verification
const ChainUtil = require("./chain-util");
// Import transaction class  used for creating transactions
const Transaction = require("./transaction");

const secretpath = path.join(global.__projectname, "data", "secret.txt");

class Wallet {
  // The secret phase is passed an argument when creating a wallet
  // The keypair generated for a secret phrase is always the same
  constructor(secret) {
    if (secret) {
      this.keyPair = ChainUtil.genKeyPair(secret);
      this.publicKey = this.keyPair.getPublic("hex");
    } else {
      let secret = "";
      if (!fs.existsSync(secretpath)) {
        secret = SHA256(new Date().toISOString()).toString();
        fs.writeFileSync(secretpath, secret);
        console.log("PUBLIC KEY GENERATED SUCCESSFULLY.");
      } else {
        secret = fs.readFileSync(secretpath).toString("utf-8");
      }

      global.__secret = secret;

      this.keyPair = ChainUtil.genKeyPair(secret);
      this.publicKey = this.keyPair.getPublic("hex");
    }
  }

  // Used for prining the wallet details
  toString() {
    return `Wallet - 
            publicKey: ${this.publicKey.toString()}`;
  }

  // Used for signing data hashes
  sign(dataHash) {
    return this.keyPair.sign(dataHash).toHex();
  }

  // Creates and returns transactions
  createTransaction(data) {
    return new Transaction(data, this);
  }

  // Return public key
  getPublicKey() {
    return this.publicKey;
  }
}

module.exports = Wallet;
