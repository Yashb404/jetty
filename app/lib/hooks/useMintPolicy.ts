"use client";

export function useMintPolicy(mintAddressString: string | null) {
  return {
    policy: null,
    loading: false,
    error: null,
    isInitialized: false,
    metaListExists: false,
    refetch: async () => {},
  };
}
