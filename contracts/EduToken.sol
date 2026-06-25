// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title EduToken
 * @dev ERC-20 utility token for the EduChain Academy platform.
 *      Designed as a non-security utility token with compliance controls:
 *      - Role-based minting with daily caps
 *      - Burnable (for revenue deflation mechanism)
 *      - Pausable (emergency stop)
 *      - EIP-2612 permit (gasless approvals)
 *      - Geo-fencing via blocked address registry
 *      - Max supply cap
 */
contract EduToken is ERC20, ERC20Burnable, ERC20Permit, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 1e18; // 1 billion EDU
    uint256 public constant DAILY_MINT_CAP = 5_000_000 * 1e18; // 5 million EDU per day

    uint256 public dailyMinted;
    uint256 public lastMintDay;

    mapping(address => bool) public blocked; // geo-fencing: blocked addresses

    event DailyMintCapReset(uint256 day);
    event AddressBlocked(address indexed account);
    event AddressUnblocked(address indexed account);

    constructor() ERC20("EduChain Academy", "EDU") ERC20Permit("EduChain Academy") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    /**
     * @dev Mint EDU tokens. Restricted to MINTER_ROLE.
     *      Enforces daily mint cap and max supply cap.
     *      Cannot mint to blocked addresses.
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) whenNotPaused {
        _mintWithCompliance(to, amount);
    }

    /**
     * @dev Batch mint to multiple addresses. Restricted to MINTER_ROLE.
     */
    function batchMint(address[] calldata recipients, uint256[] calldata amounts) external onlyRole(MINTER_ROLE) whenNotPaused {
        require(recipients.length == amounts.length, "Length mismatch");
        for (uint256 i = 0; i < recipients.length; i++) {
            _mintWithCompliance(recipients[i], amounts[i]);
        }
    }

    function _mintWithCompliance(address to, uint256 amount) internal {
        require(to != address(0), "Mint to zero address");
        require(!blocked[to], "Address blocked");

        uint256 today = block.timestamp / 1 days;
        if (today > lastMintDay) {
            dailyMinted = 0;
            lastMintDay = today;
            emit DailyMintCapReset(today);
        }

        require(dailyMinted + amount <= DAILY_MINT_CAP, "Daily mint cap exceeded");
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply exceeded");

        dailyMinted += amount;
        _mint(to, amount);
    }

    function _beforeTokenTransfer(address from, address to, uint256 value) internal override whenNotPaused {
        require(!blocked[from], "Sender blocked");
        require(!blocked[to], "Recipient blocked");
        super._beforeTokenTransfer(from, to, value);
    }

    function blockAddress(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        blocked[account] = true;
        emit AddressBlocked(account);
    }

    function unblockAddress(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        blocked[account] = false;
        emit AddressUnblocked(account);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function remainingDailyMintCapacity() external view returns (uint256) {
        uint256 today = block.timestamp / 1 days;
        uint256 minted = (today > lastMintDay) ? 0 : dailyMinted;
        return DAILY_MINT_CAP - minted;
    }

    function remainingSupplyCapacity() external view returns (uint256) {
        return MAX_SUPPLY - totalSupply();
    }
}
