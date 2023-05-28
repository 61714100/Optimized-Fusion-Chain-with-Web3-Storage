// Import total number of nodes used to create validators list
const { NUMBER_OF_NODES } = require("./config");

// Used to verify block
const fs = require("fs");
const path = require("path");
const Block = require("./block");
const BLOCKCHAIN_PATH = path.join(
  global.__projectname,
  "data",
  `blockchain.txt`
);

class Blockchain {
  validators = null;
  validatorList = [];

  // the constructor takes an argument validators class object
  // this is used to create a list of validators
  constructor(validators) {
    this.validators = validators;
    this.updateValidatorList();

    // @note Need to optimize in future
    if (fs.existsSync(BLOCKCHAIN_PATH)) {
      const data = fs.readFileSync(BLOCKCHAIN_PATH);
      const blockFromFile = JSON.parse(data?.toString() || "[]");
      if (blockFromFile.length !== 0) {
        this.chain = blockFromFile;
        return;
      }
    }

    this.chain = [Block.genesis()];
    this.writeBlockToFile();
  }

  updateValidatorList() {
    this.validatorList = this.validators.generateAddresses();
  }

  // pushes confirmed blocks into the chain
  addBlock(block) {
    let isExists = false;
    this.chain.forEach((each) => {
      if (each.hash === block.hash) {
        isExists = true;
      }
    });

    if (!isExists) {
      this.chain.push(block);
      this.writeBlockToFile();
      console.log("NEW BLOCK ADDED TO BLOCKCHAIN.");
      return block;
    }
    return null;
  }

  // Persist blockchain locally
  writeBlockToFile() {
    fs.writeFileSync(BLOCKCHAIN_PATH, JSON.stringify(this.chain));
  }

  // wrapper function to create blocks
  createBlock(transactions, wallet) {
    const block = Block.createBlock(
      this.chain[this.chain.length - 1],
      transactions,
      wallet
    );
    return block;
  }

  // calculates the next propsers by calculating a random index of the validators list
  // index is calculated using the hash of the latest block
  getProposer() {
    this.updateValidatorList();

    let index =
      this.chain[this.chain.length - 1].hash[0].charCodeAt(0) %
      (this.validatorList.length - 1);

    // console.log(this.validatorList, "validatorList----blockchain");
    // console.log(index, "index----blockchain");

    // const validator = this.validatorList.find((validator) => {
    //   const lastFourDigit = validator.substring(validator.length - 4);
    //   const sumWithInitial = lastFourDigit
    //     .split("")
    //     .map((e) => e.charCodeAt())
    //     .reduce((accumulator, currentValue) => accumulator + currentValue, 0);

    //   return sumWithInitial % (this.validatorList.length - 1) === index;
    // });

    // console.log(this.validatorList[index], "validator");

    return this.validatorList[index];
  }

  // checks if the received block is valid
  isValidBlock(block) {
    const lastBlock = this.chain[this.chain.length - 1];
    if (
      lastBlock.sequenceNo + 1 == block.sequenceNo &&
      block.lastHash === lastBlock.hash &&
      block.hash === Block.blockHash(block) &&
      Block.verifyBlock(block) &&
      Block.verifyProposer(block, this.getProposer())
    ) {
      console.log("BLOCK IS VALID");
      return true;
    } else {
      console.log("BLOCK IS INVLAID");
      return false;
    }
  }

  // updates the block by appending the prepare and commit messages to the block
  addUpdatedBlock(hash, blockPool, preparePool, commitPool) {
    let block = blockPool.getBlock(hash);
    block.prepareMessages = preparePool.list[hash];
    block.commitMessages = commitPool.list[hash];
    this.addBlock(block);
  }
}
module.exports = Blockchain;
