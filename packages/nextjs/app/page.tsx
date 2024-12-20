'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { Address } from '~~/components/scaffold-eth';
import SimpleDEXABI from '~~/abis/SimpleDEX.json';
import TokenAABI from '~~/abis/TokenA.json';
import TokenBABI from '~~/abis/TokenB.json';

const DEXPage: React.FC = () => {
  const { address: connectedAddress } = useAccount();
  const [isOwner, setIsOwner] = useState(false);
  const [swapDirection, setSwapDirection] = useState<'A2B' | 'B2A'>('A2B');
  const [inputAmount, setInputAmount] = useState('');
  const [outputAmount, setOutputAmount] = useState('');
  const [liquidityAmountA, setLiquidityAmountA] = useState('');
  const [liquidityAmountB, setLiquidityAmountB] = useState('');

  const DEX_CONTRACT = '0x...' as `0x${string}`;
  const TOKEN_A_CONTRACT = '0x...' as `0x${string}`;
  const TOKEN_B_CONTRACT = '0x...' as `0x${string}`;

  // Read Contracts with proper typing
  const { data: reserveA } = useReadContract({
    address: DEX_CONTRACT,
    abi: SimpleDEXABI,
    functionName: 'reserveA',
  });

  const { data: reserveB } = useReadContract({
    address: DEX_CONTRACT,
    abi: SimpleDEXABI,
    functionName: 'reserveB',
  });

  const { data: tokenAPrice } = useReadContract({
    address: DEX_CONTRACT,
    abi: SimpleDEXABI,
    functionName: 'getPrice',
    args: [TOKEN_A_CONTRACT],
  });

  const { data: tokenBPrice } = useReadContract({
    address: DEX_CONTRACT,
    abi: SimpleDEXABI,
    functionName: 'getPrice',
    args: [TOKEN_B_CONTRACT],
  });

  // Owner check with proper type handling
  const { data: ownerAddress } = useReadContract({
    address: DEX_CONTRACT,
    abi: SimpleDEXABI,
    functionName: 'owner',
    query: {
      enabled: !!connectedAddress
    }
  });

  // Effect to check ownership
  useEffect(() => {
    if (ownerAddress && connectedAddress && typeof ownerAddress === 'string') {
      setIsOwner(ownerAddress.toLowerCase() === connectedAddress.toLowerCase());
    }
  }, [ownerAddress, connectedAddress]);

  // Contract interaction hooks
  const { writeContract: swapTokens } = useWriteContract();
  const { writeContract: addLiquidity } = useWriteContract();
  const { writeContract: removeLiquidity } = useWriteContract();
  const { writeContract: approveToken } = useWriteContract();

  // Swap handler
  const handleSwap = async () => {
    if (!inputAmount) return;

    try {
      const parsedInput = parseUnits(inputAmount, 18);
      
      // Approve tokens for swap
      await approveToken({
        address: swapDirection === 'A2B' ? TOKEN_A_CONTRACT : TOKEN_B_CONTRACT,
        abi: swapDirection === 'A2B' ? TokenAABI : TokenBABI,
        functionName: 'approve',
        args: [DEX_CONTRACT, parsedInput],
      });

      // Perform swap
      await swapTokens({
        address: DEX_CONTRACT,
        abi: SimpleDEXABI,
        functionName: swapDirection === 'A2B' ? 'swapAforB' : 'swapBforA',
        args: [parsedInput],
      });

      // Reset inputs
      setInputAmount('');
      setOutputAmount('');
    } catch (error) {
      console.error('Swap failed:', error);
      alert('Swap failed. Please check your inputs or try again later.');
    }
  };

  // Add Liquidity handler
  const handleAddLiquidity = async () => {
    if (!liquidityAmountA || !liquidityAmountB) return;

    try {
      const parsedAmountA = parseUnits(liquidityAmountA, 18);
      const parsedAmountB = parseUnits(liquidityAmountB, 18);

      // Approve tokens for liquidity addition
      await approveToken({
        address: TOKEN_A_CONTRACT,
        abi: TokenAABI,
        functionName: 'approve',
        args: [DEX_CONTRACT, parsedAmountA],
      });
      await approveToken({
        address: TOKEN_B_CONTRACT,
        abi: TokenBABI,
        functionName: 'approve',
        args: [DEX_CONTRACT, parsedAmountB],
      });

      // Add liquidity
      await addLiquidity({
        address: DEX_CONTRACT,
        abi: SimpleDEXABI,
        functionName: 'addLiquidity',
        args: [parsedAmountA, parsedAmountB],
      });

      // Reset inputs
      setLiquidityAmountA('');
      setLiquidityAmountB('');
    } catch (error) {
      console.error('Add liquidity failed:', error);
      alert('Add liquidity failed. Please check your inputs or try again later.');
    }
  };

  // Remove Liquidity handler
  const handleRemoveLiquidity = async () => {
    if (!liquidityAmountA || !liquidityAmountB) return;

    try {
      const parsedAmountA = parseUnits(liquidityAmountA, 18);
      const parsedAmountB = parseUnits(liquidityAmountB, 18);

      // Remove liquidity
      await removeLiquidity({
        address: DEX_CONTRACT,
        abi: SimpleDEXABI,
        functionName: 'removeLiquidity',
        args: [parsedAmountA, parsedAmountB],
      });

      // Reset inputs
      setLiquidityAmountA('');
      setLiquidityAmountB('');
    } catch (error) {
      console.error('Remove liquidity failed:', error);
      alert('Remove liquidity failed. Please check your inputs or try again later.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Simple DEX ETH-KIPU C3</h1>
      
      {/* Swap Section */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4">Swap Tokens</h2>
        <div className="flex items-center space-x-4 mb-4">
          <button 
            onClick={() => setSwapDirection(swapDirection === 'A2B' ? 'B2A' : 'A2B')}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Swap {swapDirection === 'A2B' ? 'A → B' : 'B → A'}
          </button>
          <input
            type="number"
            value={inputAmount}
            onChange={(e) => setInputAmount(e.target.value)}
            placeholder={`Enter amount to swap ${swapDirection === 'A2B' ? 'A' : 'B'}`}
            className="flex-grow border rounded px-3 py-2"
          />
        </div>
        <button 
          onClick={handleSwap}
          className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded"
        >
          Swap
        </button>
      </div>

      {/* Pool Information */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4">Liquidity Pool Information</h2>
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-medium">Token A</h3>
            <p className="text-sm">Price: {tokenAPrice !== undefined ? formatUnits(tokenAPrice, 18) : 'Loading...'}</p>
            <p className="text-sm">Reserve: {reserveA !== undefined ? formatUnits(reserveA, 18) : 'Loading...'}</p>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium">Token B</h3>
            <p className="text-sm">Price: {tokenBPrice !== undefined ? formatUnits(tokenBPrice, 18) : 'Loading...'}</p>
            <p className="text-sm">Reserve: {reserveB !== undefined ? formatUnits(reserveB, 18) : 'Loading...'}</p>
          </div>
        </div>
        {isOwner && (
          <div className="mt-4">
            <h3 className="text-lg font-medium">Remove Liquidity</h3>
            <input
              type="number"
              value={liquidityAmountA}
              onChange={(e) => setLiquidityAmountA(e.target.value)}
              placeholder="Amount of Token A to remove"
              className="flex-grow border rounded px-3 py-2 mb-2"
            />
            <input
              type="number"
              value={liquidityAmountB}
              onChange={(e) => setLiquidityAmountB(e.target.value)}
              placeholder="Amount of Token B to remove"
              className="flex-grow border rounded px-3 py-2"
            />
            <button 
              onClick={handleRemoveLiquidity}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded mt-2"
            >
              Remove Liquidity
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DEXPage;