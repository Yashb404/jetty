"use client";

export function useAllowlist(mintAddressString: string | null) {
  return {
    entries: [],
    loading: false,
    error: null,
    refetch: async () => {},
  };
}
