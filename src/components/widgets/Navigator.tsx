// Refactored TreeNode using base components
import { ChevronRight, FileText, Wrench } from "lucide-react";

import { TreeBranch, TreeNode } from "../bases/TreeView";
import type { TreeNodeItem } from "../../types/model";

const Navigator: React.FC<{
    node: TreeNodeItem;
    level?: number;
    currentDocId: string;
    expandedNodes: string[];
    isMobile: boolean;
    onDocSelect: (docId: string) => void;
    onToggleNode: (nodeId: string) => void;
}> = ({
    node,
    level = 0,
    currentDocId,
    expandedNodes,
    isMobile,
    onDocSelect,
    onToggleNode,
}) => {
    const isActive = currentDocId === node.id;
    const isExpanded = expandedNodes.includes(node.id);

    if (node.children) {
        return (
            <TreeBranch
                isExpanded={isExpanded}
                onToggle={() => onToggleNode(node.id)}
                icon={<ChevronRight className="w-4 h-4 text-theme-secondary" />}
                label={node.label ?? ""}
            >
                {node.children.map((child) => (
                    <Navigator
                        key={child.id}
                        node={child}
                        level={level + 1}
                        currentDocId={currentDocId}
                        expandedNodes={expandedNodes}
                        isMobile={isMobile}
                        onDocSelect={onDocSelect}
                        onToggleNode={onToggleNode}
                    />
                ))}
            </TreeBranch>
        );
    }

    return (
        <TreeNode
            isActive={isActive}
            onClick={() => onDocSelect(node.id)}
            aria-label={`Select ${node.label}`}
            aria-current={isActive ? "page" : undefined}
        >
            {node.type === "tool" ? (
                <Wrench className={`w-4 h-4 ${isActive ? "text-theme-accent" : "text-theme-secondary"}`} />
            ) : (
                <FileText className={`w-4 h-4 ${isActive ? "text-theme-accent" : "text-theme-secondary"}`} />
            )}
            <span className="text-sm whitespace-nowrap overflow-hidden text-ellipsis">{node.label}</span>
        </TreeNode>
    );
};

export default Navigator;
