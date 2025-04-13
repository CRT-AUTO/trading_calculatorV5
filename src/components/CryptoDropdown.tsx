import React, { useState } from 'react';
import { ChevronDown, Star } from 'lucide-react';

interface CryptoDropdownProps {
  selectedCrypto: string;
  onCryptoChange: (crypto: string) => void;
  favoriteCryptos: string[];
  onToggleFavorite: (crypto: string) => void;
}

export const CryptoDropdown: React.FC<CryptoDropdownProps> = ({ 
  selectedCrypto, 
  onCryptoChange,
  favoriteCryptos,
  onToggleFavorite
}) => {
  const cryptoOptions = [
    // Spot markets
    { symbol: 'BTCUSDT', name: 'Bitcoin (BTC)' },
    { symbol: 'ETHUSDT', name: 'Ethereum (ETH)' },
    { symbol: 'SOLUSDT', name: 'Solana (SOL)' },
    { symbol: 'BNBUSDT', name: 'Binance Coin (BNB)' },
    { symbol: 'XRPUSDT', name: 'Ripple (XRP)' },
    { symbol: 'ADAUSDT', name: 'Cardano (ADA)' },
    { symbol: 'DOGEUSDT', name: 'Dogecoin (DOGE)' },
    { symbol: 'DOTUSDT', name: 'Polkadot (DOT)' },
    
    // Perpetual markets
    { symbol: 'BTCUSDTPERP', name: 'Bitcoin Perp (BTC/USDTP)' },
    { symbol: 'ETHUSDTPERP', name: 'Ethereum Perp (ETH/USDTP)' },
    { symbol: 'SOLUSDTPERP', name: 'Solana Perp (SOL/USDTP)' }
  ];

  // State to track if dropdown is open
  const [isOpen, setIsOpen] = useState(false);

  // Handle clicking on the favorite star
  const handleStarClick = (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation(); // Prevent dropdown from closing
    onToggleFavorite(symbol);
  };

  // Custom dropdown implementation with stars
  return (
    <div className="relative">
      <label className="block text-xs font-medium text-gray-300 mb-1">
        Select Cryptocurrency
      </label>
      
      {/* Custom dropdown trigger */}
      <div 
        className="relative w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded-md text-white cursor-pointer flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>
          {cryptoOptions.find(c => c.symbol === selectedCrypto)?.name || selectedCrypto}
        </span>
        <ChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      {/* Dropdown options */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
          {cryptoOptions.map((crypto) => (
            <div 
              key={crypto.symbol}
              className={`px-3 py-2 flex items-center justify-between text-sm cursor-pointer hover:bg-gray-700 ${
                selectedCrypto === crypto.symbol ? 'bg-gray-700' : ''
              }`}
              onClick={() => {
                onCryptoChange(crypto.symbol);
                setIsOpen(false);
              }}
            >
              <span>{crypto.name}</span>
              <Star 
                size={14} 
                onClick={(e) => handleStarClick(e, crypto.symbol)}
                className={`cursor-pointer ${
                  favoriteCryptos.includes(crypto.symbol) 
                    ? 'fill-yellow-400 text-yellow-400' 
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
