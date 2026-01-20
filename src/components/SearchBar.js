import React from 'react';
import { Search, X } from 'lucide-react';

const SearchBar = ({ searchQuery, setSearchQuery }) => (
  <header className={STYLES.header}>
    <div className={STYLES.container}>
      <Search size={24} className="text-gray-400" />
      <input 
        type="text"
        placeholder="..."
        className={STYLES.input}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      {searchQuery && (
        <button 
          onClick={() => setSearchQuery('')}
          className={STYLES.clearButton}
          title="Clear search"
        >
          <X size={24} />
        </button>
      )}
    </div>
  </header>
);

const STYLES = {
  header: "sticky top-0 bg-[#fafafa]/95 backdrop-blur-md border-b border-gray-100 z-10",
  container: "max-w-2xl mx-auto px-4 py-5 flex items-center gap-4",
  input: "w-full p-2 bg-transparent border-none focus:ring-0 text-lg placeholder:text-gray-300 text-[#1a1a1a]",
  clearButton: "p-2 -mr-2 text-gray-400 hover:text-black transition-colors active:scale-90"
};

export default SearchBar;