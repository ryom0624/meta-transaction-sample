import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./App.css";

function App() {
  const [currentAccount, setCurrentAccount] = useState();

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

  const isConnected = async () => {
    const { ethereum } = window as any;
    if (!ethereum) {
      return;
    }
    if (ethereum.isConnected()) {
      console.log("connected");
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

  useEffect(() => {
    checkIfWalletIsConnected();
    isConnected();
  });

  return (
    <div className="App">
      <div>
        <h1>Hello MetaMask</h1>
        <div>
          {!currentAccount && (
            <button className="button" onClick={connectWallet}>
              Connect to MetaMask
            </button>
          )}
        </div>
        <hr />
        <div></div>
      </div>
    </div>
  );
}

export default App;
