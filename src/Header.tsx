import { AnimatePresence, motion } from 'framer-motion';
import { FileText, Hash, Menu, Search, Wrench, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

// Types
interface DocTool {
  id: string;
  title: string;
  type: 'doc' | 'tool';
  category: string;
  content: string;
  tags?: string[];
}

interface TreeNode {
  id: string;
  label: string;
  type?: 'doc' | 'tool';
  children?: TreeNode[];
}

interface HeaderProps {
  isMobile: boolean;
  mockDocs: DocTool[];
  navigationTree: TreeNode[];
  onSidebarToggle: () => void;
  onSearchResultClick: (docId: string) => void;
}

// Search utility
const searchDocs = (docs: DocTool[], query: string): DocTool[] => {
  if (!query) return [];
  const lowercaseQuery = query.toLowerCase();
  return docs.filter(doc =>
    doc.title.toLowerCase().includes(lowercaseQuery) ||
    doc.content.toLowerCase().includes(lowercaseQuery) ||
    doc.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  ).slice(0, 5);
};

const Header: React.FC<HeaderProps> = ({
  isMobile,
  mockDocs,
  navigationTree,
  onSidebarToggle,
  onSearchResultClick,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Generate search results
  const searchResults = searchDocs(mockDocs, searchQuery);

  // Handle click outside to collapse search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        if (!searchQuery) {
          setIsSearchExpanded(false);
        }
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchQuery]);

  // Focus input when expanded
  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

  const handleSearchButtonClick = () => {
    setIsSearchExpanded(true);
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSearchDropdown(value.length > 0);
  };

  const handleSearchInputBlur = () => {
    setTimeout(() => {
      if (!searchQuery) {
        setIsSearchExpanded(false);
      }
      setShowSearchDropdown(false);
    }, 200);
  };

  const handleSearchInputFocus = () => {
    if (searchQuery) setShowSearchDropdown(true);
  };

  const handleSearchResultClick = (docId: string) => {
    onSearchResultClick(docId);
    setSearchQuery('');
    setShowSearchDropdown(false);
    setIsSearchExpanded(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowSearchDropdown(false);
    setIsSearchExpanded(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 relative z-50 h-16">
      {isMobile && (
        <motion.div
          animate={{ opacity: isSearchExpanded ? 0 : 1 }}
          transition={{ duration: 0.2 }}
          className={isSearchExpanded ? 'pointer-events-none' : ''}
        >
          <button
            onClick={onSidebarToggle}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        </motion.div>
      )}
      
      <motion.h1 
        className="text-xl font-bold text-gray-900 flex-1"
        animate={{ 
          opacity: isMobile && isSearchExpanded ? 0 : 1,
          x: isMobile && isSearchExpanded ? -20 : 0
        }}
        transition={{ duration: 0.2 }}
      >
        DevDocs Hub
      </motion.h1>
      
      <div className="relative flex items-center" ref={searchContainerRef}>
        <AnimatePresence mode="wait">
          {!isSearchExpanded ? (
            <motion.button
              key="search-button"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              onClick={handleSearchButtonClick}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5 text-gray-600" />
            </motion.button>
          ) : (
            <motion.div
              key="search-input"
              initial={{ 
                opacity: 0, 
                width: isMobile ? 250 : 300
              }}
              animate={{ 
                opacity: 1, 
                width: isMobile ? 250 : 300
              }}
              exit={{ 
                opacity: 0, 
                width: 40
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="relative"
            >
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search docs and tools..."
                className="w-full h-10 pl-10 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                value={searchQuery}
                onChange={handleSearchInputChange}
                onBlur={handleSearchInputBlur}
                onFocus={handleSearchInputFocus}
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors z-10"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        <AnimatePresence>
          {showSearchDropdown && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`absolute bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50 top-12 ${
                isMobile 
                  ? 'right-0 w-64' // Smaller width on mobile, right-aligned
                  : 'right-0 w-80' // Fixed width on desktop, right-aligned
              }`}
            >
              {searchResults.map((doc, index) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                  onClick={() => handleSearchResultClick(doc.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleSearchResultClick(doc.id);
                    }
                  }}
                >
                  {doc.type === 'tool' ? (
                    <Wrench className="w-4 h-4 text-gray-400" />
                  ) : (
                    <FileText className="w-4 h-4 text-gray-400" />
                  )}
                  <div>
                    <div className="font-medium text-gray-900">{doc.title}</div>
                    <div className="text-sm text-gray-500">{doc.category}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Header;