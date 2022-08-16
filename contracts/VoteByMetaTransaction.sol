pragma solidity ^0.8.9;

import "hardhat/console.sol";

/*
const Contract = await ethers.getContractFactory("VoteByMetaTransaction")
const contract = await Contract.deploy()
await contract.

*/

contract VoteByMetaTransaction {

    uint public lastProposalId = 1;

    mapping (uint => mapping(address => bool)) public voteResults;
    mapping (uint => Vote[]) public votes;

    struct VoteStorageWithEncoded {
        bytes signature;
        address signer;
        bytes encodedVote;
    }

    struct VoteStorage {
        bytes signature;
        address signer;
        Vote vote;
    }

    struct Vote {
        address signer;
        uint id;
        uint nonce;
        bool flag; // todo: not boolean
        string message;
    }

    function getVotes(uint _proposalId) public view returns (Vote[] memory) {
        return votes[_proposalId];
    }

    // helper function
    function getMessageHashFromVoteHelper(
        Vote memory _vote
    ) public pure returns (bytes32) {
        return getMessageHash(_vote.signer, _vote.id, _vote.nonce, _vote.flag, _vote.message);
    }


    function getMessageHash(
        address _signer,
        uint _voteId,
        uint _nonce,
        bool _flag,
        string memory _message
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(_signer,_voteId, _nonce, _flag, _message));
    }


    function getEthSignedMessageHash(bytes32 _messageHash)
        public
        pure
        returns (bytes32)
    {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _messageHash));
    }

    function getVerifiedVotes(uint _id, address voter) public view returns(bool flag) {
        return voteResults[_id][voter];
    }


    function confirmingVotes(
        uint _voteId,
        VoteStorageWithEncoded[] calldata votesWithEncoded
    ) public {
        require(votesWithEncoded.length > 0, "invalid length");

        for (uint i = 0; i < votesWithEncoded.length; i++) {
            Vote memory decodedVote = decodeVote(votesWithEncoded[i].encodedVote);
            bool ok = verify(decodedVote.signer, decodedVote.id, decodedVote.nonce, decodedVote.flag, decodedVote.message, votesWithEncoded[i].signature);
            require(ok, "includes invalid voting");
            // Todo: HIGH Gas Fee
            voteResults[_voteId][decodedVote.signer] = decodedVote.flag;
            votes[_voteId].push(Vote({
                signer: decodedVote.signer,
                id: decodedVote.id,
                nonce: decodedVote.nonce,
                flag: decodedVote.flag,
                message: decodedVote.message
            }));

        }
        lastProposalId++;
    }

    function verify(
        address _signer,
        uint _voteId,
        uint _nonce,
        bool _flag,
        string memory _message,
        bytes memory signature
    ) public pure returns (bool) {
        bytes32 messageHash = getMessageHash(_signer,_voteId,  _nonce, _flag, _message);
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

    function encodeVote(
        address _signer,
        uint _id,
        uint _nonce,
        bool _flag,
        string memory _message
    ) public pure returns (bytes memory) {
        Vote memory vote = Vote({
            signer: _signer,
            id: _id,
            nonce: _nonce,
            flag: _flag,
            message: _message
        });
        return abi.encode(vote);
    }

    function decodeVote(
        bytes calldata encodedVote
    ) public pure returns (Vote memory decodedVote) {
        (decodedVote) = abi.decode(encodedVote, (Vote));
        return decodedVote;
    }

}
