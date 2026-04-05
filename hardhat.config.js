require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x" + "0".repeat(64);

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    etherlink: {
      url: "https://node.mainnet.etherlink.com",
      chainId: 42793,
      accounts: [PRIVATE_KEY],
    },
    shadownet: {
      url: "https://node.shadownet.etherlink.com",
      chainId: 127823,
      accounts: [PRIVATE_KEY],
    },
  },
};
