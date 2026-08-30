"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";

const ExpertChatbot = dynamic(
  () =>
    import("@/components/chat/ExpertChatbot").then((m) => ({
      default: m.ExpertChatbot,
    })),
  { ssr: false },
);

type ExpertChatApi = {
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
};

const ExpertChatApiContext = createContext<ExpertChatApi | null>(null);

export function useExpertChat(): ExpertChatApi {
  const api = useContext(ExpertChatApiContext);
  if (!api) {
    throw new Error("useExpertChat must be used within ExpertChatProvider");
  }
  return api;
}

function shouldOpenExpertChat(link: HTMLAnchorElement): boolean {
  const href = (link.getAttribute("href") || "").trim().toLowerCase();
  const label = (link.textContent || "").trim().toLowerCase();
  if (href === "#talk-to-expert" || href.endsWith("#talk-to-expert")) return true;
  if (label.includes("talk to an expert")) return true;
  return false;
}

export function ExpertChatProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const openChat = useCallback(() => setOpen(true), []);
  const closeChat = useCallback(() => setOpen(false), []);
  const toggleChat = useCallback(() => setOpen((v) => !v), []);

  const api = useMemo(
    () => ({ openChat, closeChat, toggleChat }),
    [openChat, closeChat, toggleChat],
  );

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element).closest("a");
      if (!link || !shouldOpenExpertChat(link)) return;
      event.preventDefault();
      setOpen(true);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    const onHash = () => {
      if (window.location.hash.toLowerCase() === "#talk-to-expert") {
        setOpen(true);
        history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    };
    onHash();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return (
    <ExpertChatApiContext.Provider value={api}>
      {children}
      <ExpertChatbot open={open} onClose={closeChat} />
    </ExpertChatApiContext.Provider>
  );
}
