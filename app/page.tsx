"use client";

import { useEffect, useState } from "react";
import { createClient } from "../src/lib/supabase";

type Memory = {
  id: string;
  image_url: string;
  date_text: string;
  message: string;
};

export default function GalleryPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchMemories = async () => {
      const { data, error } = await supabase
        .from("memories")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar dados:", error);
      } else {
        setMemories(data || []);
      }
      setLoading(false);
    };

    fetchMemories();
  }, [supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f9] flex items-center justify-center">
        <span className="text-zinc-400 tracking-widest uppercase text-xs font-semibold animate-pulse">
          Carregando registros...
        </span>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf8f9] py-24 px-6 sm:px-12">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-20 space-y-3">
          <h1 className="text-4xl md:text-5xl font-serif text-zinc-900 tracking-tight">
            Nossa História
          </h1>
          <p className="text-zinc-400 font-light tracking-widest uppercase text-xs">
            Nossas lembranças até aqui
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {memories.map((memory) => (
            <FlipCard key={memory.id} memory={memory} />
          ))}
        </div>
      </div>
    </main>
  );
}

function FlipCard({ memory }: { memory: Memory }) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className="relative w-full aspect-[3/4] cursor-pointer group [perspective:1000px]"
      onClick={() => setIsFlipped(!isFlipped)}
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
            alt="Registro visual"
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
