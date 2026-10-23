"use client";
import { useState, useEffect, useCallback } from "react";
import {
  createRealtimeClient,
  type SealedLiveQuery,
} from "@neon/realtime/client";
import { RealtimeProvider, useLiveQuery } from "@neon/realtime-react";
import type { Revision } from "../lib/types";
export default function LiveUpdates({
  userId,
  onChange,
  onStatus,
}: {
  userId: string;
  onChange: () => void;
  onStatus: (s: string) => void;
}) {
  const [config, setConfig] = useState<{
    sealed: SealedLiveQuery<Revision>;
    url: string;
  } | null>(null);
  const [retry, setRetry] = useState(0);
  const fetchQuery = useCallback(async () => {
    const r = await fetch(`/api/live?userId=${encodeURIComponent(userId)}`, {
      cache: "no-store",
    });
    if (r.status === 401) {
      window.location.assign("/auth/sign-in");
      throw new Error("Signed out");
    }
    if (!r.ok) throw new Error("Live updates unavailable");
    return r.json();
  }, [userId]);
  useEffect(() => {
    let active = true;
    fetchQuery()
      .then((v) => {
        if (active) setConfig(v);
      })
      .catch(() => onStatus("Updates paused"));
    return () => {
      active = false;
    };
  }, [fetchQuery, onStatus, retry]);
  if (!config)
    return (
      <button className="text-button" onClick={() => setRetry((r) => r + 1)}>
        Reconnect updates
      </button>
    );
  return (
    <Connection
      key={retry}
      config={config}
      refresh={async () => (await fetchQuery()).sealed}
      onChange={onChange}
      onStatus={onStatus}
    />
  );
}
function Connection({
  config,
  refresh,
  onChange,
  onStatus,
}: {
  config: { sealed: SealedLiveQuery<Revision>; url: string };
  refresh: () => Promise<SealedLiveQuery<Revision>>;
  onChange: () => void;
  onStatus: (s: string) => void;
}) {
  const [client, setClient] = useState<ReturnType<
    typeof createRealtimeClient
  > | null>(null);
  useEffect(() => {
    const connection = createRealtimeClient({ url: config.url });
    setClient(connection);
    return () => connection.close();
  }, [config.url]);
  if (!client) return null;
  return (
    <RealtimeProvider client={client}>
      <Listener
        sealed={config.sealed}
        refresh={refresh}
        onChange={onChange}
        onStatus={onStatus}
      />
    </RealtimeProvider>
  );
}
function Listener({
  sealed,
  refresh,
  onChange,
  onStatus,
}: {
  sealed: SealedLiveQuery<Revision>;
  refresh: () => Promise<SealedLiveQuery<Revision>>;
  onChange: () => void;
  onStatus: (s: string) => void;
}) {
  const { data, status } = useLiveQuery(sealed, { refreshQuery: refresh });
  const revision = data?.[0]?.revision;
  useEffect(() => {
    if (revision !== undefined) onChange();
  }, [revision, onChange]);
  useEffect(() => {
    onStatus(
      status === "live"
        ? "Live updates on"
        : status === "error"
          ? "Updates paused"
          : "Connecting…",
    );
  }, [status, onStatus]);
  return status === "error" ? (
    <button className="text-button" onClick={() => window.location.reload()}>
      Reconnect
    </button>
  ) : null;
}
