import { expect } from "chai";
import "@nomiclabs/hardhat-ethers";
import { ethers, deployments } from "hardhat";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Greeter } from "../typechain-types";

describe("Greeter", async () => {
  let signer: SignerWithAddress;
  let greeter: Greeter;

  beforeEach(async () => {
    const { Greeter } = await deployments.fixture([
      "Greeter"
    ]);

    greeter = (await ethers.getContractAt(
      "Greeter",
      Greeter.address,
      signer
    )) as Greeter;

    signer = (await ethers.getSigners())[0];
  });

  it("default greeting value is 'Hello'", async () => {
    expect(await greeter.connect(signer).greet()).to.be.equal("Hello");
  });

  it("change value to 'Hola'", async () => {
    expect(await greeter.connect(signer).greet()).to.be.equal("Hello");
    await greeter.connect(signer).setGreeting("Hola");
    expect(await greeter.connect(signer).greet()).to.be.equal("Hola");
  })
})