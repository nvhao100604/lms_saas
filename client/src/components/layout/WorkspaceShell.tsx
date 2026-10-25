"use client";

import { useState, useEffect } from "react";
import { Box } from "@mui/material";
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
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        width: "100%",
        overflow: "hidden",
        bgcolor: "background.default",
        color: "text.primary",
      }}
    >
      {/* Sidebar navigation */}
      <WorkspaceSidebar
        tenantSlug={tenantSlug}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Workspace Frame */}
      <Box
        sx={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        {/* Sticky Header */}
        <WorkspaceHeader
          tenantSlug={tenantSlug}
          onToggleMobileMenu={() => setIsMobileOpen((prev) => !prev)}
        />

        {/* Scrollable Work Area */}
        <Box
          component="main"
          sx={{
            flex: 1,
            overflowY: "auto",
            "&:focus-visible": {
              outline: "none",
            },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}

export default WorkspaceShell;
