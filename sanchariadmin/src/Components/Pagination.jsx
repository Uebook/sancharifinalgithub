import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const Pagination = ({
    currentPage,
    totalItems,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
    itemsPerPageOptions = [10, 25, 50, 100]
}) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    if (totalItems === 0) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const getPageNumbers = () => {
        const pages = [];
        const maxPagesToShow = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        return pages;
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-slate-900/80 border-t border-slate-800/80 rounded-b-2xl text-xs text-slate-400">
            {/* Entry Summary */}
            <div className="flex items-center gap-3">
                <span>
                    Showing <strong className="text-white font-semibold">{startItem}</strong> to{' '}
                    <strong className="text-white font-semibold">{endItem}</strong> of{' '}
                    <strong className="text-white font-semibold">{totalItems}</strong> entries
                </span>

                {onItemsPerPageChange && (
                    <div className="flex items-center gap-1.5 ml-2">
                        <span>Per page:</span>
                        <select
                            className="bg-slate-800 border border-slate-700 text-white rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                            value={itemsPerPage}
                            onChange={(e) => {
                                onItemsPerPageChange(Number(e.target.value));
                                onPageChange(1);
                            }}
                        >
                            {itemsPerPageOptions.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-slate-300"
                    title="First Page"
                >
                    <ChevronsLeft size={16} />
                </button>
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-slate-300"
                    title="Previous Page"
                >
                    <ChevronLeft size={16} />
                </button>

                {getPageNumbers().map(pageNum => (
                    <button
                        key={pageNum}
                        onClick={() => onPageChange(pageNum)}
                        className={`w-8 h-8 rounded-lg font-bold text-xs transition-all ${pageNum === currentPage
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                : 'bg-slate-800/80 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white'
                            }`}
                    >
                        {pageNum}
                    </button>
                ))}

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-slate-300"
                    title="Next Page"
                >
                    <ChevronRight size={16} />
                </button>
                <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-slate-300"
                    title="Last Page"
                >
                    <ChevronsRight size={16} />
                </button>
            </div>
        </div>
    );
};

export default Pagination;
