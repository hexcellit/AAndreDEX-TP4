// page.tsx
// Mark this file as a Client Component for client-side rendering
'use client';

// Import necessary React hooks and wagmi blockchain interaction hooks
import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
// Import local components and ABIs
import { Address } from '~~/components/scaffold-eth';
import SimpleDEXABI from '~~/abis/SimpleDEX.json';
import TokenAABI from '~~/abis/TokenA.json';
import TokenBABI from '~~/abis/TokenB.json';

// Define the main DEX Page component
const DEXPage: React.FC = () => {
  // Extract the connected wallet address using wagmi hook
  const { address: connectedAddress } = useAccount();
  
  // State to track if the connected address is the contract owner
  const [isOwner, setIsOwner] = useState(false);
  const [swapDirection, setSwapDirection] = useState<'A2B' | 'B2A'>('A2B');
  const [inputAmount, setInputAmount] = useState('');
  const [outputAmount, setOutputAmount] = useState('');
  const [liquidityAmountA, setLiquidityAmountA] = useState('');
  const [liquidityAmountB, setLiquidityAmountB] = useState('');

  // Contract addresses (to be replaced with actual deployed addresses)
  const DEX_CONTRACT = '0x...' as `0x${string}`;
  const TOKEN_A_CONTRACT = '0x...' as `0x${string}`;
  const TOKEN_B_CONTRACT = '0x...' as `0x${string}`;

  // Read contract hooks to fetch blockchain data
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

  // Contract write hooks for blockchain transactions
  const { writeContract: swapTokens } = useWriteContract();
  const { writeContract: addLiquidity } = useWriteContract();
  const { writeContract: removeLiquidity } = useWriteContract();
  const { writeContract: approveToken } = useWriteContract();

  const { data: ownerAddress } = useReadContract({
    address: DEX_CONTRACT,
    abi: SimpleDEXABI,
    functionName: 'owner',
    query: {
      enabled: !!connectedAddress
    }
  });

  useEffect(() => {
    if (ownerAddress && connectedAddress) {
      setIsOwner(ownerAddress.toLowerCase() === connectedAddress.toLowerCase());
    }
  }, [ownerAddress, connectedAddress]);

  // Handler for token swapping
  const handleSwap = async () => {
    if (!inputAmount) return;

    try {
      const parsedInput = parseUnits(inputAmount, 18);
      
      await approveToken({
        address: swapDirection === 'A2B' ? TOKEN_A_CONTRACT : TOKEN_B_CONTRACT,
        abi: swapDirection === 'A2B' ? TokenAABI : TokenBABI,
        functionName: 'approve',
        args: [DEX_CONTRACT, parsedInput],
      });

      await swapTokens({
        address: DEX_CONTRACT,
        abi: SimpleDEXABI,
        functionName: swapDirection === 'A2B' ? 'swapAforB' : 'swapBforA',
        args: [parsedInput],
      });

      setInputAmount('');
      setOutputAmount('');
    } catch (error) {
      console.error('Swap failed:', error);
      alert('Swap failed. Please check your inputs or try again later.');
    }
  };

  const handleAddLiquidity = async () => {
    if (!liquidityAmountA || !liquidityAmountB) return;

    try {
      const parsedAmountA = parseUnits(liquidityAmountA, 18);
      const parsedAmountB = parseUnits(liquidityAmountB, 18);

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

      await addLiquidity({
        address: DEX_CONTRACT,
        abi: SimpleDEXABI,
        functionName: 'addLiquidity',
        args: [parsedAmountA, parsedAmountB],
      });

      setLiquidityAmountA('');
      setLiquidityAmountB('');
    } catch (error) {
      console.error('Add liquidity failed:', error);
      alert('Add liquidity failed. Please check your inputs or try again later.');
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!liquidityAmountA || !liquidityAmountB) return;

    try {
      const parsedAmountA = parseUnits(liquidityAmountA, 18);
      const parsedAmountB = parseUnits(liquidityAmountB, 18);

      await removeLiquidity({
        address: DEX_CONTRACT,
        abi: SimpleDEXABI,
        functionName: 'removeLiquidity',
        args: [parsedAmountA, parsedAmountB],
      });

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
