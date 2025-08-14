import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, FileText, Wrench, X } from 'lucide-react';
import React from 'react';

// Types
export interface TreeNode {
  id: string;
  label: string;
  type?: 'doc' | 'tool';
  children?: TreeNode[];
}

interface NavigatorProps {
  navigationTree: TreeNode[];
  currentDocId: string;
  expandedNodes: string[];
  isMobile: boolean;
  sidebarOpen: boolean;
  onDocSelect: (docId: string) => void;
  onToggleNode: (nodeId: string) => void;
  onCloseSidebar: () => void;
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
          whileTap={{ scale: 0.98 }}
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
  onDocSelect,
  onToggleNode,
  onCloseSidebar,
}) => {
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
      {/* Sidebar */}
      <motion.div 
        className={`${
          isMobile 
            ? 'fixed inset-0 z-40 bg-white'
            : 'w-64 bg-white border-r border-gray-200'
        }`}
        initial={isMobile ? { x: '-100%' } : false}
        animate={isMobile ? { x: sidebarOpen ? 0 : '-100%' } : {}}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
      >
        {isMobile && sidebarOpen && (
          <motion.div 
            className="flex items-center justify-between p-4 border-b border-gray-200"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <h2 className="text-lg font-semibold">Navigation</h2>
            <motion.button
              onClick={onCloseSidebar}
              className="p-2 hover:bg-gray-100 rounded-lg"
              aria-label="Close sidebar"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <X className="w-5 h-5" />
            </motion.button>
          </motion.div>
        )}
        
        <div className={`${isMobile ? 'p-4 h-full overflow-y-auto' : 'p-4 h-full overflow-y-auto'}`}>
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
      </motion.div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            className="fixed inset-0 bg-black z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleOverlayClick}
            role="button"
            tabIndex={0}
            onKeyDown={handleOverlayKeyDown}
            aria-label="Close sidebar overlay"
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default Navigator;