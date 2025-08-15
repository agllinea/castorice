import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, FileText, Search, Wrench, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import type { DocTool, SearchableDoc, TreeNode } from './type';

interface NavigatorProps {
  navigationTree: TreeNode[];
  currentDocId: string;
  expandedNodes: string[];
  isMobile: boolean;
  sidebarOpen: boolean;
  sidebarWidth: number;
  onDocSelect: (docId: string) => void;
  onToggleNode: (nodeId: string) => void;
  onCloseSidebar: () => void;
  onSidebarResize: (width: number) => void;
}

interface TreeNodeComponentProps {
  node: TreeNode;
  level?: number;
  currentDocId: string;
  expandedNodes: string[];
  isMobile: boolean;
  onDocSelect: (docId: string) => void;
  onToggleNode: (nodeId: string) => void;
}

// Build searchable docs from navigation tree
const buildSearchableDocs = (nodes: TreeNode[], parentPath: string[] = []): SearchableDoc[] => {
  const docs: SearchableDoc[] = [];
  
  const processNode = (node: TreeNode, currentPath: string[]) => {
    const fullPath = [...currentPath, node.id];
    
    if (node.component) {
      // For components, create a searchable entry with basic info
      docs.push({
        id: node.id,
        title: node.label || node.id,
        type: 'tool',
        category: currentPath.length > 0 ? currentPath[0] : 'Interactive Tool',
        content: `Interactive ${node.label || node.id} tool component`,
        tags: ['interactive', 'tool', 'component'],
        path: fullPath
      });
    } else if (node.id.endsWith('.md') || (!node.children && !node.component)) {
      // For markdown files, create a searchable entry (content will be loaded when needed)
      docs.push({
        id: node.id,
        title: node.label || node.id.replace(/\.md$/, ''),
        type: 'doc',
        category: currentPath.length > 0 ? currentPath[0] : 'Documentation',
        content: '', // Content will be loaded when needed for better search
        tags: [],
        path: fullPath
      });
    }
    
    if (node.children) {
      node.children.forEach(child => processNode(child, fullPath));
    }
  };
  
  nodes.forEach(node => processNode(node, parentPath));
  return docs;
};

// Enhanced search utility with better matching
const searchDocs = (docs: SearchableDoc[], query: string): SearchableDoc[] => {
  if (!query) return [];
  
  const lowercaseQuery = query.toLowerCase();
  const queryWords = lowercaseQuery.split(' ').filter(word => word.length > 0);
  
  return docs
    .map(doc => {
      let score = 0;
      const titleLower = doc.title.toLowerCase();
      const categoryLower = doc.category.toLowerCase();
      const contentLower = doc.content.toLowerCase();
      
      // Title matches (highest priority)
      if (titleLower.includes(lowercaseQuery)) {
        score += 100;
      }
      queryWords.forEach(word => {
        if (titleLower.includes(word)) score += 50;
      });
      
      // Category matches
      if (categoryLower.includes(lowercaseQuery)) {
        score += 30;
      }
      queryWords.forEach(word => {
        if (categoryLower.includes(word)) score += 15;
      });
      
      // Content matches (for components, this will be basic description)
      if (contentLower.includes(lowercaseQuery)) {
        score += 20;
      }
      queryWords.forEach(word => {
        if (contentLower.includes(word)) score += 10;
      });
      
      // Tag matches
      doc.tags?.forEach(tag => {
        if (tag.toLowerCase().includes(lowercaseQuery)) {
          score += 40;
        }
        queryWords.forEach(word => {
          if (tag.toLowerCase().includes(word)) score += 20;
        });
      });
      
      // Path matches (for nested items)
      const pathStr = doc.path.join(' ').toLowerCase();
      if (pathStr.includes(lowercaseQuery)) {
        score += 10;
      }
      
      return { doc, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ doc }) => doc);
};

const TreeNodeComponent: React.FC<TreeNodeComponentProps> = ({
  node,
  level = 0,
  currentDocId,
  expandedNodes,
  isMobile,
  onDocSelect,
  onToggleNode,
}) => {
  const handleNodeClick = (): void => {
    if (node.children) {
      onToggleNode(node.id);
    } else {
      onDocSelect(node.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleNodeClick();
    }
  };

  return (
    <div className="select-none">
      {node.children ? (
        <div>
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${
              level > 0 ? 'ml-4' : ''
            }`}
            onClick={handleNodeClick}
            role="button"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            aria-expanded={expandedNodes.includes(node.id)}
            aria-label={`${expandedNodes.includes(node.id) ? 'Collapse' : 'Expand'} ${node.label}`}
          >
            <motion.div
              animate={{ rotate: expandedNodes.includes(node.id) ? 90 : 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="flex items-center justify-center"
            >
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </motion.div>
            <span className="font-medium text-gray-700">{node.label}</span>
          </div>
          <AnimatePresence initial={false}>
            {expandedNodes.includes(node.id) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{
                  duration: 0.3,
                  ease: "easeInOut",
                  opacity: { duration: 0.2 }
                }}
                className="overflow-hidden"
              >
                <div className="ml-6 space-y-1 pt-1">
                  {node.children.map((child, index) => (
                    <motion.div
                      key={child.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        duration: 0.15,
                        delay: index * 0.03, // Subtle stagger for smoother appearance
                        ease: "easeOut"
                      }}
                    >
                      <TreeNodeComponent
                        node={child}
                        level={level + 1}
                        currentDocId={currentDocId}
                        expandedNodes={expandedNodes}
                        isMobile={isMobile}
                        onDocSelect={onDocSelect}
                        onToggleNode={onToggleNode}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div
          whileHover={{ x: 2 }}
          transition={{ duration: 0.1 }}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${
            currentDocId === node.id ? 'bg-blue-50 text-blue-700' : 'text-gray-600'
          } ${level > 0 ? 'ml-4' : ''}`}
          onClick={handleNodeClick}
          role="button"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          aria-label={`Select ${node.label}`}
          aria-current={currentDocId === node.id ? 'page' : undefined}
        >
          {node.type === 'tool' ? (
            <Wrench className="w-4 h-4" />
          ) : (
            <FileText className="w-4 h-4" />
          )}
          <span className="text-sm">{node.label}</span>
        </motion.div>
      )}
    </div>
  );
};

const Navigator: React.FC<NavigatorProps> = ({
  navigationTree,
  currentDocId,
  expandedNodes,
  isMobile,
  sidebarOpen,
  sidebarWidth,
  onDocSelect,
  onToggleNode,
  onCloseSidebar,
  onSidebarResize,
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(sidebarWidth);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [searchableDocs, setSearchableDocs] = useState<SearchableDoc[]>([]);
  const [loadedContent, setLoadedContent] = useState<Map<string, string>>(new Map());
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sidebar width constraints
  const MIN_WIDTH = 200;
  const MAX_WIDTH = 500;

  // Build searchable docs from navigation tree
  useEffect(() => {
    const docs = buildSearchableDocs(navigationTree);
    setSearchableDocs(docs);
  }, [navigationTree]);

  // Load content for markdown files when needed for better search
  const loadContentForSearch = async (doc: SearchableDoc) => {
    if (doc.type === 'tool' || loadedContent.has(doc.id)) {
      return;
    }

    try {
      const filePath = `/docs/${doc.path.join('/')}${doc.id.endsWith('.md') ? '' : '.md'}`;
      const response = await fetch(filePath);
      if (response.ok) {
        const content = await response.text();
        setLoadedContent(prev => new Map(prev).set(doc.id, content));
        
        // Update the searchable doc with loaded content
        setSearchableDocs(prev => prev.map(d => 
          d.id === doc.id ? { ...d, content } : d
        ));
      }
    } catch (error) {
      console.warn(`Could not load content for search: ${doc.id}`);
    }
  };

  // Pre-load content for better search experience (debounced)
  useEffect(() => {
    if (searchQuery.length > 2) {
      const timer = setTimeout(() => {
        searchableDocs
          .filter(doc => doc.type === 'doc' && !loadedContent.has(doc.id))
          .slice(0, 3) // Load only first few to avoid too many requests
          .forEach(loadContentForSearch);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [searchQuery, searchableDocs, loadedContent]);

  // Generate search results
  const searchResults = searchDocs(searchableDocs, searchQuery);

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

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isMobile) return;
    
    e.preventDefault();
    setIsResizing(true);
    setStartX(e.clientX);
    setStartWidth(sidebarWidth);
    
    // Add cursor style to body
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [isMobile, sidebarWidth]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const deltaX = e.clientX - startX;
    const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + deltaX));
    onSidebarResize(newWidth);
  }, [isResizing, startX, startWidth, onSidebarResize]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    
    // Remove cursor style from body
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const handleDocSelect = (docId: string): void => {
    onDocSelect(docId);
    if (isMobile) {
      onCloseSidebar();
    }
  };

  const handleSearchResultClick = (docId: string) => {
    handleDocSelect(docId);
    handleCloseModal();
  };

  const handleOverlayClick = (): void => {
    onCloseSidebar();
  };

  const handleOverlayKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      onCloseSidebar();
    }
  };

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

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCloseModal();
    }
  };

  return (
    <>
      {/* Sidebar - Always rendered on mobile, positioned with transform */}
      <motion.div 
        className={`${
          isMobile 
            ? 'fixed inset-0 z-50 bg-white'
            : 'bg-white border-r border-gray-200 relative'
        }`}
        style={!isMobile ? { width: sidebarWidth } : undefined}
        initial={isMobile ? { x: '-100%' } : false}
        animate={isMobile ? { x: sidebarOpen ? 0 : '-100%' } : {}}
        transition={isMobile ? { 
          type: "tween", 
          duration: 0.35, 
          ease: [0.25, 0.1, 0.25, 1] // Material Design easing
        } : { type: "spring", damping: 30, stiffness: 300 }}
      >
        {/* Header Section with Title and Search */}
        <div className="bg-white backdrop-blur-sm border-b border-gray-200/60 px-4 py-3 flex items-center gap-4 relative z-[80] h-14 shadow-sm">
          {/* Title */}
          <h1 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent select-none flex-1">
            DevDocs Hub
          </h1>
          
          {/* Search button */}
          <motion.button
            onClick={handleSearchClick}
            className="p-2.5 hover:bg-gray-100/80 rounded-xl transition-all duration-200 flex-shrink-0"
            aria-label="Search"
          >
            <Search className="w-5 h-5 text-gray-600" />
          </motion.button>
        </div>
        
        <div className="p-4 h-full overflow-y-auto">
          <nav className="space-y-2" role="navigation" aria-label="Documentation navigation">
            {navigationTree.map(node => (
              <TreeNodeComponent
                key={node.id}
                node={node}
                currentDocId={currentDocId}
                expandedNodes={expandedNodes}
                isMobile={isMobile}
                onDocSelect={handleDocSelect}
                onToggleNode={onToggleNode}
              />
            ))}
          </nav>
        </div>

        {/* Resize Handle - Desktop Only */}
        {!isMobile && (
          <div
            className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-400 transition-colors group ${
              isResizing ? 'bg-blue-500' : 'bg-transparent'
            }`}
            onMouseDown={handleMouseDown}
          >
            {/* Visual indicator on hover */}
            <div className={`absolute top-0 right-0 w-1 h-full transition-all ${
              isResizing ? 'bg-blue-500' : 'bg-gray-300 opacity-0 group-hover:opacity-100'
            }`} />
          </div>
        )}
      </motion.div>

      {/* Mobile overlay - Always rendered, controlled by opacity and pointer events */}
      {isMobile && (
        <motion.div
          className="fixed inset-0 bg-black z-40"
          style={{
            pointerEvents: sidebarOpen ? 'auto' : 'none'
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: sidebarOpen ? 0.5 : 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={handleOverlayClick}
          role="button"
          tabIndex={sidebarOpen ? 0 : -1}
          onKeyDown={handleOverlayKeyDown}
          aria-label="Close sidebar overlay"
          aria-hidden={!sidebarOpen}
        />
      )}

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
                          key={`${doc.id}-${doc.path.join('/')}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.03, duration: 0.2 }}
                          whileHover={{ x: 4 }}
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
                              {doc.path.length > 1 && (
                                <span className="text-gray-400 ml-2">
                                  {doc.path.slice(0, -1).join(' → ')}
                                </span>
                              )}
                            </div>
                            {doc.tags && doc.tags.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {doc.tags.slice(0, 3).map(tag => (
                                  <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                      {searchQuery.length > 2 && (
                        <div className="px-4 py-2 text-xs text-gray-500 text-center border-t border-gray-100">
                          Showing {searchResults.length} of {searchableDocs.filter(doc => 
                            doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            doc.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            doc.content.toLowerCase().includes(searchQuery.toLowerCase())
                          ).length} results
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Search className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-gray-500">No results found for "{searchQuery}"</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Try different keywords or check spelling
                      </p>
                    </div>
                  )
                ) : (
                  <div className="p-8 text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Search className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-2">Search documentation and tools</p>
                    <p className="text-sm text-gray-400">
                      Press <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Ctrl+K</kbd> to open search anytime
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

export default Navigator;