"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "../src/lib/supabase";

type Memory = {
  id: string;
  image_url: string;
  date_text: string;
  message: string;
  event_date: string; // <-- Adicionado para a ordenação real
};

export default function GalleryPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [playingCardId, setPlayingCardId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const fetchMemories = async () => {
      const { data, error } = await supabase
        .from("memories")
        .select("*")
        .order("event_date", { ascending: false }); // <-- Ordena pelas datas mais recentes primeiro

      if (error) {
        console.error("Erro ao buscar dados:", error);
      } else {
        setMemories(data || []);
      }
      setLoading(false);
    };
    fetchMemories();
  }, [supabase]);

  const handleToggleAudio = (cardId: string) => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;

    if (playingCardId === cardId) {
      iframeRef.current.contentWindow.postMessage(
        '{"event":"command","func":"pauseVideo","args":""}',
        "*",
      );
      setPlayingCardId(null);
    } else {
      iframeRef.current.contentWindow.postMessage(
        '{"event":"command","func":"playVideo","args":""}',
        "*",
      );
      setPlayingCardId(cardId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f9] flex items-center justify-center">
        <span className="text-zinc-400 tracking-widest uppercase text-xs font-semibold animate-pulse">
          Carregando registos...
        </span>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf8f9] py-24 px-6 sm:px-12 relative overflow-hidden">
      {/* Player do YouTube Oculto */}
      <iframe
        ref={iframeRef}
        className="hidden"
        width="0"
        height="0"
        src="https://www.youtube.com/embed/yzTuBuRdAyA?enablejsapi=1&start=41&end=218&autoplay=0&controls=0&playsinline=1"
        allow="autoplay"
      ></iframe>

      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-20 space-y-3">
          <h1 className="text-4xl md:text-5xl font-serif font-bold italic text-[#de9dac] tracking-tight">
            tour em nossos momentos
          </h1>
          <p className="text-zinc-400 font-light tracking-[0.3em] uppercase text-[10px]">
            Linha do tempo protegida
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {memories.map((memory) => (
            <FlipCard
              key={memory.id}
              memory={memory}
              onToggleAudio={() => handleToggleAudio(memory.id)}
            />
          ))}
        </div>

        <footer className="mt-32 pb-8 text-center">
          <a
            href="/admin"
            className="text-zinc-300 hover:text-zinc-600 transition-colors text-[10px] uppercase tracking-[0.2em] font-light"
          >
            Painel de Controle
          </a>
        </footer>
      </div>
    </main>
  );
}

function FlipCard({
  memory,
  onToggleAudio,
}: {
  memory: Memory;
  onToggleAudio: () => void;
}) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleClick = () => {
    setIsFlipped(!isFlipped);
    onToggleAudio();
  };

  return (
    <div
      className="relative w-full aspect-[3/4] cursor-pointer group [perspective:1000px]"
      onClick={handleClick}
    >
      <div
        className={`w-full h-full transition-all duration-[800ms] [transform-style:preserve-3d] border border-zinc-100 shadow-sm ${
          isFlipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* Face Frontal */}
        <div className="absolute inset-0 [backface-visibility:hidden] bg-white">
          <img
            src={memory.image_url}
            alt="Registo visual"
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-102"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
        </div>

        {/* Face Traseira */}
        <div className="absolute inset-0 h-full w-full bg-white px-8 py-12 text-center [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col justify-center items-center border border-zinc-200 shadow-inner">
          <span className="text-zinc-900 font-serif italic text-base mb-6 block border-b border-zinc-200 pb-3 w-3/4 mx-auto">
            {memory.date_text}
          </span>
          <p className="text-zinc-600 font-light leading-relaxed text-sm tracking-wide">
            {memory.message}
          </p>
        </div>
      </div>
    </div>
  );
}
