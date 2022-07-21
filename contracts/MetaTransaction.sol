pragma solidity ^0.8.9;

import "hardhat/console.sol";

contract MetaTransaction {

    struct TransactionStorageWithEncodedTransaction {
        bytes signature;
        address signer;
        bytes ethSignedHash;
        bytes encodedTransaction;
    }

    struct TransactionStorage {
        bytes signature;
        address signer;
        Transaction transaction;
    }

    struct Transaction {
        address to;
        address signer;
        uint nonce;
        bool flag;
        string message;
    }

    // Transaction[] public transactions;

    function getMessageHash(
        address _to,
        address _signer,
        uint _nonce,
        bool _flag,
        string memory _message
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(_to, _signer, _nonce, _flag, _message));
    }

    function getEthSignedMessageHash(bytes32 _messageHash)
        public
        pure
        returns (bytes32)
    {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _messageHash));
    }

    // function getVerifiedTransactions() public view returns(Transaction[] memory) {
    //     return transactions;
    // }

    /*
        ethSignedHashいらないかもしれない。
    */
    function verifyTx(
        TransactionStorageWithEncodedTransaction[] calldata txesWithEncoded
    ) public pure returns(bool) {
        bool isValid = true;
        for (uint i = 0; i < txesWithEncoded.length; i++) {
            Transaction memory decodedTx = decodeTransaction(txesWithEncoded[i].encodedTransaction);
            bool ok = verify(decodedTx.to, decodedTx.signer, decodedTx.nonce, decodedTx.flag, decodedTx.message, txesWithEncoded[i].signature);
            if (ok) {
                isValid = false;
            }
        }
        return isValid;
    }

    function verify(
        address _to,
        address _signer,
        uint _nonce,
        bool _flag,
        string memory _message,
        bytes memory signature
    ) public pure returns (bool) {
        bytes32 messageHash = getMessageHash(_to, _signer, _nonce, _flag, _message);
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);

        return recoverSigner(ethSignedMessageHash, signature) == _signer;
    }

    function recoverSigner(bytes32 _ethSignedMessageHash, bytes memory _signature)
        public
        pure
        returns (address)
    {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);
        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

    function splitSignature(bytes memory sig)
        public
        pure
        returns (
            bytes32 r,
            bytes32 s,
            uint8 v
        )
    {
        require(sig.length == 65, "invalid signature length");

        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }


    function encodeTransaction(
        address _to,
        address _signer,
        uint _nonce,
        bool _flag,
        string memory _message
    ) public pure returns (bytes memory) {
        Transaction memory transaction = Transaction({
            to: _to,
            signer: _signer,
            nonce: _nonce,
            flag: _flag,
            message: _message
        });
        return abi.encode(transaction);
    }

    function decodeTransaction(
        bytes calldata encodedTransaction
    ) public pure returns (Transaction memory decodedTx) {
        (decodedTx) = abi.decode(encodedTransaction, (Transaction));
        return decodedTx;
    }

}