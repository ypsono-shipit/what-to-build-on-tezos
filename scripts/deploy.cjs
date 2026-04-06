const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "XTZ");

  const WhatToBuild = await hre.ethers.getContractFactory("WhatToBuild");
  const contract = await WhatToBuild.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("WhatToBuild deployed to:", address);
}

main().catch((e) => { console.error(e); process.exit(1); });
