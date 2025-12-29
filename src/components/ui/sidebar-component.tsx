"use client";

import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    Home,
    Users,
    Trophy,
    Settings,
    ChevronLeft,
    ChevronRight,
    Plus,
    UserPlus,
    Globe,
    LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarCallbacks {
    onCreateRoom?: () => void;
    onJoinRoom?: () => void;
}

interface SidebarLayoutProps {
    children?: React.ReactNode;
    onCreateRoom?: () => void;
    onJoinRoom?: () => void;
}

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    isActive?: boolean;
    onClick?: () => void;
    isCollapsed?: boolean;
}

function NavItem({ icon, label, isActive, onClick, isCollapsed }: NavItemProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all duration-300",
                "hover:bg-white/10",
                isActive && "bg-white/10 text-white",
                !isActive && "text-white/60 hover:text-white",
                isCollapsed && "justify-center px-2"
            )}
            title={isCollapsed ? label : undefined}
        >
            <div className="shrink-0">{icon}</div>
            {!isCollapsed && (
                <span className="text-sm font-medium truncate">{label}</span>
            )}
        </button>
    );
}

export function SidebarLayout({ children, onCreateRoom, onJoinRoom }: SidebarLayoutProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const toggleSidebar = () => setIsCollapsed(!isCollapsed);

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="flex min-h-screen bg-[#0a0a0a] text-white">
            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed left-0 top-0 h-full z-50",
                    "flex flex-col",
                    "bg-black/40 backdrop-blur-xl",
                    "border-r border-white/5",
                    "transition-all duration-300 ease-out",
                    isCollapsed ? "w-16" : "w-64"
                )}
            >
                {/* Logo & Toggle */}
                <div className={cn(
                    "flex items-center h-16 px-4 border-b border-white/5",
                    isCollapsed ? "justify-center" : "justify-between"
                )}>
                    {!isCollapsed && (
                        <div
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={() => navigate('/')}
                        >
                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                <span className="text-white font-bold text-sm">TB</span>
                            </div>
                            <span className="font-semibold text-white">TradeBias</span>
                        </div>
                    )}

                    <button
                        onClick={toggleSidebar}
                        className={cn(
                            "p-1.5 rounded-lg transition-colors",
                            "hover:bg-white/10 text-white/60 hover:text-white",
                            isCollapsed && "w-8 h-8 flex items-center justify-center"
                        )}
                    >
                        {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>
                </div>

                {/* Quick Actions */}
                <div className={cn(
                    "px-3 py-4 border-b border-white/5",
                    isCollapsed && "px-2"
                )}>
                    {!isCollapsed && (
                        <p className="text-[10px] uppercase tracking-wider text-white/30 mb-2 px-3">
                            Quick Actions
                        </p>
                    )}
                    <div className="space-y-1">
                        <NavItem
                            icon={<Plus size={18} />}
                            label="Create Room"
                            onClick={onCreateRoom}
                            isCollapsed={isCollapsed}
                        />
                        <NavItem
                            icon={<UserPlus size={18} />}
                            label="Join Room"
                            onClick={onJoinRoom}
                            isCollapsed={isCollapsed}
                        />
                    </div>
                </div>

                {/* Navigation */}
                <div className={cn(
                    "flex-1 px-3 py-4 overflow-y-auto",
                    isCollapsed && "px-2"
                )}>
                    {!isCollapsed && (
                        <p className="text-[10px] uppercase tracking-wider text-white/30 mb-2 px-3">
                            Navigation
                        </p>
                    )}
                    <div className="space-y-1">
                        <NavItem
                            icon={<Users size={18} />}
                            label="Trading Rooms"
                            isActive={isActive('/dashboard')}
                            onClick={() => navigate('/dashboard')}
                            isCollapsed={isCollapsed}
                        />
                        <NavItem
                            icon={<Trophy size={18} />}
                            label="Leaderboard"
                            isActive={isActive('/leaderboard')}
                            onClick={() => navigate('/leaderboard')}
                            isCollapsed={isCollapsed}
                        />
                    </div>
                </div>

                {/* Bottom Section */}
                <div className={cn(
                    "px-3 py-4 border-t border-white/5",
                    isCollapsed && "px-2"
                )}>
                    <div className="space-y-1">
                        <NavItem
                            icon={<Settings size={18} />}
                            label="Settings"
                            isActive={isActive('/profile')}
                            onClick={() => navigate('/profile')}
                            isCollapsed={isCollapsed}
                        />
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className={cn(
                "flex-1 min-h-screen transition-all duration-300",
                isCollapsed ? "ml-16" : "ml-64"
            )}>
                {children}
            </main>
        </div>
    );
}

export default SidebarLayout;
