import React from 'react';
import { Search } from 'lucide-react';

const SearchBar = ({ searchQuery, setSearchQuery }) => (
  <header className="sticky top-0 bg-[#fafafa]/80 backdrop-blur-md border-b border-gray-100 z-10">
    <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-3">
      <Search size={18} className="text-gray-400" />
      <input 
        type="text"
        placeholder="..."
        className="w-full bg-transparent p-2 border-gray-100 focus:ring-0 text-sm placeholder:text-gray-300"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
  </header>
);

export default SearchBar;
