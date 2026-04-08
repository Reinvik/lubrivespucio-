import React from 'react';

export const SkeletonLoader = () => {
    return (
        <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin"></div>
            <div className="space-y-2 text-center">
                <div className="h-4 w-48 bg-emerald-50 rounded animate-pulse"></div>
                <div className="h-3 w-32 bg-emerald-50 rounded animate-pulse mx-auto"></div>
            </div>
        </div>
    );
};
