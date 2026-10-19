"use client";

import { useState, useEffect } from "react";
import { WorkspaceSidebar } from "./WorkspaceSidebar";
import { WorkspaceHeader } from "./WorkspaceHeader";

export interface WorkspaceShellProps {
  tenantSlug: string;
  children: React.ReactNode;
}

export function WorkspaceShell({ tenantSlug, children }: WorkspaceShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile drawer when pressing Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased">
      {/* Sidebar navigation */}
      <WorkspaceSidebar
        tenantSlug={tenantSlug}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Workspace Frame */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Sticky Header */}
        <WorkspaceHeader
          tenantSlug={tenantSlug}
          onToggleMobileMenu={() => setIsMobileOpen((prev) => !prev)}
        />

        {/* Scrollable Work Area */}
        <main className="flex-1 overflow-y-auto focus-visible:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}

export default WorkspaceShell;
