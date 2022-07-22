import { expect } from "chai";
import "@nomiclabs/hardhat-ethers";
import { ethers, deployments } from "hardhat";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { VoteByMetaTransaction } from "../typechain-types";

describe("VoteByMetaTransaction", async () => {
  let accounts: SignerWithAddress[];
  let voteContract: VoteByMetaTransaction;
  let relayer: SignerWithAddress;
  let voteTransactionStorage = new Map<string, VoteByMetaTransaction.VoteStorageWithEncodedStruct[]>;

  const createVoteTransaction = async (signer:SignerWithAddress, id:number, flag:boolean) :Promise<VoteByMetaTransaction.VoteStruct> => {
    return  {
      signer: signer.address,
      id: id,
      nonce: await signer.getTransactionCount("latest"),
      flag: flag,
      message: "Hello MetaTransaction from " + signer.address,
    }
  }

  // const signTransaction = async(signer: SignerWithAddress, Vote: VoteByMetaTransaction.VoteStruct): Promise<string> => {
  //   // const encodedvote3 = await vote.encodeTransaction(Vote.to, Vote.signer, Vote.nonce ,Vote.flag, Vote.message);
  //   const messageHash3 = await vote.getMessageHash(Vote.signer, Vote.id, Vote.nonce ,Vote.flag, Vote.message);
  //   const ethSignedMessage3 = await vote.getEthSignedMessageHash(messageHash3);
  //   return await signer.signMessage(ethSignedMessage3);
  // }


  before(async () => {
    accounts = await ethers.getSigners();
    relayer = accounts[0];

    const { VoteByMetaTransaction } = await deployments.fixture(["VoteByMetaTransaction"]);

    voteContract = (await ethers.getContractAt(
      "VoteByMetaTransaction",
      VoteByMetaTransaction.address,
      relayer
    )) as VoteByMetaTransaction;

    console.log("relayer:" , relayer.address)
    console.log("contract:" , voteContract.address)
    console.log("accounts[1]:" , accounts[1].address)
    console.log("accounts[2]:" , accounts[2].address)
    console.log("accounts[3]:" , accounts[3].address)

    /*
      Transaction 1
    */
    const vote1: VoteByMetaTransaction.VoteStruct = await createVoteTransaction(accounts[1], 1, true)
    const messageHash1 = await voteContract.connect(accounts[1]).getMessageHashFromVoteHelper(vote1);
    const signature1 = await accounts[1].signMessage(ethers.utils.arrayify(messageHash1));


    /*
      Transaction 2
    */
    const vote2: VoteByMetaTransaction.VoteStruct = await createVoteTransaction(accounts[2], 1, false)
    const messageHash2 = await voteContract.connect(accounts[2]).getMessageHashFromVoteHelper(vote2);
    const signature2 = await accounts[2].signMessage(ethers.utils.arrayify(messageHash2));



    /*
    Transaction 3
    */
    const vote3: VoteByMetaTransaction.VoteStruct = await createVoteTransaction(accounts[3], 1, true)
    const messageHash3 = await voteContract.connect(accounts[3]).getMessageHashFromVoteHelper(vote3);
    const signature3 = await accounts[3].signMessage(ethers.utils.arrayify(messageHash3));


    // const decodedvote1 = await voteContract.decodeVote(encodedvote1);
    // const decodedvote2 = await voteContract.decodeVote(encodedvote2);
    // const decodedvote3 = await voteContract.decodeVote(encodedvote3);

    // console.log("vote1: ", decodedvote1)
    // console.log("vote2: ", decodedvote2)
    // console.log("vote3: ", decodedvote3)

    const encodedvote1 = await voteContract.connect(accounts[1]).encodeVote(vote1.signer, vote1.id, vote1.nonce ,vote1.flag, vote1.message);
    const encodedvote2 = await voteContract.connect(accounts[2]).encodeVote(vote2.signer, vote2.id, vote2.nonce ,vote2.flag, vote2.message);
    const encodedvote3 = await voteContract.connect(accounts[3]).encodeVote(vote3.signer, vote3.id, vote3.nonce ,vote3.flag, vote3.message);
    voteTransactionStorage.set("1",
      [
        {
          signature: signature1,
          signer: accounts[1].address,
          encodedVote: encodedvote1,
        },
        {
          signature: signature2,
          signer: accounts[2].address,
          encodedVote: encodedvote2,
        },
        {
          signature: signature3,
          signer: accounts[3].address,
          encodedVote: encodedvote3,
        },
      ]
    );

  });

  it("signed transacions can verify from signer", async () => {

    const voteId1 = voteTransactionStorage.get("1")
    if (voteId1) {
      // console.log(Vote);
      await voteContract.connect(relayer).confirmingVotes(1, voteId1)
      expect(await voteContract.getVerifiedVotes(1, accounts[1].address)).to.be.equal(true)
      expect(await voteContract.getVerifiedVotes(1, accounts[2].address)).to.be.equal(false)
      expect(await voteContract.getVerifiedVotes(1, accounts[3].address)).to.be.equal(true)
    } else {
      console.log("no test");
    }

  });
})