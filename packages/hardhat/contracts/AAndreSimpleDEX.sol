// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title SimpleDEX
 * @notice A decentralized exchange for swapping TokenA and TokenB using a constant product formula.
 * @dev Implements an automated market maker (AMM) model with a liquidity pool.
 * This contract is #######  NOT PRODUCTION READY  ####### as it is intended for the final assignemnt of Module 3 of the ETHKIPU "EDP - Modulo 3: Estándares, librerías y patrones".
 * Previous assignment can be found on: https://sepolia.scrollscan.com/address/0x5be4e479b7671A8122BB260DBAf8200C0b363550
 * What have we learned?:
 * English is better ;)
 * Test it until you break it.
 * Always tripple check your math and the scope of your variables.
 * If theres room for a vulnerability, it will be exploited.
 * Handle errors gracefully and keep in mind the output string's lenght as they can increase gas costs.
 */
contract SimpleDEX {
    IERC20 public immutable tokenA;
    IERC20 public immutable tokenB;

    uint256 public reserveA; // Current reserves of TokenA in the pool
    uint256 public reserveB; // Current reserves of TokenB in the pool
    address public owner; // Owner of the contract, who can add or remove liquidity

    event LiquidityAdded(address indexed provider, uint256 amountA, uint256 amountB);
    event LiquidityRemoved(address indexed provider, uint256 amountA, uint256 amountB);
    event TokensSwapped(
        address indexed swapper,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }

    /**
     * @notice Deploys the SimpleDEX contract with specified TokenA and TokenB.
     * @param _tokenA Address of TokenA (must follow IERC20 interface).
     * @param _tokenB Address of TokenB (must follow IERC20 interface).
     */
    constructor(address _tokenA, address _tokenB) {
        require(_tokenA != _tokenB, "Token addresses must differ");
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
        owner = msg.sender;
    }

    /**
     * @notice Adds liquidity to the pool. Only the pwner can call this function.
     * @param amountA Amount of TokenA to add.
     * @param amountB Amount of TokenB to add.
     */
    function addLiquidity(uint256 amountA, uint256 amountB) external onlyOwner {
        require(amountA > 0 && amountB > 0, "Invalid amounts");
        
        // Transfer tokens to the contract
        require(tokenA.transferFrom(msg.sender, address(this), amountA), "TokenA transfer failed");
        require(tokenB.transferFrom(msg.sender, address(this), amountB), "TokenB transfer failed");

        // Update reserves
        reserveA += amountA;
        reserveB += amountB;

        emit LiquidityAdded(msg.sender, amountA, amountB);
    }

    /**
     * @notice Swaps a specified amount of TokenA for TokenB. In Future versions we could use a single funtion for both  A2B and B2A.
     * @param amountAIn Amount of TokenA to swap.
     */
    function swapAforB(uint256 amountAIn) external {
        require(amountAIn > 0, "Invalid amount");
        uint256 amountBOut = getSwapAmount(amountAIn, reserveA, reserveB);
        require(amountBOut > 0, "Insufficient output amount");

        // Perform the swap
        require(tokenA.transferFrom(msg.sender, address(this), amountAIn), "TokenA transfer failed");
        require(tokenB.transfer(msg.sender, amountBOut), "TokenB transfer failed");

        // Update reserves
        reserveA += amountAIn;
        reserveB -= amountBOut;

        emit TokensSwapped(msg.sender, address(tokenA), address(tokenB), amountAIn, amountBOut);
    }

    /**
     * @notice Swaps a specified amount of TokenB for TokenA.In Future versions we could use a single funtion for both  A2B and B2A.
     * @param amountBIn Amount of TokenB to swap.
     */
    function swapBforA(uint256 amountBIn) external {
        require(amountBIn > 0, "Invalid amount");
        uint256 amountAOut = getSwapAmount(amountBIn, reserveB, reserveA);
        require(amountAOut > 0, "Insufficient output amount");

        // Perform the swap
        require(tokenB.transferFrom(msg.sender, address(this), amountBIn), "TokenB transfer failed");
        require(tokenA.transfer(msg.sender, amountAOut), "TokenA transfer failed");

        // Update reserves
        reserveB += amountBIn;
        reserveA -= amountAOut;

        emit TokensSwapped(msg.sender, address(tokenB), address(tokenA), amountBIn, amountAOut);
    }

    /**
     * @notice Removes liquidity from the pool. Only the owner can call this function.
     * @param amountA Amount of TokenA to withdraw.
     * @param amountB Amount of TokenB to withdraw.
     */
    function removeLiquidity(uint256 amountA, uint256 amountB) external onlyOwner {
        require(amountA > 0 && amountB > 0, "Invalid amounts");
        require(amountA <= reserveA && amountB <= reserveB, "Insufficient liquidity");

        // Transfer tokens to the owner
        require(tokenA.transfer(msg.sender, amountA), "TokenA transfer failed");
        require(tokenB.transfer(msg.sender, amountB), "TokenB transfer failed");

        // Update reserves
        reserveA -= amountA;
        reserveB -= amountB;

        emit LiquidityRemoved(msg.sender, amountA, amountB);
    }

    /**
     * @notice Returns the price of 1 token in terms of the other.This could be improved for dynamic fee calculation
     * @param _token Address of the token to price (TokenA or TokenB).
     * @return Price of the token in 18 decimals. Maybe this could also set a minimum amount like most Exchanges.
     * 
     */
    function getPrice(address _token) external view returns (uint256) {
        require(_token == address(tokenA) || _token == address(tokenB), "Invalid token");
        if (_token == address(tokenA)) {
            return (reserveB * 1e18) / reserveA; // Price of 1 TokenA in terms of TokenB
        } else {
            return (reserveA * 1e18) / reserveB; // Price of 1 TokenB in terms of TokenA
        }
    }

    /**
     * @dev Calculates the output amount for a swap using the constant product formula and aplies a fixed fee.
     * @param amountIn Input amount of tokens.
     * @param reserveIn Reserve of the input token.
     * @param reserveOut Reserve of the output token.
     * @return Output amount of the swapped token.
     */
    function getSwapAmount(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) internal pure returns (uint256) {
        require(reserveIn > 0 && reserveOut > 0, "Invalid reserves");
        uint256 inputAmountWithFee = amountIn * 997; // 0.3% fee
        uint256 numerator = inputAmountWithFee * reserveOut;
        uint256 denominator = (reserveIn * 1000) + inputAmountWithFee;
        return numerator / denominator;
    }
}
