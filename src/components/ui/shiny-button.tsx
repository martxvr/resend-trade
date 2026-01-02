
import React from 'react';
import { cn } from '@/lib/utils';

interface ShinyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
}

export function ShinyButton({ children, className, ...props }: ShinyButtonProps) {
    return (
        <div className="inline-block bg-transparent group h-full">
            <button
                className={cn("shiny-cta focus:outline-none h-full flex items-center justify-center py-0", className)}
                {...props}
            >
                <span>{children}</span>
            </button>
        </div>
    );
}
