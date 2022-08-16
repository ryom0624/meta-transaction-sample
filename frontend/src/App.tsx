import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./App.css";

import contractJson from "./utils/VoteByMetaTransaction.json";
import { VoteByMetaTransaction } from "../../typechain-types";

function App() {
  const [currentAccount, setCurrentAccount] = useState();

  const [lastProposalId, setLastProposalId] = useState();
  const [proposals, setProposals] = useState<VoteByMetaTransaction.VoteStruct[][]>([]);
  const [voteTransactionStorage, setVoteTransactionStorage] = useState<VoteByMetaTransaction.VoteStorageWithEncodedStruct[]>([]);

  const [relayer, setRelayer] = useState("");
  const [relayerAmount, setRelayerAmount] = useState("");
  const [receipt, setReceipt] = useState("");

  // ローカルノード前提
  // ローカルnode立ち上げで出てくるコントラクトアドレス
  const contractAddr = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const abi = contractJson.abi;

  // ローカルノード前提
  // ローカルnode立ち上げで出てくるAccount#0のprivkeyを入れる
  const privkey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window as any;
      if (!ethereum) {
        console.log("Please Install MetaMask🙇‍♂️");
        return;
      }

      console.log("Welcome to MetaMask User🎉");

      const accounts = await ethereum.request({
        method: "eth_accounts",
      });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account: ", account);
        setCurrentAccount(account);
      } else {
        console.log("No authorized acount found!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const initRelayer = async () => {
    try {
      const { ethereum } = window as any;
      if (ethereum) {
        const provider: ethers.providers.Web3Provider = new ethers.providers.Web3Provider(ethereum);
        const wallet = new ethers.Wallet(privkey, provider);
        const addr = await wallet.getAddress();
        setRelayer(addr);

        const amount = ethers.utils.formatUnits(await provider.getBalance(addr), "ether");
        setRelayerAmount(amount);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isConnected = async () => {
    const { ethereum } = window as any;
    if (!ethereum) {
      return;
    }
    if (ethereum.isConnected()) {
      console.log("connected");
    }
  };

  const getProposalId = async () => {
    try {
      const { ethereum } = window as any;
      const provider: ethers.providers.Web3Provider = new ethers.providers.Web3Provider(ethereum);
      const signer: ethers.providers.JsonRpcSigner = provider.getSigner();
      const contract = new ethers.Contract(contractAddr, abi, signer);
      console.log(contract);
      const lastProposalId = await contract.lastProposalId();
      console.log(lastProposalId.toString());

      setLastProposalId(lastProposalId.toString());
    } catch (e) {
      console.error(e);
    }
  };

  const getProposalResults = async () => {
    try {
      const { ethereum } = window as any;
      const provider: ethers.providers.Web3Provider = new ethers.providers.Web3Provider(ethereum);
      const signer: ethers.providers.JsonRpcSigner = provider.getSigner();
      const contract = new ethers.Contract(contractAddr, abi, signer);
      if (lastProposalId) {
        for (var i = 1; i < lastProposalId; i++) {
          const proposal = await contract.getVotes(i);
          console.log(proposal);
          // setProposals([...proposals, proposal])
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window as any;
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connect to account: ", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (e) {
      console.error(e);
    }
  };

  const createVote = async (signer: ethers.providers.JsonRpcSigner, flag: boolean): Promise<VoteByMetaTransaction.VoteStruct> => {
    const signerAddr = await signer.getAddress();
    const nonce = await signer.getTransactionCount();

    if (!lastProposalId) {
      console.log("no proposalId");
      return Promise.reject("no proposalId");
    }

    const tx: VoteByMetaTransaction.VoteStruct = {
      signer: signerAddr,
      id: lastProposalId,
      nonce: nonce,
      flag: flag,
      message: signerAddr + " signning with vote on " + flag,
    };

    return tx;
  };

  const sign = async (flag: boolean) => {
    const { ethereum } = window as any;
    if (ethereum) {
      const provider: ethers.providers.Web3Provider = new ethers.providers.Web3Provider(ethereum);
      const signer: ethers.providers.JsonRpcSigner = provider.getSigner();
      const vote = await createVote(signer, flag);
      const contract = new ethers.Contract(contractAddr, abi, signer);
      // console.log(contract)
      // console.log(contract.address)
      const getMessageHash = await contract.getMessageHashFromVoteHelper(vote);
      // console.log(getMessageHash);
      const sig = await signer.signMessage(ethers.utils.arrayify(getMessageHash));

      const encodedVote = await contract.encodeVote(vote.signer, vote.id, vote.nonce, vote.flag, vote.message);

      setVoteTransactionStorage([
        ...voteTransactionStorage,
        {
          signature: sig,
          signer: await signer.getAddress(),
          encodedVote: encodedVote,
        },
      ]);
    }
  };
  const confirmVoting = async () => {
    const { ethereum } = window as any;
    if (ethereum) {
      const provider: ethers.providers.Web3Provider = new ethers.providers.Web3Provider(ethereum);
      const signer = new ethers.Wallet(privkey, provider);
      console.log(signer);
      const contract = new ethers.Contract(contractAddr, abi, signer);

      if (!lastProposalId) {
        console.log("no proposalId");
        return;
      }

      const result = await contract.confirmingVotes(lastProposalId, voteTransactionStorage);

      const receipt = await result.wait();
      console.log(receipt);

      const amount = ethers.utils.formatUnits(await provider.getBalance(relayer), "ether");
      setRelayerAmount(amount);

      setReceipt(receipt.transactionHash);

      const newProposalId = await contract.lastProposalId();
      console.log(newProposalId);
      setLastProposalId(newProposalId.toString());

      setVoteTransactionStorage([]);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
    isConnected();
    initRelayer();
    getProposalId();
    getProposalResults();

    const { ethereum } = window as any;

    if (typeof ethereum !== "undefined") {
      ethereum.on("accountsChanged", (accountNo: any) => {
        setCurrentAccount(accountNo[0]);
      });
    }
  });

  return (
    <div className="App">
      <div>
        <h1>Hello Off-chain Vote</h1>
        <div>
          {!currentAccount && (
            <button className="button" onClick={connectWallet}>
              Connect to MetaMask
            </button>
          )}
          <p>Connected Address: {currentAccount}</p>
        </div>
        <hr />
        <div>
          {lastProposalId === "1" && <p>まだ投票がありません。</p>}
          <ul>
            {/* {proposals.map(proposal => {
              <li>
                {proposal.id} {proposal.signer}
              </li>;
            })} */}
          </ul>
        </div>
        <hr />
        <div>
          <p>現在のProposal: {lastProposalId}</p>
          <button className="button" onClick={() => sign(true) as any}>
            Yesに投票
          </button>
          <button className="button" onClick={() => sign(false) as any}>
            Noに投票
          </button>
          <div>
            signatures:
            <ul>
              {voteTransactionStorage.map((vote) => (
                <>
                  <li>
                    {String(vote.signature)} <br /> by {vote.signer}
                  </li>
                </>
              ))}
            </ul>
          </div>
        </div>
        <hr />
        <div>
          <p>
            Relayer: {relayer} / {relayerAmount} ETH
          </p>
          <button className="button" onClick={() => confirmVoting() as any}>
            confirm Voting
          </button>
          <p>TxHash: {receipt}</p>
        </div>
      </div>
    </div>
  );
}

export default App;
