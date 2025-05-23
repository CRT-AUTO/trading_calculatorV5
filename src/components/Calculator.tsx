import React, { useState, useEffect, useRef } from 'react';
import { Copy, Save, Plus, X, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { JournalEntry } from './JournalEntry';

interface CalculatorProps {
  livePrice: string;
  selectedCrypto: string;
  webhookUrl: string;
}

interface OpenTrade {
  id: string;
  symbol: string;
  direction: string;
  entryPrice: number;
  stopLossPrice: number;
  positionSize: number;
  timestamp: string;
  systemName: string;
}

export const Calculator: React.FC<CalculatorProps> = ({ livePrice, selectedCrypto, webhookUrl }) => {
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
  
  // State for compounding mode
  const [isCompounding, setIsCompounding] = useState<boolean>(false);
  const [existingPositionSize, setExistingPositionSize] = useState<string>('');
  const [existingEntryPrice, setExistingEntryPrice] = useState<string>('');
  const [existingRiskAmount, setExistingRiskAmount] = useState<string>('');
  const [remainingRiskAmount, setRemainingRiskAmount] = useState<string>('');
  const [weightedAverageEntry, setWeightedAverageEntry] = useState<string>('');
  const [totalPositionSize, setTotalPositionSize] = useState<string>('');
  
  // State for journal entry
  const [systemName, setSystemName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [entryPicUrl, setEntryPicUrl] = useState<string>('');
  
  // State for open trades
  const [openTrades, setOpenTrades] = useState<OpenTrade[]>([]);
  const [tradeClosingStatus, setTradeClosingStatus] = useState<{
    loading: boolean;
    tradeId: string | null;
    error: string | null;
  }>({
    loading: false,
    tradeId: null,
    error: null
  });
  
  // State for webhook success/error
  const [webhookStatus, setWebhookStatus] = useState<{
    loading: boolean;
    success: boolean;
    error: string | null;
  }>({
    loading: false,
    success: false,
    error: null
  });

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
    }
    
    // Load open trades from localStorage
    const savedTrades = localStorage.getItem('openTrades');
    if (savedTrades) {
      setOpenTrades(JSON.parse(savedTrades));
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
  ]);
  
  // Save open trades to localStorage when they change
  useEffect(() => {
    localStorage.setItem('openTrades', JSON.stringify(openTrades));
  }, [openTrades]);

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

  const toggleCompounding = () => {
    if (!isCompounding && positionSizeAfterFees) {
      // When enabling compounding, pre-fill existing position data from current calculation
      setExistingPositionSize(positionSizeAfterFees);
      setExistingEntryPrice(entryPrice);
      
      // Calculate the existing risk
      const entry = parseFloat(entryPrice);
      const stopLoss = parseFloat(stopLossPrice);
      const fees = parseFloat(feeCost);
      const posSize = parseFloat(positionSizeAfterFees);
      const priceDiff = Math.abs(entry - stopLoss);
      
      const existingRisk = (posSize * priceDiff) + fees;
      setExistingRiskAmount(existingRisk.toFixed(2));
      
      // Calculate remaining risk from total risk amount
      const totalRisk = parseFloat(riskAmount);
      const remaining = totalRisk - existingRisk;
      setRemainingRiskAmount(remaining > 0 ? remaining.toFixed(2) : '0');
    }
    
    setIsCompounding(!isCompounding);
  };

  const calculate = () => {
    try {
      setCalculationError(null);
      setDebugInfo(null);
      
      if (!isCompounding) {
        // Regular calculation (non-compounding)
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
        
        // Set weighted average entry (for consistency with compounding mode)
        setWeightedAverageEntry(entry.toFixed(2));
        setTotalPositionSize(positionSize.toFixed(decimalPlaces));
      } else {
        // Compounding calculation
        // Parse input values
        const existingPosition = parseFloat(existingPositionSize);
        const existingEntry = parseFloat(existingEntryPrice);
        const newEntry = parseFloat(entryPrice);
        const stopLoss = parseFloat(stopLossPrice);
        const totalRisk = parseFloat(riskAmount);
        const capital = parseFloat(availableCapital);
        const tolerance = 0.1 / 100; // Hard-coded tolerance value of 0.1%

        // Validate inputs
        if (isNaN(existingPosition) || isNaN(existingEntry) || isNaN(newEntry) || isNaN(stopLoss) || isNaN(totalRisk) || isNaN(capital)) {
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

        // Determine if it's a long or short trade (based on new entry vs stop loss)
        const isLongTrade = newEntry < stopLoss;
        
        // Calculate total risk from existing position (based on new stop loss)
        const existingPriceDifference = Math.abs(existingEntry - stopLoss);
        const existingEntryFee = existingPosition * existingEntry * entryFeeRate;
        const existingExitFee = existingPosition * stopLoss * exitFeeRate;
        const existingFees = existingEntryFee + existingExitFee;
        const existingRisk = (existingPosition * existingPriceDifference) + existingFees;
        
        // Calculate remaining risk for the new position
        let remainingRisk = Math.max(0, totalRisk - existingRisk);
        
        // If the remaining risk is zero or negative, it means the existing position
        // already uses all available risk or more. In this case, instead of showing an error,
        // we'll calculate how much we can add without increasing total risk.
        
        if (remainingRisk <= 0) {
          // Calculate the new effective entry price (weighted average)
          // This lets us know if we're adding to the position at a better price
          // which could allow adding more size without increasing risk
          
          // Check if the new entry is better (from a risk perspective) than the existing entry
          const isBetterEntry = (isLongTrade && newEntry > existingEntry) || 
                               (!isLongTrade && newEntry < existingEntry);
          
          if (isBetterEntry) {
            // We can add to the position at this better price,
            // but we need to calculate how much we can add without exceeding the total risk
            
            // Calculate the price difference for the new position
            const newPriceDifference = Math.abs(newEntry - stopLoss);
            
            // Calculate the weighted average entry if we add position
            // Start with a small position size and increase iteratively
            let additionalSize = 0;
            let tempTotalSize = existingPosition;
            let tempWeightedAvgEntry = existingEntry;
            let tempTotalRisk = existingRisk;
            
            const sizeIncrement = Math.min(1, existingPosition / 10); // Start with 10% of existing
            const maxIterations = 100;
            
            for (let i = 0; i < maxIterations; i++) {
              // Increment position size
              additionalSize += sizeIncrement;
              tempTotalSize = existingPosition + additionalSize;
              
              // Calculate new weighted average entry
              tempWeightedAvgEntry = ((existingPosition * existingEntry) + (additionalSize * newEntry)) / tempTotalSize;
              
              // Calculate price difference from weighted avg to stop loss
              const avgToPriceDifference = Math.abs(tempWeightedAvgEntry - stopLoss);
              
              // Calculate fees
              const newEntryFee = additionalSize * newEntry * entryFeeRate;
              const totalExitFee = tempTotalSize * stopLoss * exitFeeRate;
              const totalFees = existingEntryFee + newEntryFee + totalExitFee;
              
              // Calculate total risk
              tempTotalRisk = (tempTotalSize * avgToPriceDifference) + totalFees;
              
              // If we exceed our risk tolerance, back up one step and break
              if (tempTotalRisk > totalRisk) {
                additionalSize -= sizeIncrement;
                tempTotalSize = existingPosition + additionalSize;
                tempWeightedAvgEntry = ((existingPosition * existingEntry) + (additionalSize * newEntry)) / tempTotalSize;
                break;
              }
            }
            
            // If we can add at least a small amount
            if (additionalSize > 0) {
              // Calculate fees for this additional position
              const additionalEntryFee = additionalSize * newEntry * entryFeeRate;
              const totalExitFee = tempTotalSize * stopLoss * exitFeeRate;
              const totalFees = existingEntryFee + additionalEntryFee + totalExitFee;
              
              // Calculate leverage based on total position
              const leverage = (tempTotalSize * tempWeightedAvgEntry) / capital;
              
              // Liquidation price calculation
              let liquidation;
              if (isLongTrade) { // Long trade
                liquidation = tempWeightedAvgEntry * (1 - (1 / leverage));
              } else { // Short trade
                liquidation = tempWeightedAvgEntry * (1 + (1 / leverage));
              }
              
              // Check if liquidation happens before the stop loss
              const willBeLiquidated = (isLongTrade && liquidation > stopLoss) ||
                                       (!isLongTrade && liquidation < stopLoss);
              
              // Set results
              setPositionSizeBeforeFees(additionalSize.toFixed(decimalPlaces));
              setPositionSizeAfterFees(additionalSize.toFixed(decimalPlaces)); // Same since we already factored in fees
              setLeverageNeeded(leverage.toFixed(2));
              setFeeCost((additionalEntryFee + (totalExitFee - existingExitFee)).toFixed(2)); // Only additional fees
              setLiquidationPrice(liquidation.toFixed(2));
              setMaxRisk((totalRisk - tempTotalRisk).toFixed(decimalPlaces)); // Remaining risk
              setIsLiquidationRisky(willBeLiquidated);
              setRemainingRiskAmount('0'); // No remaining risk, we're using better entry to add size
              setWeightedAverageEntry(tempWeightedAvgEntry.toFixed(2));
              setTotalPositionSize(tempTotalSize.toFixed(decimalPlaces));
              
              setDebugInfo(`Better entry allows adding ${additionalSize.toFixed(decimalPlaces)} units without increasing risk.`);
              return;
            } else {
              setCalculationError('Cannot add to position - already at maximum risk');
              setPositionSizeBeforeFees('0');
              setPositionSizeAfterFees('0');
              setLeverageNeeded('0');
              setFeeCost('0');
              setLiquidationPrice('0');
              setMaxRisk('0');
              setIsLiquidationRisky(false);
              setRemainingRiskAmount('0');
              return;
            }
          } else {
            setCalculationError('Cannot add to position - already at maximum risk and new entry is worse');
            setPositionSizeBeforeFees('0');
            setPositionSizeAfterFees('0');
            setLeverageNeeded('0');
            setFeeCost('0');
            setLiquidationPrice('0');
            setMaxRisk('0');
            setIsLiquidationRisky(false);
            setRemainingRiskAmount('0');
            return;
          }
        }
        
        // Calculate price difference for new position
        const newPriceDifference = Math.abs(newEntry - stopLoss);
        
        // Raw position size for new position (without fees)
        const rawPositionSize = remainingRisk / newPriceDifference;
        
        // Iteratively calculate the position size, considering both fees and tolerance
        let totalFees, actualRisk, positionSize = rawPositionSize;
        const toleranceAmount = tolerance * remainingRisk; // Tolerance value
        
        const maxIterations = 100;  // Limit the number of iterations
        let iteration = 0;
        
        do {
          // Calculate fees based on current position size
          const entryFee = positionSize * newEntry * entryFeeRate;
          const exitFee = positionSize * stopLoss * exitFeeRate;
          totalFees = entryFee + exitFee;
          
          // Actual risk including fees
          actualRisk = positionSize * newPriceDifference + totalFees;
          
          // Adjust the position size if the actual risk exceeds the target risk with tolerance
          if (Math.abs(remainingRisk - actualRisk) > toleranceAmount) {
            if (actualRisk > remainingRisk) {
              positionSize *= (remainingRisk - toleranceAmount) / actualRisk;
            } else {
              positionSize *= (remainingRisk + toleranceAmount) / actualRisk;
            }
          }
          
          iteration++;
        } while (Math.abs(remainingRisk - actualRisk) > toleranceAmount && iteration < maxIterations);
        
        // Calculate Maximum Risk after Fees
        const maxRiskAfterFees = remainingRisk - totalFees;
        
        // Calculate combined position size
        const combinedPositionSize = existingPosition + positionSize;
        
        // Calculate weighted average entry price
        let weightedAverageEntryValue;
        if (combinedPositionSize > 0) {
          weightedAverageEntryValue = ((existingPosition * existingEntry) + (positionSize * newEntry)) / combinedPositionSize;
        } else {
          weightedAverageEntryValue = 0;
        }
        
        // Calculate leverage needed based on combined position size and weighted average entry
        const leverage = weightedAverageEntryValue > 0 ? (combinedPositionSize * weightedAverageEntryValue) / capital : 0;
        
        // Check for maximum leverage of 100
        if (leverage > 100) {
          setCalculationError('Leverage exceeds 100x. Please increase capital to reduce leverage.');
          return;
        }
        
        // Liquidation price calculation
        let liquidation;
        
        if (isLongTrade) { // Long trade
          // Liquidation price for long trades
          liquidation = weightedAverageEntryValue * (1 - (1 / leverage));
        } else { // Short trade
          // Liquidation price for short trades
          liquidation = weightedAverageEntryValue * (1 + (1 / leverage));
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
        setExistingRiskAmount(existingRisk.toFixed(2));
        setRemainingRiskAmount(remainingRisk.toFixed(2));
        setWeightedAverageEntry(weightedAverageEntryValue.toFixed(2));
        setTotalPositionSize(combinedPositionSize.toFixed(decimalPlaces));
        
        // Add debug info for compounding
        setDebugInfo(`Weighted Avg Entry: ${weightedAverageEntryValue.toFixed(2)}, Combined Position: ${combinedPositionSize.toFixed(decimalPlaces)}`);
      }
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
  
  // Function to send trade data to webhook
  const saveToJournal = async () => {
    // Validate that we have calculation results
    if (!positionSizeAfterFees || !entryPrice || !stopLossPrice) {
      setWebhookStatus({
        loading: false,
        success: false,
        error: 'Please calculate the position first'
      });
      return;
    }
    
    setWebhookStatus({
      loading: true,
      success: false,
      error: null
    });
    
    // Determine if long or short
    const isLong = parseFloat(entryPrice) < parseFloat(stopLossPrice);
    const direction = isLong ? 'LONG' : 'SHORT';
    
    // Generate a unique ID for the trade
    const tradeId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Prepare data for webhook
    const tradeData = {
      id: tradeId,
      symbol: selectedCrypto,
      entryPrice: parseFloat(entryPrice),
      stopLossPrice: parseFloat(stopLossPrice),
      positionSize: parseFloat(positionSizeAfterFees),
      riskAmount: parseFloat(riskAmount),
      leverage: parseFloat(leverageNeeded),
      direction: direction,
      feeCost: parseFloat(feeCost),
      liquidationPrice: parseFloat(liquidationPrice),
      timestamp: new Date().toISOString(),
      isMarketEntry: isMarketEntry,
      isLimitEntry: isLimitEntry,
      isMarketExit: isMarketExit,
      isLimitExit: isLimitExit,
      // Add compounding data if in compounding mode
      isCompounding: isCompounding,
      ...(isCompounding && {
        existingPositionSize: parseFloat(existingPositionSize),
        existingEntryPrice: parseFloat(existingEntryPrice),
        existingRiskAmount: parseFloat(existingRiskAmount),
        remainingRiskAmount: parseFloat(remainingRiskAmount),
        totalPositionSize: parseFloat(totalPositionSize),
        weightedAverageEntry: parseFloat(weightedAverageEntry)
      }),
      // Add journal entry data
      notes: notes.trim(),
      systemName: systemName.trim(),
      entryPicUrl: entryPicUrl.trim()
    };
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tradeData),
      });
      
      if (response.ok) {
        // Add trade to open trades list
        const newOpenTrade: OpenTrade = {
          id: tradeId,
          symbol: selectedCrypto,
          direction: direction,
          entryPrice: parseFloat(entryPrice),
          stopLossPrice: parseFloat(stopLossPrice),
          positionSize: parseFloat(positionSizeAfterFees),
          timestamp: new Date().toISOString(),
          systemName: systemName.trim() || 'Unnamed Trade'
        };
        
        setOpenTrades(prev => [...prev, newOpenTrade]);
        
        setWebhookStatus({
          loading: false,
          success: true,
          error: null
        });
        
        // Reset success message after 3 seconds
        setTimeout(() => {
          setWebhookStatus(prev => ({
            ...prev,
            success: false
          }));
        }, 3000);
      } else {
        const errorText = await response.text();
        setWebhookStatus({
          loading: false,
          success: false,
          error: `Error: ${response.status} - ${errorText}`
        });
      }
    } catch (error) {
      setWebhookStatus({
        loading: false,
        success: false,
        error: `Error: ${(error as Error).message}`
      });
    }
  };
  
  // Function to close a trade
  const closeTrade = async (tradeId: string) => {
    // Find the trade in our open trades
    const trade = openTrades.find(t => t.id === tradeId);
    if (!trade) {
      console.error('Trade not found:', tradeId);
      return;
    }
    
    setTradeClosingStatus({
      loading: true,
      tradeId: tradeId,
      error: null
    });
    
    try {
      // Prepare data for close webhook
      const closeData = {
        id: trade.id,
        symbol: trade.symbol,
        direction: trade.direction,
        entryPrice: trade.entryPrice,
        stopLossPrice: trade.stopLossPrice,
        positionSize: trade.positionSize,
        timestamp: trade.timestamp,
        closeTimestamp: new Date().toISOString(),
        systemName: trade.systemName
      };
      
      // Send to close webhook
      const response = await fetch('https://hook.eu2.make.com/huepvcula9eku5pko08rt7glz4zg5uck', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(closeData),
      });
      
      if (response.ok) {
        // Remove trade from open trades
        setOpenTrades(prev => prev.filter(t => t.id !== tradeId));
        
        setTradeClosingStatus({
          loading: false,
          tradeId: null,
          error: null
        });
      } else {
        const errorText = await response.text();
        setTradeClosingStatus({
          loading: false,
          tradeId: null,
          error: `Error: ${response.status} - ${errorText}`
        });
      }
    } catch (error) {
      setTradeClosingStatus({
        loading: false,
        tradeId: null,
        error: `Error: ${(error as Error).message}`
      });
    }
  };

  return (
    <div>
      <div>
        {/* Changed from grid-cols-1 lg:grid-cols-2 to grid-cols-1 lg:grid-cols-3 for wider layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Left column: Input fields */}
          <div className="space-y-4">
            <h2 className="text-md font-semibold mb-2">Trade Parameters</h2>
            
            <div className="space-y-3">
              {isCompounding && (
                <div className="bg-blue-900/30 border border-blue-700/50 rounded-md p-3 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium text-blue-300">Compounding Mode</h3>
                    <button 
                      onClick={toggleCompounding}
                      className="text-xs px-2 py-1 bg-blue-800 hover:bg-blue-700 text-white rounded-md transition"
                    >
                      Disable
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">
                        Existing Position Size
                      </label>
                      <input
                        type="text"
                        value={existingPositionSize}
                        onChange={(e) => setExistingPositionSize(e.target.value)}
                        className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Existing position size"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">
                        Existing Entry Price
                      </label>
                      <input
                        type="text"
                        value={existingEntryPrice}
                        onChange={(e) => setExistingEntryPrice(e.target.value)}
                        className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Existing entry price"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">
                        Existing Risk
                      </label>
                      <input
                        type="text"
                        value={existingRiskAmount}
                        readOnly
                        className="w-full px-2 py-1 text-sm bg-gray-700/50 border border-gray-600 rounded-md text-gray-300 focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">
                        Remaining Risk
                      </label>
                      <input
                        type="text"
                        value={remainingRiskAmount}
                        readOnly
                        className="w-full px-2 py-1 text-sm bg-gray-700/50 border border-gray-600 rounded-md text-gray-300 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  {isCompounding ? "New Entry Price" : "Entry Price"}
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
                  {isCompounding ? "Total Risk Amount (USDT)" : "Risk Amount (USDT)"}
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
              
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Decimal Places: {decimalPlaces}
                </label>
                <div className="flex items-center">
                  <input
                    type="range"
                    min="0"
                    max="8"
                    step="1"
                    value={decimalPlaces}
                    onChange={(e) => setDecimalPlaces(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex gap-2">
              <button
                onClick={calculate}
                className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition duration-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-gray-800"
              >
                Calculate
              </button>
              
              {!isCompounding && (
                <button
                  onClick={toggleCompounding}
                  disabled={!positionSizeAfterFees}
                  className={`flex items-center justify-center py-2 px-3 text-sm font-medium rounded-md transition duration-200 focus:outline-none ${
                    !positionSizeAfterFees
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  <Plus size={14} className="mr-1" />
                  Compound
                </button>
              )}
            </div>
            
            {/* Webhook status message */}
            {webhookStatus.success && (
              <div className="p-2 bg-green-900/50 border border-green-700 rounded-md text-green-200 text-xs">
                Trade successfully added to journal!
              </div>
            )}
            
            {webhookStatus.error && (
              <div className="p-2 bg-red-900/50 border border-red-700 rounded-md text-red-200 text-xs">
                {webhookStatus.error}
              </div>
            )}
            
            {calculationError && (
              <div className="p-2 bg-red-900/50 border border-red-700 rounded-md text-red-200 text-xs">
                {calculationError}
              </div>
            )}
            
            {debugInfo && (
              <div className="p-2 bg-gray-800 border border-gray-600 rounded-md text-gray-300 text-xs">
                {debugInfo}
              </div>
            )}
          </div>
          
          {/* Middle column: Results */}
          <div className="space-y-4">
            {positionSizeAfterFees && !calculationError ? (
              <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-3 h-full">
                <h2 className="text-md font-semibold mb-3">Results</h2>
                
                <div className="space-y-3">
                  {/* Position Size Post-Fees (Highlighted) */}
                  <div className="flex justify-between items-center p-3 bg-blue-900/30 border border-blue-700/50 rounded-md">
                    <span className="text-blue-200 font-medium">
                      {isCompounding ? "Additional Size:" : "Size Post-Fees:"}
                    </span>
                    <div className="flex items-center">
                      <span className="text-lg font-bold text-white">{positionSizeAfterFees}</span>
                      <button 
                        onClick={() => copyToClipboard(positionSizeAfterFees)}
                        className="ml-1 text-gray-400 hover:text-white"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Other results */}
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    {isCompounding && (
                      <div className="flex justify-between items-center p-2 bg-purple-900/30 border border-purple-700/50 rounded-md">
                        <span className="text-purple-200 text-xs">Total Position Size:</span>
                        <div className="flex items-center">
                          <span className="font-medium">{totalPositionSize}</span>
                          <button 
                            onClick={() => copyToClipboard(totalPositionSize)}
                            className="ml-1 text-gray-400 hover:text-white"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center p-2 bg-gray-700 rounded-md">
                      <span className="text-gray-300 text-xs">
                        {isCompounding ? "Additional Size Pre-Fees:" : "Size Pre-Fees:"}
                      </span>
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
                    
                    {isCompounding && (
                      <div className="flex justify-between items-center p-2 bg-gray-700 rounded-md">
                        <span className="text-gray-300 text-xs">Weighted Avg Entry:</span>
                        <div className="flex items-center">
                          <span className="font-medium">{weightedAverageEntry}</span>
                          <button 
                            onClick={() => copyToClipboard(weightedAverageEntry)}
                            className="ml-1 text-gray-400 hover:text-white"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center p-2 bg-gray-700 rounded-md">
                      <span className="text-gray-300 text-xs">Leverage:</span>
                      <span className="font-medium">{leverageNeeded}x</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-2 bg-gray-700 rounded-md">
                      <span className="text-gray-300 text-xs">
                        {isCompounding ? "Additional Fees:" : "Total Fees:"}
                      </span>
                      <span className="font-medium">{feeCost} USDT</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-2 bg-gray-700 rounded-md">
                      <span className="text-gray-300 text-xs">
                        {isCompounding ? "Remaining Risk:" : "Max Risk:"}
                      </span>
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
              </div>
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-700/20 border border-gray-700 border-dashed rounded-lg p-6">
                <div className="text-center text-gray-500">
                  <p className="mb-2">Enter trade details and click Calculate</p>
                  <p className="text-xs">Results will appear here</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Right column: Journal Entry */}
          <div className="space-y-4">
            <h2 className="text-md font-semibold mb-2">Journal Entry</h2>
            
            <JournalEntry 
              notes={notes}
              setNotes={setNotes}
              systemName={systemName}
              setSystemName={setSystemName}
              entryPicUrl={entryPicUrl}
              setEntryPicUrl={setEntryPicUrl}
              isDisabled={!positionSizeAfterFees}
            />
            
            {/* Add to Journal button */}
            <button
              onClick={saveToJournal}
              disabled={!positionSizeAfterFees || webhookStatus.loading}
              className={`w-full flex items-center justify-center py-2 px-3 text-sm font-medium rounded-md transition duration-200 focus:outline-none ${
                !positionSizeAfterFees || webhookStatus.loading
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {webhookStatus.loading ? (
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-white border-opacity-50"></span>
              ) : (
                <>
                  <Save size={14} className="mr-1" />
                  Add to Journal
                </>
              )}
            </button>
            
            {/* Open Trades Section */}
            <div className="mt-4 bg-gray-700/50 border border-gray-600 rounded-lg p-3">
              <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center justify-between">
                <span>Open Trades</span>
                {openTrades.length > 0 && (
                  <span className="text-xs text-gray-400">{openTrades.length} trade{openTrades.length !== 1 ? 's' : ''}</span>
                )}
              </h3>
              
              {openTrades.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {openTrades.map((trade) => {
                    const isLong = trade.direction === 'LONG';
                    const formattedTime = new Date(trade.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const formattedDate = new Date(trade.timestamp).toLocaleDateString();
                    
                    return (
                      <div key={trade.id} className="p-2 bg-gray-800 rounded-md">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center">
                            <span className={`text-xs font-medium ${isLong ? 'text-green-400' : 'text-red-400'}`}>
                              {trade.symbol} {isLong ? '↑' : '↓'}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-xs text-gray-400 mr-2">{formattedTime} {formattedDate}</span>
                            <button 
                              onClick={() => closeTrade(trade.id)}
                              disabled={tradeClosingStatus.loading && tradeClosingStatus.tradeId === trade.id}
                              className={`text-xs px-2 py-0.5 ${
                                tradeClosingStatus.loading && tradeClosingStatus.tradeId === trade.id
                                  ? 'bg-gray-600 text-gray-400'
                                  : 'bg-red-600 hover:bg-red-700 text-white'
                              } rounded-md`}
                            >
                              {tradeClosingStatus.loading && tradeClosingStatus.tradeId === trade.id ? (
                                <RefreshCw size={12} className="animate-spin" />
                              ) : (
                                'Close'
                              )}
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          <div>
                            <span className="text-gray-400">Size:</span> <span>{trade.positionSize}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Entry:</span> <span>{trade.entryPrice}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Stop:</span> <span>{trade.stopLossPrice}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">System:</span> <span>{trade.systemName}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-gray-500 text-xs p-4">
                  <p>No open trades</p>
                  <p className="text-xs mt-1">Trades will appear here when you add them to your journal</p>
                </div>
              )}
              
              {tradeClosingStatus.error && (
                <div className="mt-2 p-2 bg-red-900/50 border border-red-700 rounded-md text-red-200 text-xs">
                  {tradeClosingStatus.error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
