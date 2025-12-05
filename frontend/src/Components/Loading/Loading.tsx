import React, { useEffect, useMemo, useState } from "react";
import { Loader } from "@mantine/core";

interface LoadingProps {
  isLoading: boolean;
}

const Loading: React.FC<LoadingProps> = ({ isLoading }) => {
  const messages = useMemo(
    () => [
      "Φέρνουμε το ιστορικό παραγγελιών σου…",
      "Υπολογίζουμε σύνολο δαπανών και φιλοδωρημάτων…",
      "Τοποθετούμε τα αγαπημένα σου μαγαζιά στον χάρτη…",
      "Συγκρίνουμε παραδόσεις με παραλαβές…",
      "Βρίσκουμε τα πιο συχνά πιάτα σου…",
      "Ζεσταίνουμε τους πίνακες ελέγχου…",
    ],
    []
  );

  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 1800);

    return () => clearInterval(interval);
  }, [isLoading, messages.length]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-1000 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 text-center px-6 py-5 rounded-lg bg-white/5 shadow-lg border border-white/10">
        <Loader color="red" size="lg" />
        <div className="space-y-1">
          <p className="text-white text-lg font-semibold">Φορτώνουμε τα analytics σου…</p>
          <p className="text-white/80 text-sm" aria-live="polite">
            {messages[messageIndex]}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Loading;
