import React, { useState, useEffect, useRef } from 'react';
import { Copy, ArrowUp } from 'lucide-react';

interface CalculatorProps {
  livePrice: string;
}

export const Calculator: React.FC<CalculatorProps> = ({ livePrice }) => {
  // State for form inputs
  const [entryPrice, setEntryPrice] = useState<string>('');
  const [stopLossPrice, setStopLossPrice] = useState<string>('');
  const [riskAmount, setRiskAmount] = useState<string>('50');
  const [availableCapital, setAvailableCapital] = useState<string>('1000');
  const [marketFee, setMarketFee] = useState<string>('0.055');
  const [limitFee, setLimitFee] = useState<string>('0.02');
  const [decimalPlaces, setDecimalPlaces] = useState<number>(2);
  
  // State for fee type selection
  const [isMarketEntry, setIsMarketEntry] = useState<boolean>(true);
  const [isLimitEntry, setIsLimitEntry] = useState<boolean>(false);
  const [isMarketExit, setIsMarketExit] = useState<boolean>(true);
  const [isLimitExit, setIsLimitExit] = useState<boolean>(false);
  
  // State for calculation results
  const [positionSizeBeforeFees, setPositionSizeBeforeFees] = useState<string>('');
  const [positionSizeAfterFees, setPositionSizeAfterFees] = useState<string>('');
  const [leverageNeeded, setLeverageNeeded] = useState<string>('');
  const [feeCost, setFeeCost] = useState<string>('');
  const [liquidationPrice, setLiquidationPrice] = useState<string>('');
  const [maxRisk, setMaxRisk] = useState<string>('');
  const [isLiquidationRisky, setIsLiquidationRisky] = useState<boolean>(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  
  // State for always-on-top feature
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState<boolean>(false);

  // Reference to calculate function for use in useEffect
  const calculateRef = useRef<() => void>();

  // Load saved settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('tradingCalculatorSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setMarketFee(settings.marketFee || '0.055');
      setLimitFee(settings.limitFee || '0.02');
      setRiskAmount(settings.riskAmount || '50');
      setIsMarketEntry(settings.isMarketEntry !== undefined ? settings.isMarketEntry : true);
      setIsLimitEntry(settings.isLimitEntry || false);
      setIsMarketExit(settings.isMarketExit !== undefined ? settings.isMarketExit : true);
      setIsLimitExit(settings.isLimitExit || false);
      setAvailableCapital(settings.availableCapital || '1000');
      setDecimalPlaces(settings.decimalPlaces || 2);
      setIsAlwaysOnTop(settings.isAlwaysOnTop || false);
    }
  }, []);

  // Update entry price when live price changes
  useEffect(() => {
    if (livePrice) {
      setEntryPrice(livePrice);
      // Auto-recalculate if stop loss is set
      if (stopLossPrice && calculateRef.current) {
        calculateRef.current();
      }
    }
  }, [livePrice, stopLossPrice]);

  // Auto-recalculate when entry price changes
  useEffect(() => {
    if (entryPrice && stopLossPrice && calculateRef.current) {
      calculateRef.current();
    }
  }, [entryPrice, stopLossPrice]);

  // Save settings to localStorage when they change
  useEffect(() => {
    const settings = {
      marketFee,
      limitFee,
      riskAmount,
      isMarketEntry,
      isLimitEntry,
      isMarketExit,
      isLimitExit,
      availableCapital,
      decimalPlaces,
      isAlwaysOnTop,
    };
    localStorage.setItem('tradingCalculatorSettings', JSON.stringify(settings));
  }, [
    marketFee,
    limitFee,
    riskAmount,
    isMarketEntry,
    isLimitEntry,
    isMarketExit,
    isLimitExit,
    availableCapital,
    decimalPlaces,
    isAlwaysOnTop,
  ]);

  // Set up always-on-top functionality using picture-in-picture when available
  useEffect(() => {
    // Check if the document has pictureInPictureEnabled
    const pipWindow = document.getElementById('pip-window');
    if (isAlwaysOnTop && pipWindow && document.pictureInPictureEnabled) {
      try {
        // Request picture in picture mode
        if (document.pictureInPictureElement !== pipWindow) {
          // @ts-ignore - TypeScript might not recognize the method
          pipWindow.requestPictureInPicture();
        }
      } catch (error) {
        console.error('Picture-in-Picture failed:', error);
      }
    } else if (!isAlwaysOnTop && document.pictureInPictureElement) {
      document.exitPictureInPicture().catch(console.error);
    }

    // Apply basic CSS-based always-on-top behavior as fallback
    if (isAlwaysOnTop) {
      document.body.classList.add('always-on-top');
      window.scrollTo(0, 0);
    } else {
      document.body.classList.remove('always-on-top');
    }
  }, [isAlwaysOnTop]);

  const handleMarketEntryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsMarketEntry(e.target.checked);
    if (e.target.checked) setIsLimitEntry(false);
  };

  const handleLimitEntryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsLimitEntry(e.target.checked);
    if (e.target.checked) setIsMarketEntry(false);
  };

  const handleMarketExitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsMarketExit(e.target.checked);
    if (e.target.checked) setIsLimitExit(false);
  };

  const handleLimitExitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsLimitExit(e.target.checked);
    if (e.target.checked) setIsMarketExit(false);
  };

  const calculate = () => {
    try {
      setCalculationError(null);
      setDebugInfo(null);
      
      // Parse input values
      const entry = parseFloat(entryPrice);
      const stopLoss = parseFloat(stopLossPrice);
      const risk = parseFloat(riskAmount);
      const capital = parseFloat(availableCapital);
      const tolerance = 0.1 / 100; // Hard-coded tolerance value of 0.1%

      // Validate inputs
      if (isNaN(entry) || isNaN(stopLoss) || isNaN(risk) || isNaN(capital)) {
        setCalculationError('Please enter valid numbers for all fields');
        return;
      }

      // Fee percentages
      const marketFeeRate = parseFloat(marketFee) / 100;
      const limitFeeRate = parseFloat(limitFee) / 100;

      // Ensure that both entry and exit checkboxes are selected
      if ((!isMarketEntry && !isLimitEntry) || (!isMarketExit && !isLimitExit)) {
        setCalculationError('Please select both entry and exit fee types');
        return;
      }

      // Determine entry and exit fee rates
      const entryFeeRate = isMarketEntry ? marketFeeRate : limitFeeRate;
      const exitFeeRate = isMarketExit ? marketFeeRate : limitFeeRate;

      // Determine if it's a long or short trade
      const isLongTrade = entry < stopLoss;

      // Calculate price difference
      const priceDifference = Math.abs(entry - stopLoss);

      // Raw position size (without fees)
      const rawPositionSize = risk / priceDifference;

      // Iteratively calculate the position size, considering both fees and tolerance
      let totalFees, actualRisk, positionSize = rawPositionSize;
      const toleranceAmount = tolerance * risk; // Tolerance value

      const maxIterations = 100;  // Limit the number of iterations
      let iteration = 0;

      do {
        // Calculate fees based on current position size
        const entryFee = positionSize * entry * entryFeeRate;
        const exitFee = positionSize * stopLoss * exitFeeRate;
        totalFees = entryFee + exitFee;

        // Actual risk including fees
        actualRisk = positionSize * priceDifference + totalFees;

        // Adjust the position size if the actual risk exceeds the target risk with tolerance
        if (Math.abs(risk - actualRisk) > toleranceAmount) {
          if (actualRisk > risk) {
            positionSize *= (risk - toleranceAmount) / actualRisk;
          } else {
            positionSize *= (risk + toleranceAmount) / actualRisk;
          }
        }

        iteration++;
      } while (Math.abs(risk - actualRisk) > toleranceAmount && iteration < maxIterations);

      // Calculate Maximum Risk after Fees
      const maxRiskAfterFees = risk - totalFees;

      // Calculate leverage needed based on adjusted position size
      const leverage = (positionSize * entry) / capital;

      // Check for maximum leverage of 100
      if (leverage > 100) {
        setCalculationError('Leverage exceeds 100x. Please increase capital to reduce leverage.');
        return;
      }

      // Liquidation price calculation
      let liquidation;

      if (isLongTrade) { // Long trade
        // Liquidation price for long trades
        liquidation = entry * (1 - (1 / leverage));
      } else { // Short trade
        // Liquidation price for short trades
        liquidation = entry * (1 + (1 / leverage));
      }

      // Check if liquidation happens before the stop loss
      const willBeLiquidated = (isLongTrade && liquidation > stopLoss) ||
                              (!isLongTrade && liquidation < stopLoss);

      // Update state with calculation results
      setPositionSizeBeforeFees(rawPositionSize.toFixed(decimalPlaces));
      setPositionSizeAfterFees(positionSize.toFixed(decimalPlaces));
      setLeverageNeeded(leverage.toFixed(2));
      setFeeCost(totalFees.toFixed(2));
      setLiquidationPrice(liquidation.toFixed(2));
      setMaxRisk(maxRiskAfterFees.toFixed(decimalPlaces));
      setIsLiquidationRisky(willBeLiquidated);

    } catch (error) {
      setCalculationError(`Error: ${(error as Error).message}`);
    }
  };

  // Store the calculate function in a ref so it can be accessed in useEffect
  calculateRef.current = calculate;

  // Handle entry price change
  const handleEntryPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEntryPrice(e.target.value);
    // Auto-recalculate if stop loss is set
    if (stopLossPrice && e.target.value) {
      calculate();
    }
  };

  // Handle stop loss price change
  const handleStopLossChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStopLossPrice(e.target.value);
    // Auto-recalculate if entry price is set
    if (entryPrice && e.target.value) {
      calculate();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const toggleAlwaysOnTop = () => {
    setIsAlwaysOnTop(!isAlwaysOnTop);
  };

  return (
    <div id="pip-window">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 className="text-md font-semibold mb-2">Trade Parameters</h2>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Entry Price
              </label>
              <input
                type="text"
                value={entryPrice}
                onChange={handleEntryPriceChange}
                className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter price"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Stop Loss Price
              </label>
              <input
                type="text"
                value={stopLossPrice}
                onChange={handleStopLossChange}
                className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Stop loss price"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Risk Amount (USDT)
              </label>
              <input
                type="text"
                value={riskAmount}
                onChange={(e) => setRiskAmount(e.target.value)}
                className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Amount to risk"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Available Capital (USDT)
              </label>
              <input
                type="text"
                value={availableCapital}
                onChange={(e) => setAvailableCapital(e.target.value)}
                className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Available capital"
              />
            </div>
          </div>
        </div>
        
        <div>
          <h2 className="text-md font-semibold mb-2">Fee Settings</h2>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Taker Fee (%)
                </label>
                <input
                  type="text"
                  value={marketFee}
                  onChange={(e) => setMarketFee(e.target.value)}
                  className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Market fee %"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Maker Fee (%)
                </label>
                <input
                  type="text"
                  value={limitFee}
                  onChange={(e) => setLimitFee(e.target.value)}
                  className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Limit fee %"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Entry Fee Type
                </label>
                <div className="flex space-x-3">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={isMarketEntry}
                      onChange={handleMarketEntryChange}
                      className="h-3 w-3 rounded border-gray-600 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="ml-1 text-xs text-gray-300">Taker</span>
                  </label>
                  
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={isLimitEntry}
                      onChange={handleLimitEntryChange}
                      className="h-3 w-3 rounded border-gray-600 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="ml-1 text-xs text-gray-300">Maker</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Exit Fee Type
                </label>
                <div className="flex space-x-3">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={isMarketExit}
                      onChange={handleMarketExitChange}
                      className="h-3 w-3 rounded border-gray-600 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="ml-1 text-xs text-gray-300">Taker</span>
                  </label>
                  
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={isLimitExit}
                      onChange={handleLimitExitChange}
                      className="h-3 w-3 rounded border-gray-600 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="ml-1 text-xs text-gray-300">Maker</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Decimal Places
                </label>
                <input
                  type="number"
                  min="0"
                  max="8"
                  value={decimalPlaces}
                  onChange={(e) => setDecimalPlaces(parseInt(e.target.value))}
                  className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={toggleAlwaysOnTop}
                  className={`flex items-center px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                    isAlwaysOnTop 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <ArrowUp size={12} className="mr-1" />
                  {isAlwaysOnTop ? 'Disable PiP' : 'Enable PiP'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4">
        <button
          onClick={calculate}
          className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition duration-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-gray-800"
        >
          Calculate
        </button>
      </div>
      
      {calculationError && (
        <div className="mt-3 p-2 bg-red-900/50 border border-red-700 rounded-md text-red-200 text-xs">
          {calculationError}
        </div>
      )}
      
      {positionSizeAfterFees && !calculationError && (
        <div className="mt-4 bg-gray-700/50 border border-gray-600 rounded-lg p-3">
          <h2 className="text-md font-semibold mb-2">Results</h2>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between items-center p-2 bg-gray-700 rounded-md">
              <span className="text-gray-300 text-xs">Size Pre-Fees:</span>
              <div className="flex items-center">
                <span className="font-medium">{positionSizeBeforeFees}</span>
                <button 
                  onClick={() => copyToClipboard(positionSizeBeforeFees)}
                  className="ml-1 text-gray-400 hover:text-white"
                >
                  <Copy size={12} />
                </button>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-2 bg-gray-700 rounded-md">
              <span className="text-gray-300 text-xs">Size Post-Fees:</span>
              <div className="flex items-center">
                <span className="font-medium">{positionSizeAfterFees}</span>
                <button 
                  onClick={() => copyToClipboard(positionSizeAfterFees)}
                  className="ml-1 text-gray-400 hover:text-white"
                >
                  <Copy size={12} />
                </button>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-2 bg-gray-700 rounded-md">
              <span className="text-gray-300 text-xs">Leverage:</span>
              <span className="font-medium">{leverageNeeded}x</span>
            </div>
            
            <div className="flex justify-between items-center p-2 bg-gray-700 rounded-md">
              <span className="text-gray-300 text-xs">Total Fees:</span>
              <span className="font-medium">{feeCost} USDT</span>
            </div>
            
            <div className="flex justify-between items-center p-2 bg-gray-700 rounded-md">
              <span className="text-gray-300 text-xs">Max Risk:</span>
              <div className="flex items-center">
                <span className="font-medium">{maxRisk} USDT</span>
                <button 
                  onClick={() => copyToClipboard(maxRisk)}
                  className="ml-1 text-gray-400 hover:text-white"
                >
                  <Copy size={12} />
                </button>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-2 bg-gray-700 rounded-md">
              <span className="text-gray-300 text-xs">Liquidation:</span>
              <span className={`font-medium ${isLiquidationRisky ? 'text-red-400' : 'text-green-400'}`}>
                {liquidationPrice}
              </span>
            </div>
          </div>
          
          {isLiquidationRisky && (
            <div className="mt-3 p-2 bg-red-900/50 border border-red-700 rounded-md text-red-200 text-xs">
              Warning: Liquidation before stop loss!
            </div>
          )}
        </div>
      )}
    </div>
  );
};