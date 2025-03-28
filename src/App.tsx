import React, { useState, useEffect } from 'react';
import { Calculator } from './components/Calculator';
import { CryptoDropdown } from './components/CryptoDropdown';
import { ArrowDownUp } from 'lucide-react';

function App() {
  const [livePrice, setLivePrice] = useState<string>('');
  const [selectedCrypto, setSelectedCrypto] = useState<string>('BTCUSDT');
  const [useLivePrice, setUseLivePrice] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrice = async (symbol: string) => {
    if (!useLivePrice) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Handle both spot and perpetual symbols
      const category = symbol.endsWith('PERP') ? 'linear' : 'spot';
      
      // For perpetual symbols, we need to format them correctly for the API
      const apiSymbol = symbol.endsWith('PERP') 
        ? symbol.replace('PERP', '') 
        : symbol;
      
      // Using the orderbook API endpoint from Bybit
      const response = await fetch(`https://api.bybit.com/v5/market/orderbook?category=${category}&symbol=${apiSymbol}&limit=1`);
      const data = await response.json();
      
      if (data.retCode === 0 && data.result && data.result.a && data.result.a.length > 0) {
        // Using the "a" (ask) price as the execution price as it's more accurate for entries
        setLivePrice(data.result.a[0][0]);
      } else {
        setError('Failed to fetch price data');
      }
    } catch (err) {
      setError('Error connecting to Bybit API');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchPrice(selectedCrypto);
    
    // Set up interval to refresh price every 1 second
    const interval = setInterval(() => {
      if (useLivePrice) {
        fetchPrice(selectedCrypto);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [selectedCrypto, useLivePrice]);

  const handleCryptoChange = (crypto: string) => {
    setSelectedCrypto(crypto);
    fetchPrice(crypto);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-2 py-4">
        <header className="mb-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <ArrowDownUp className="h-6 w-6 mr-2 text-blue-400" />
            <h1 className="text-2xl font-bold">Trading Calculator</h1>
          </div>
          <p className="text-gray-400 text-sm">Calculate position sizes with fee considerations</p>
        </header>
        
        <div className="bg-gray-800 rounded-lg shadow-lg p-4 max-w-2xl mx-auto">
          <div className="mb-4 flex flex-col md:flex-row items-start md:items-center gap-3">
            <div className="w-full md:w-auto">
              <CryptoDropdown 
                selectedCrypto={selectedCrypto} 
                onCryptoChange={handleCryptoChange} 
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="useLivePrice"
                checked={useLivePrice}
                onChange={(e) => setUseLivePrice(e.target.checked)}
                className="h-4 w-4 rounded border-gray-600 text-blue-500 focus:ring-blue-500"
              />
              <label htmlFor="useLivePrice" className="text-sm">Use Live Price</label>
            </div>
            
            {isLoading && (
              <span className="text-sm text-gray-400">Loading...</span>
            )}
            
            {error && (
              <span className="text-sm text-red-400">{error}</span>
            )}
            
            {livePrice && useLivePrice && !isLoading && !error && (
              <span className="text-sm text-green-400">
                Current price: {parseFloat(livePrice).toFixed(2)} USDT
              </span>
            )}
          </div>
          
          <Calculator livePrice={useLivePrice ? livePrice : ''} />
        </div>
      </div>
    </div>
  );
}

export default App;