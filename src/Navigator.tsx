import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, FileText, Wrench } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

import type { TreeNode } from './type';

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

  // Sidebar width constraints
  const MIN_WIDTH = 200;
  const MAX_WIDTH = 500;

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

  const handleOverlayClick = (): void => {
    onCloseSidebar();
  };

  const handleOverlayKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      onCloseSidebar();
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
        {/* Hidden mobile header - invisible but maintains space for actual header */}
        {isMobile && (
          <div className="invisible p-4">
            <h2 className="text-lg font-semibold">Navigation</h2>
          </div>
        )}
        
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
    </>
  );
};

export default Navigator;