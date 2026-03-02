'use client'

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseWebSocketOptions {
  onMessage?: (event: MessageEvent) => void;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
}

export function useWebSocket(url: string | null, options: UseWebSocketOptions = {}) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const [readyState, setReadyState] = useState<number>(WebSocket.CONNECTING);
  const optionsRef = useRef(options);
  
  optionsRef.current = options;

  const sendMessage = useCallback((message: string | ArrayBuffer | Blob) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(message);
    }
  }, [socket]);

  useEffect(() => {
    if (!url) {
      setSocket(null);
      setReadyState(WebSocket.CLOSED);
      return;
    }

    const ws = new WebSocket(url);

    ws.onopen = (event) => {
      setReadyState(WebSocket.OPEN);
      optionsRef.current.onOpen?.(event);
    };

    ws.onmessage = (event) => {
      setLastMessage(event);
      optionsRef.current.onMessage?.(event);
    };

    ws.onclose = (event) => {
      setReadyState(WebSocket.CLOSED);
      optionsRef.current.onClose?.(event);
    };

    ws.onerror = (event) => {
      setReadyState(WebSocket.CLOSED);
      optionsRef.current.onError?.(event);
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [url]);

  return {
    sendMessage,
    lastMessage,
    readyState,
    socket,
  };
}