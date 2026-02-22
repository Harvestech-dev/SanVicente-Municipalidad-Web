"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { ClientConfig } from "../config/client-config";
import { loadClientConfigFromAPI } from "../config/client-config-loader";
import { getDefaultConfig } from "../config/default-config";

interface ClientConfigContextType {
  config: ClientConfig | null;
  loading: boolean;
  error: string | null;
  loadConfig: (hostname: string) => Promise<void>;
}

const ClientConfigContext = createContext<ClientConfigContextType | undefined>(
  undefined
);

interface ClientConfigProviderProps {
  children: ReactNode;
  initialConfig?: ClientConfig | null;
}

export function ClientConfigProvider({
  children,
  initialConfig = null,
}: ClientConfigProviderProps) {
  const defaultConfig = getDefaultConfig();
  const [config, setConfig] = useState<ClientConfig | null>(
    initialConfig ?? defaultConfig
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = useCallback(async (hostname: string) => {
    try {
      setLoading(true);
      setError(null);
      const loaded = await loadClientConfigFromAPI(hostname);
      setConfig(loaded ?? getDefaultConfig());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setConfig(getDefaultConfig());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
      setLoading(false);
      setError(null);
    }
  }, [initialConfig]);

  useEffect(() => {
    if (!initialConfig && typeof window !== "undefined") {
      loadConfig(window.location.hostname);
    }
  }, [initialConfig, loadConfig]);

  return (
    <ClientConfigContext.Provider
      value={{ config, loading, error, loadConfig }}
    >
      {children}
    </ClientConfigContext.Provider>
  );
}

export function useClientConfig(): ClientConfigContextType {
  const ctx = useContext(ClientConfigContext);
  if (ctx === undefined) {
    throw new Error(
      "useClientConfig must be used within a ClientConfigProvider"
    );
  }
  return ctx;
}
