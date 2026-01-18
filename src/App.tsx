import React, { useState, useEffect } from 'react';
import { Calculator } from './components/Calculator';
import { CryptoDropdown } from './components/CryptoDropdown';
import { ArrowDownUp, Star } from 'lucide-react';

function App() {
  const [livePrice, setLivePrice] = useState<string>('');
  const [selectedCrypto, setSelectedCrypto] = useState<string>('BTCUSDT');
  const [useLivePrice, setUseLivePrice] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [favoriteCryptos, setFavoriteCryptos] = useState<string[]>([]);

  // Load favorite cryptos from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favoriteCryptos');
    if (savedFavorites) {
      setFavoriteCryptos(JSON.parse(savedFavorites));
    }
  }, []);

  // Save favorite cryptos to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('favoriteCryptos', JSON.stringify(favoriteCryptos));
  }, [favoriteCryptos]);

  const fetchPrice = async (symbol: string) => {
  if (!useLivePrice) return;

  setIsLoading(true);
  setError(null);

  try {
    // ================================
    // BLOFIN PERP
    // ================================
    if (symbol === 'BTCUSDTPERP_BLOFIN') {
      const instId = 'BTC-USDT';

      const response = await fetch(`/.netlify/functions/blofin-price?instId=${instId}`);

      if (!response.ok) {
        throw new Error(`Blofin proxy failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.code === '0' && data.data && data.data.length > 0) {
        const t = data.data[0];

        const price =
          t.askPrice ||
          t.askPx ||
          t.last ||
          t.markPx ||
          t.bidPrice ||
          t.bidPx;

        if (!price) {
          throw new Error('No usable price field in Blofin response');
        }

        setLivePrice(price.toString());
      } else {
        throw new Error(data.msg || 'Invalid Blofin response');
      }

      return;
    }

    // ================================
    // BYBIT
    // ================================
    const category = symbol.endsWith('PERP') ? 'linear' : 'spot';

    const apiSymbol = symbol.endsWith('PERP')
      ? symbol.replace('PERP', '')
      : symbol;

    const response = await fetch(
      `/bybit-api/v5/market/orderbook?category=${category}&symbol=${apiSymbol}&limit=1`
    );

    if (!response.ok) {
      throw new Error(`Bybit API request failed: ${response.status}`);
    }

    const data = await response.json();

    if (
      data.retCode === 0 &&
      data.result &&
      data.result.a &&
      data.result.a.length > 0
    ) {
      setLivePrice(data.result.a[0][0]);
    } else {
      throw new Error('Invalid Bybit response');
    }
  } catch (err: any) {
    console.error(err);
    setError(err.message || 'Error connecting to exchange');
  } finally {
    setIsLoading(false);
  }
};

  useEffect(() => {
    // Initial fetch
    fetchPrice(selectedCrypto);
    
    // Set up interval to refresh price every 5 seconds to avoid rate limiting
    const interval = setInterval(() => {
      if (useLivePrice) {
        fetchPrice(selectedCrypto);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [selectedCrypto, useLivePrice]);

  const handleCryptoChange = (crypto: string) => {
    setSelectedCrypto(crypto);
    fetchPrice(crypto);
  };

  const toggleFavorite = (crypto: string) => {
    if (favoriteCryptos.includes(crypto)) {
      // Remove from favorites
      setFavoriteCryptos(prevFavorites => 
        prevFavorites.filter(fav => fav !== crypto)
      );
    } else {
      // Add to favorites (limit to 3)
      if (favoriteCryptos.length < 3) {
        setFavoriteCryptos(prevFavorites => [...prevFavorites, crypto]);
      } else {
        // If we already have 3 favorites, replace the oldest one
        setFavoriteCryptos(prevFavorites => [...prevFavorites.slice(1), crypto]);
      }
    }
  };

  // Get crypto name from symbol
  const getCryptoNameFromSymbol = (symbol: string): string => {
    // Most common cryptos
    if (symbol === 'BTCUSDT') return 'BTC';
    if (symbol === 'ETHUSDT') return 'ETH';
    if (symbol === 'SOLUSDT') return 'SOL';
    if (symbol === 'BNBUSDT') return 'BNB';
    if (symbol === 'XRPUSDT') return 'XRP';
    if (symbol === 'ADAUSDT') return 'ADA';
    if (symbol === 'DOGEUSDT') return 'DOGE';
    if (symbol === 'DOTUSDT') return 'DOT';
    // Perpetual markets
    if (symbol === 'BTCUSDTPERP') return 'BTC/P';
    if (symbol === 'BTCUSDTPERP_BLOFIN') return 'BTC/B';
    if (symbol === 'ETHUSDTPERP') return 'ETH/P';
    if (symbol === 'SOLUSDTPERP') return 'SOL/P';
    
    // Default fallback - just show the first 3-4 characters
    return symbol.substring(0, 4);
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
        
        <div className="bg-gray-800 rounded-lg shadow-lg p-4 max-w-6xl mx-auto">
          {/* Favorite Cryptos Quick Buttons */}
          {favoriteCryptos.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-700 pb-3">
              <span className="text-xs text-gray-400 flex items-center mr-1">
                <Star size={12} className="mr-1 text-yellow-400"/> Favorites:
              </span>
              {favoriteCryptos.map(crypto => (
                <button
                  key={crypto}
                  onClick={() => handleCryptoChange(crypto)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                    selectedCrypto === crypto 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {getCryptoNameFromSymbol(crypto)}
                </button>
              ))}
            </div>
          )}
          
          <div className="mb-4 flex flex-col md:flex-row items-start md:items-center gap-3">
            <div className="w-full md:w-auto">
              <CryptoDropdown 
                selectedCrypto={selectedCrypto} 
                onCryptoChange={handleCryptoChange}
                favoriteCryptos={favoriteCryptos}
                onToggleFavorite={toggleFavorite} 
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
          
          <Calculator 
            livePrice={useLivePrice ? livePrice : ''} 
            selectedCrypto={selectedCrypto}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
