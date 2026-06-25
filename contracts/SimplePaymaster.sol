// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SimplePaymaster
 * @notice Minimal ERC‑4337 paymaster that unconditionally approves any UserOperation.
 *         It is meant for demo purposes on Base Sepolia. In production you would
 *         add signature verification, token balance checks, etc.
 */
contract SimplePaymaster is Ownable {
    // The EntryPoint contract for the network (Base Sepolia)
    address public immutable entryPoint;

    constructor(address _entryPoint) Ownable() {
        entryPoint = _entryPoint;
    }

    // Required by ERC‑4337. The struct definition matches the official spec.
    struct UserOperation {
        address sender;
        uint256 nonce;
        bytes initCode;
        bytes callData;
        uint256 callGasLimit;
        uint256 verificationGasLimit;
        uint256 preVerificationGas;
        uint256 maxFeePerGas;
        uint256 maxPriorityFeePerGas;
        bytes paymasterAndData;
        bytes signature;
    }

    /**
     * @dev Called by the EntryPoint during validation. Returning ("", 0) means the
     *      operation is fully covered by the paymaster and no further validation is needed.
     */
    function validatePaymasterUserOp(
        UserOperation calldata userOp,
        bytes32 /*userOpHash*/, // hash of the operation – ignored in this demo
        uint256 /*maxCost*/
    ) external view returns (bytes memory context, uint256 validationData) {
        context = "";
        validationData = 0; // 0 = success
    }

    /**
     * @dev Called after the operation is executed. No post‑processing needed for this demo.
     */
    function postOp(
        uint8 /*mode*/, // 0 = op succeeded, 1 = op reverted, 2 = postOp called after revert
        bytes calldata /*context*/,
        uint256 /*gasUsed*/
    ) external {}

    // Allow the contract to receive ETH (used to pay for gas)
    receive() external payable {}

    /**
     * @dev Owner can withdraw any leftover ETH.
     */
    function withdraw(address payable to) external onlyOwner {
        to.transfer(address(this).balance);
    }
}
