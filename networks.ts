import { NetworksUserConfig } from "hardhat/types";
import dotenv from 'dotenv';

dotenv.config();

const networks: NetworksUserConfig = {};

if (process.env.PRIVATE_KEY) {
  networks.rinkeby = {
    chainId: 4,
    url: process.env.RINKEBY_RPC,
    accounts: [process.env.PRIVATE_KEY]
  };
  networks.goerli = {
    chainId: 5,
    url: process.env.RINKEBY_RPC,
    accounts: [process.env.PRIVATE_KEY]
  };
  networks.hardhat = {
    chainId: 31337,
  };
} else {
  networks.hardhat = {}
}

export default networks;