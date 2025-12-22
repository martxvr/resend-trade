"use client";

import React from "react";

interface BackgroundSnippetProps {
    variant?: "light" | "dark";
    className?: string;
}

// Light variant with grid and purple gradient
export function BackgroundSnippetLight({ className }: { className?: string }) {
    return (
        <div className={`absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem] ${className || ""}`}>
            <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_800px_at_100%_200px,#d5c5ff,transparent)]"></div>
        </div>
    );
}

// Dark variant with purple ellipse gradient - perfect for dark themes
export function BackgroundSnippetDark({ className }: { className?: string }) {
    return (
        <div
            className={`absolute inset-0 z-0 h-full w-full ${className || ""}`}
            style={{
                background: `
                    radial-gradient(ellipse 100% 40% at 50% 0%, rgba(60, 55, 80, 0.08) 0%, transparent 50%)
                `
            }}
        />
    );
}

// Default export with variant prop
export function BackgroundSnippet({ variant = "dark", className }: BackgroundSnippetProps) {
    if (variant === "light") {
        return <BackgroundSnippetLight className={className} />;
    }
    return <BackgroundSnippetDark className={className} />;
}

export default BackgroundSnippet;
