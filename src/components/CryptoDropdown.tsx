import React from 'react';
import { ChevronDown } from 'lucide-react';

interface CryptoDropdownProps {
  selectedCrypto: string;
  onCryptoChange: (crypto: string) => void;
}

export const CryptoDropdown: React.FC<CryptoDropdownProps> = ({ 
  selectedCrypto, 
  onCryptoChange 
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

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-gray-300 mb-1">
        Select Cryptocurrency
      </label>
      <div className="relative">
        <select
          value={selectedCrypto}
          onChange={(e) => onCryptoChange(e.target.value)}
          className="appearance-none w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 pr-8"
        >
          {cryptoOptions.map((crypto) => (
            <option key={crypto.symbol} value={crypto.symbol}>
              {crypto.name}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
          <ChevronDown size={12} />
        </div>
      </div>
    </div>
  );
};