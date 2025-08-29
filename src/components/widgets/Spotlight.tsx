import { motion } from "framer-motion";
import { FileText, Search, Wrench, X } from "lucide-react";
import React, { useRef, useEffect } from "react";
import Modal from "../bases/Modal";
import { IconButton } from "../bases/IconButton";
import type { SearchItem } from "../../types/model";
import { useAnimationVariants } from "../../hooks/useAnimationVariants";

const Spotlight: React.FC<{
    isOpen: boolean;
    query: string;
    setQuery: (q: string) => void;
    onClose: () => void;
    results: SearchItem[];
    onResultClick: (docId: string) => void;
    searchableDocs: SearchItem[];
    isMobile: boolean;
}> = ({ isOpen, query, setQuery, onClose, results, onResultClick, searchableDocs, isMobile }) => {
    const searchInputRef = useRef<HTMLInputElement>(null);
    const { staggeredFadeIn, slideOnHover } = useAnimationVariants();
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            isMobile={isMobile}
            width={isMobile ? "w-[90vw] max-w-md" : "w-[600px]"}
            maxHeight="60vh"
            topOffset="15vh"
            className="overflow-hidden"
            autoFocus={false} // We handle focus manually for the input
        >
            {/* Search Input */}
            <div className="flex items-center gap-4 p-4 border-b border-theme">
                <Search className="w-6 h-6 flex-shrink-0 text-theme-secondary" />
                <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search documentation and tools..."
                    className="flex-1 bg-transparent border-none outline-none text-sm text-theme-primary placeholder:text-theme-secondary"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <IconButton onClick={onClose} icon={<X />} aria-label="Close search" />
            </div>

            {/* Search Results */}
            <div className="max-h-[60vh] overflow-y-auto">
                {query ? (
                    results.length > 0 ? (
                        <div className="p-2">
                            {results.map((doc, index) => (
                                <motion.div
                                    key={`${doc.id}-${doc.path.join("/")}`}
                                    {...staggeredFadeIn(index)}
                                    className="hover:bg-theme-hover cursor-pointer rounded-lg transition-colors duration-200 group"
                                    onClick={() => onResultClick(doc.id)}
                                >
                                    <motion.span className="flex items-center gap-4 p-4" {...slideOnHover}>
                                        <div className="flex-shrink-0">
                                            {doc.type === "tool" ? (
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
                                            <div className="text-theme-primary group-hover:text-theme-accent transition-colors duration-200 truncate">
                                                {doc.title}
                                            </div>
                                            <div className="text-sm text-theme-secondary transition-colors duration-200 truncate">
                                                {doc.category}
                                                {doc.path.length > 1 && (
                                                    <span className="text-theme-secondary/60 ml-2">
                                                        {doc.path.slice(0, -1).join(" → ")}
                                                    </span>
                                                )}
                                            </div>
                                            {doc.tags && doc.tags.length > 0 && (
                                                <div className="flex gap-1 mt-1">
                                                    {doc.tags.slice(0, 3).map((tag) => (
                                                        <span
                                                            key={tag}
                                                            className="text-xs px-2 py-0.5 rounded bg-theme-active text-theme-secondary"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </motion.span>
                                </motion.div>
                            ))}
                            {query.length > 2 && (
                                <div className="px-4 py-2 text-xs text-center border-t border-theme text-theme-secondary">
                                    Showing {results.length} of{" "}
                                    {
                                        searchableDocs.filter(
                                            (doc) =>
                                                doc.title.toLowerCase().includes(query.toLowerCase()) ||
                                                doc.category.toLowerCase().includes(query.toLowerCase()) ||
                                                doc.content.toLowerCase().includes(query.toLowerCase())
                                        ).length
                                    }{" "}
                                    results
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 bg-theme-hover">
                                <Search className="w-6 h-6 text-theme-secondary" />
                            </div>
                            <p className="text-theme-secondary">No results found for "{query}"</p>
                            <p className="text-sm mt-1 text-theme-secondary">
                                Try different keywords or check spelling
                            </p>
                        </div>
                    )
                ) : (
                    <div className="p-8 text-center">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Search className="w-6 h-6 text-theme-secondary" />
                        </div>
                        <p className="mb-2 text-theme-secondary">Search documentation and tools</p>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default Spotlight;
