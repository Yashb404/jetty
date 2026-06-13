"use client";

export function useJettyProgram() {
  return {
    loading: false,
    error: null,
    initializeHookConfig: async () => {},
    initExtraAccountMetaList: async () => {},
    updatePolicy: async () => {},
    updateAllowlist: async () => {},
  };
}
