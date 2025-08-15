import { AnimatePresence, motion } from 'framer-motion';
import { FileText, Menu, Search, Wrench, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import type { DocTool, TreeNode } from './type';

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
  ).slice(0, 8);
};

const Header: React.FC<HeaderProps> = ({
  isMobile,
  mockDocs,
  navigationTree,
  onSidebarToggle,
  onSearchResultClick,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Generate search results
  const searchResults = searchDocs(mockDocs, searchQuery);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSearchModalOpen(false);
        setSearchQuery('');
      }
      // CMD/Ctrl + K to open search (like macOS)
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setIsSearchModalOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (isSearchModalOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isSearchModalOpen]);

  const handleSearchClick = () => {
    setIsSearchModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsSearchModalOpen(false);
    setSearchQuery('');
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchResultClick = (docId: string) => {
    onSearchResultClick(docId);
    handleCloseModal();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCloseModal();
    }
  };

  return (
    <>
      {/* Header */}
      <header className="bg-white backdrop-blur-sm border-b border-gray-200/60 px-4 py-3 flex items-center gap-4 relative z-[80] h-16 shadow-sm">
        {/* Mobile menu button */}
        {isMobile && (
          <button
            onClick={onSidebarToggle}
            className="p-2.5 hover:bg-gray-100/80 rounded-xl transition-all duration-200 flex-shrink-0 active:scale-95"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5 text-gray-700" />
          </button>
        )}
        
        {/* Title */}
        <h1 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent select-none flex-1">
          DevDocs Hub
        </h1>
        
        {/* Search button */}
        <motion.button
          onClick={handleSearchClick}
          className="p-2.5 hover:bg-gray-100/80 rounded-xl transition-all duration-200 flex-shrink-0"
        //   whileHover={{ scale: 1.05 }}
        //   whileTap={{ scale: 0.95 }}
          aria-label="Search"
        >
          <Search className="w-5 h-5 text-gray-600" />
        </motion.button>
      </header>

      {/* Search Modal */}
      <AnimatePresence>
        {isSearchModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] flex items-start justify-center pt-[15vh]"
            onClick={handleBackdropClick}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/60 overflow-hidden ${
                isMobile ? 'w-[90vw] max-w-md' : 'w-[600px]'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search Input */}
              <div className="flex items-center gap-4 p-6 border-b border-gray-100/80">
                <Search className="w-6 h-6 text-gray-400 flex-shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search documentation and tools..."
                  className="flex-1 bg-transparent border-none outline-none text-lg text-gray-700 placeholder-gray-400"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                />
                <button
                  onClick={handleCloseModal}
                  className="p-1.5 hover:bg-gray-100/60 rounded-lg transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Search Results */}
              <div className="max-h-[60vh] overflow-y-auto">
                {searchQuery ? (
                  searchResults.length > 0 ? (
                    <div className="p-2">
                      {searchResults.map((doc, index) => (
                        <motion.div
                          key={doc.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.03, duration: 0.2 }}
                          whileHover={{ x: 4 }}
                        //   whileTap={{ scale: 0.98 }}
                          className="flex items-center gap-4 p-4 hover:bg-gray-100 cursor-pointer rounded-lg transition-colors duration-200 group"
                          onClick={() => handleSearchResultClick(doc.id)}
                        >
                          <div className="flex-shrink-0">
                            {doc.type === 'tool' ? (
                              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors duration-200">
                                <Wrench className="w-5 h-5 text-blue-600" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors duration-200">
                                <FileText className="w-5 h-5 text-green-600" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-700 group-hover:text-gray-900 transition-colors duration-200 truncate">
                              {doc.title}
                            </div>
                            <div className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-200 truncate">
                              {doc.category}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Search className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-gray-500">No results found for "{searchQuery}"</p>
                    </div>
                  )
                ) : (
                  <div className="p-8 text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Search className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-2">Search documentation and tools</p>
                    <p className="text-sm text-gray-400">
                      {/* Press <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">⌘K</kbd> to open search anytime */}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;