import React from 'react';

interface JournalEntryProps {
  notes: string;
  setNotes: (notes: string) => void;
  systemName: string;
  setSystemName: (systemName: string) => void;
  entryPicUrl: string;
  setEntryPicUrl: (entryPicUrl: string) => void;
  isDisabled: boolean;
}

export const JournalEntry: React.FC<JournalEntryProps> = ({
  notes,
  setNotes,
  systemName,
  setSystemName,
  entryPicUrl,
  setEntryPicUrl,
  isDisabled
}) => {
  return (
    <div className="mt-3 bg-gray-700/30 border border-gray-600 rounded-md p-3 space-y-3">
      <h3 className="text-sm font-medium text-gray-300">Journal Entry Details</h3>
      
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">
            System Name
          </label>
          <input
            type="text"
            value={systemName}
            onChange={(e) => setSystemName(e.target.value)}
            disabled={isDisabled}
            className={`w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              isDisabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            placeholder="Enter trading system name"
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">
            Entry Picture URL
          </label>
          <input
            type="text"
            value={entryPicUrl}
            onChange={(e) => setEntryPicUrl(e.target.value)}
            disabled={isDisabled}
            className={`w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              isDisabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            placeholder="https://example.com/chart-screenshot.png"
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isDisabled}
            rows={3}
            className={`w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none ${
              isDisabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            placeholder="Add your trade notes here..."
          />
        </div>
      </div>
    </div>
  );
};
