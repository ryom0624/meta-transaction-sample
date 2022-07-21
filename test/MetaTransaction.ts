import { expect } from "chai";
import "@nomiclabs/hardhat-ethers";
import { ethers, deployments } from "hardhat";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { MetaTransaction } from "../typechain-types";


describe("MetaTransaction", async () => {
  let accounts: SignerWithAddress[];
  let metaTx: MetaTransaction;
  let relayer: SignerWithAddress;
  let transactionStorage = new Map<string, MetaTransaction.TransactionStorageWithEncodedTransactionStruct[]>;

  const createTransaction = async (signer:SignerWithAddress, flag:boolean) :Promise<MetaTransaction.TransactionStruct> => {
    return  {
      to: metaTx.address,
      signer: signer.address,
      nonce: await signer.getTransactionCount("latest"),
      flag: flag,
      message: "Hello MetaTransaction from " + signer.address,
    }
  }

  const signTransaction = async(signer: SignerWithAddress, tx: MetaTransaction.TransactionStruct): Promise<string> => {
    // const encodedTx3 = await metaTx.encodeTransaction(tx.to, tx.signer, tx.nonce ,tx.flag, tx.message);
    const messageHash3 = await metaTx.getMessageHash(tx.to, tx.signer, tx.nonce ,tx.flag, tx.message);
    const ethSignedMessage3 = await metaTx.getEthSignedMessageHash(messageHash3);
    return await signer.signMessage(ethSignedMessage3);
  }


  before(async () => {
    accounts = await ethers.getSigners();
    relayer = accounts[0];

    const { MetaTransaction } = await deployments.fixture(["MetaTransaction"]);

    metaTx = (await ethers.getContractAt(
      "MetaTransaction",
      MetaTransaction.address,
      relayer
    )) as MetaTransaction;

    console.log("relayer:" , relayer.address)
    console.log("contract:" , metaTx.address)
    console.log("accounts[1]:" , accounts[1].address)
    console.log("accounts[2]:" , accounts[2].address)
    console.log("accounts[3]:" , accounts[3].address)

    /*
      Transaction 1
    */

    const tx1: MetaTransaction.TransactionStruct = await createTransaction(accounts[1], true)
    const encodedTx1 = await metaTx.connect(accounts[1]).encodeTransaction(tx1.to, tx1.signer, tx1.nonce ,tx1.flag, tx1.message);
    const messageHash1 = await metaTx.connect(accounts[1]).getMessageHash(tx1.to, tx1.signer, tx1.nonce ,tx1.flag, tx1.message);
    const ethSignedMessage1 = await metaTx.connect(accounts[1]).getEthSignedMessageHash(messageHash1);
    const signature1 = await accounts[1].signMessage(ethSignedMessage1);

    /*
      Transaction 2
    */
    const tx2: MetaTransaction.TransactionStruct = await createTransaction(accounts[2], false)
    const encodedTx2 = await metaTx.connect(accounts[2]).encodeTransaction(tx2.to, tx2.signer, tx2.nonce ,tx2.flag, tx2.message);
    const messageHash2 = await metaTx.connect(accounts[2]).getMessageHash(tx2.to, tx2.signer, tx2.nonce ,tx2.flag, tx2.message);
    const ethSignedMessage2 = await metaTx.connect(accounts[2]).getEthSignedMessageHash(messageHash2);
    const signature2 = await accounts[2].signMessage(ethSignedMessage2);


    /*
      Transaction 3
    */
    const tx3: MetaTransaction.TransactionStruct = await createTransaction(accounts[3], true)
    const encodedTx3 = await metaTx.connect(accounts[3]).encodeTransaction(tx3.to, tx3.signer, tx3.nonce ,tx3.flag, tx3.message);
    const messageHash3 = await metaTx.connect(accounts[3]).getMessageHash(tx3.to, tx3.signer, tx3.nonce ,tx3.flag, tx3.message);
    const ethSignedMessage3 = await metaTx.connect(accounts[3]).getEthSignedMessageHash(messageHash3);
    const signature3 = await accounts[3].signMessage(ethSignedMessage3);

    // const decodedTx1 = await metaTx.decodeTransaction(encodedTx1);
    // const decodedTx2 = await metaTx.decodeTransaction(encodedTx2);
    // const decodedTx3 = await metaTx.decodeTransaction(encodedTx3);

    // console.log("tx1: ", decodedTx1)
    // console.log("tx2: ", decodedTx2)
    // console.log("tx3: ", decodedTx3)

    transactionStorage.set("1",
      [
        {
          signature: signature1,
          signer: accounts[1].address,
          ethSignedHash: ethSignedMessage1,
          encodedTransaction: encodedTx1,
        },
        {
          signature: signature2,
          signer: accounts[2].address,
          ethSignedHash: ethSignedMessage2,
          encodedTransaction: encodedTx2,
        },
        {
          signature: signature3,
          signer: accounts[3].address,
          ethSignedHash: ethSignedMessage3,
          encodedTransaction: encodedTx3,
        },
      ]
    );

  });

  it("signed transacions can verify from signer", async () => {

    const tx = transactionStorage.get("1")
    if (tx) {
      // console.log(tx)
      console.log(await metaTx.verifyTx(tx))
      // console.log(await metaTx.getVerifiedTransactions())
    } else {
      console.log("no test");
    }

  });
})