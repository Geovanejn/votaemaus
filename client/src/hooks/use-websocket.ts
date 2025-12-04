import { useEffect, useState, useCallback, useMemo } from "react";
import { io, Socket } from "socket.io-client";

interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

type EventCallback = (data: unknown) => void;

let sharedSocket: Socket | null = null;
let connectionCount = 0;
const stateListeners = new Set<(connected: boolean, connecting: boolean) => void>();

function getAuthToken(): string | null {
  try {
    const authData = localStorage.getItem("auth");
    if (authData) {
      const parsed = JSON.parse(authData);
      return parsed.token || null;
    }
  } catch {
    console.log("[WebSocket] Could not read auth token from localStorage");
  }
  return null;
}

function notifyStateListeners(connected: boolean, connecting: boolean) {
  stateListeners.forEach((listener) => listener(connected, connecting));
}

function getOrCreateSocket(options: {
  reconnectionAttempts: number;
  reconnectionDelay: number;
}): Socket {
  if (sharedSocket && sharedSocket.connected) {
    return sharedSocket;
  }

  if (sharedSocket) {
    sharedSocket.disconnect();
    sharedSocket = null;
  }

  const token = getAuthToken();

  sharedSocket = io({
    path: "/socket.io",
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: options.reconnectionAttempts,
    reconnectionDelay: options.reconnectionDelay,
    auth: token ? { token } : undefined,
  });

  sharedSocket.on("connect", () => {
    console.log("[WebSocket] Connected:", sharedSocket?.id);
    notifyStateListeners(true, false);
  });

  sharedSocket.on("disconnect", (reason) => {
    console.log("[WebSocket] Disconnected:", reason);
    notifyStateListeners(false, false);
  });

  sharedSocket.on("connect_error", (error) => {
    console.error("[WebSocket] Connection error:", error.message);
    notifyStateListeners(false, false);
  });

  sharedSocket.on("error", (data: { message: string }) => {
    console.warn("[WebSocket] Server error:", data.message);
  });

  notifyStateListeners(false, true);

  return sharedSocket;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { 
    autoConnect = true, 
    reconnectionAttempts = 5,
    reconnectionDelay = 3000 
  } = options;

  const [isConnected, setIsConnected] = useState(sharedSocket?.connected || false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketOptions = useMemo(
    () => ({ reconnectionAttempts, reconnectionDelay }),
    [reconnectionAttempts, reconnectionDelay]
  );

  useEffect(() => {
    const handleStateChange = (connected: boolean, connecting: boolean) => {
      setIsConnected(connected);
      setIsConnecting(connecting);
      if (!connected && !connecting) {
        setError("Connection lost");
      } else {
        setError(null);
      }
    };

    stateListeners.add(handleStateChange);
    connectionCount++;

    if (autoConnect && connectionCount === 1) {
      getOrCreateSocket(socketOptions);
    }

    if (sharedSocket) {
      setIsConnected(sharedSocket.connected);
    }

    return () => {
      stateListeners.delete(handleStateChange);
      connectionCount--;

      if (connectionCount === 0 && sharedSocket) {
        console.log("[WebSocket] No more listeners, disconnecting...");
        sharedSocket.disconnect();
        sharedSocket = null;
      }
    };
  }, [autoConnect, socketOptions]);

  const connect = useCallback(() => {
    getOrCreateSocket(socketOptions);
  }, [socketOptions]);

  const disconnect = useCallback(() => {
    if (sharedSocket) {
      sharedSocket.disconnect();
      sharedSocket = null;
      setIsConnected(false);
    }
  }, []);

  const emit = useCallback(<T = unknown>(event: string, data?: T) => {
    if (sharedSocket?.connected) {
      sharedSocket.emit(event, data);
    } else {
      console.warn("[WebSocket] Cannot emit, not connected");
    }
  }, []);

  const on = useCallback((event: string, callback: EventCallback) => {
    if (sharedSocket) {
      sharedSocket.on(event, callback);
      return () => {
        sharedSocket?.off(event, callback);
      };
    }
    return () => {};
  }, []);

  const off = useCallback((event: string, callback?: EventCallback) => {
    if (callback) {
      sharedSocket?.off(event, callback);
    } else {
      sharedSocket?.off(event);
    }
  }, []);

  return {
    socket: sharedSocket,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    emit,
    on,
    off,
  };
}

export function reconnectWithNewToken(): void {
  if (sharedSocket) {
    sharedSocket.disconnect();
    sharedSocket = null;
  }
  
  const token = getAuthToken();
  if (token) {
    getOrCreateSocket({
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    });
  }
}

export function useElectionUpdates(electionId: number | null) {
  const { on, emit, isConnected } = useWebSocket();
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!electionId || !isConnected) return;

    emit("join:election", { electionId });

    const handleVoteUpdate = (data: unknown) => {
      setLastUpdate(new Date());
      console.log("[Election] Vote update:", data);
    };

    const handleResultUpdate = (data: unknown) => {
      setLastUpdate(new Date());
      console.log("[Election] Result update:", data);
    };

    const handleAttendanceUpdate = (data: unknown) => {
      setLastUpdate(new Date());
      console.log("[Election] Attendance update:", data);
    };

    const unsubVote = on("election:vote", handleVoteUpdate);
    const unsubResult = on("election:result", handleResultUpdate);
    const unsubAttendance = on("election:attendance", handleAttendanceUpdate);

    return () => {
      emit("leave:election", { electionId });
      unsubVote();
      unsubResult();
      unsubAttendance();
    };
  }, [electionId, isConnected, on, emit]);

  return { lastUpdate, isConnected };
}

export function useStudyUpdates(userId: number | null) {
  const { on, emit, isConnected } = useWebSocket();
  const [notifications, setNotifications] = useState<unknown[]>([]);

  useEffect(() => {
    if (!userId || !isConnected) return;

    emit("join:study", { userId });

    const handleXPUpdate = (data: unknown) => {
      setNotifications(prev => [...prev, { type: "xp", data, time: new Date() }]);
    };

    const handleAchievement = (data: unknown) => {
      setNotifications(prev => [...prev, { type: "achievement", data, time: new Date() }]);
    };

    const handleStreakUpdate = (data: unknown) => {
      setNotifications(prev => [...prev, { type: "streak", data, time: new Date() }]);
    };

    const unsubXP = on("study:xp", handleXPUpdate);
    const unsubAchievement = on("study:achievement", handleAchievement);
    const unsubStreak = on("study:streak", handleStreakUpdate);

    return () => {
      emit("leave:study", { userId });
      unsubXP();
      unsubAchievement();
      unsubStreak();
    };
  }, [userId, isConnected, on, emit]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return { notifications, clearNotifications, isConnected };
}
