"use client";

import { useState, useCallback, useEffect } from "react";

export interface Thread {
  id: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UseThreadsResult {
  threads: Thread[];
  isLoading: boolean;
  error: string | null;
  refreshThreads: () => Promise<void>;
  createThread: (id?: string, name?: string, messages?: { role: string; content: string }[]) => Promise<Thread | null>;
  saveThread: (id: string, name: string | null, messages: { role: string; content: string }[]) => Promise<Thread | null>;
}

export function useThreads(): UseThreadsResult {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshThreads = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/threads");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = await response.json();
      setThreads(Array.isArray(payload?.threads) ? payload.threads : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load threads");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createThread = useCallback(async (
    id?: string,
    name?: string,
    messages?: { role: string; content: string }[]
  ): Promise<Thread | null> => {
    try {
      const response = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name, messages }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const payload = await response.json();
      await refreshThreads();
      return payload.thread;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create thread");
      return null;
    }
  }, [refreshThreads]);

  const saveThread = useCallback(async (
    id: string,
    name: string | null,
    messages: { role: string; content: string }[]
  ): Promise<Thread | null> => {
    try {
      const response = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name, messages }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const payload = await response.json();
      await refreshThreads();
      return payload.thread;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save thread");
      return null;
    }
  }, [refreshThreads]);

  useEffect(() => {
    refreshThreads();
  }, [refreshThreads]);

  return { threads, isLoading, error, refreshThreads, createThread, saveThread };
}
