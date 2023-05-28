// Import the wallet class
const Wallet = require("./wallet");

class Validators {
  list = [];

  // constructor will take an argument which is the number of nodes in the network
  constructor() {
    this.generateAddresses();
  }

  // This function generates wallets and their public key
  // The secret key has been known for demonstration purposes
  // Secret will be passed from command line to generate the same wallet again
  // As a result the same public key will be generatedd
  generateAddresses() {
    let list = [];

    [global.__secret, ...global.__secrets].forEach((secret) => {
      // console.log(secret, "secret-----");
      list.push(new Wallet(secret).getPublicKey());
    });

    // console.log(list, "public key");

    this.list = [...list].sort();

    // console.log(this.list, "list");

    return this.list;
  }

  // This function verfies if the passed public key is a known validator or not
  isValidValidator(validator) {
    return this.list.includes(validator);
  }
}
module.exports = Validators;
