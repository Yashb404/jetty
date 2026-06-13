"use client";

import React, { createContext, useContext } from "react";

const AnchorContext = createContext<any>(null);

export function useAnchorWorkspace() {
  return useContext(AnchorContext);
}

export default function AnchorWorkspaceProvider({ children }: { children: React.ReactNode }) {
  return (
    <AnchorContext.Provider value={{ program: null, provider: null }}>
      {children}
    </AnchorContext.Provider>
  );
}
