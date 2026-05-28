"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../src/lib/supabase";

type Memory = {
  id: string;
  image_url: string;
  date_text: string;
  message: string;
  event_date: string; // <-- Adicionado na tipagem
};

export default function AdminPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [dateText, setDateText] = useState("");
  const [eventDate, setEventDate] = useState(""); // <-- Novo estado para controlar a ordenação
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>("");

  const supabase = createClient();

  const fetchMemories = async () => {
    const { data, error } = await supabase
      .from("memories")
      .select("*")
      .order("event_date", { ascending: false }); // <-- Mudado de created_at para event_date
    if (!error && data) setMemories(data);
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  const handleEditClick = (memory: Memory) => {
    setEditingId(memory.id);
    setDateText(memory.date_text);
    setEventDate(memory.event_date || ""); // <-- Carrega a data de ordenação ao editar
    setMessage(memory.message);
    setCurrentImageUrl(memory.image_url);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFile(null);
    setDateText("");
    setEventDate(""); // <-- Limpa o novo estado
    setMessage("");
    setCurrentImageUrl("");
  };

  const handleDeleteClick = async (id: string) => {
    if (!confirm("Confirmar a exclusão definitiva deste registro?")) return;

    const { error } = await supabase.from("memories").delete().eq("id", id);
    if (error) {
      alert("Erro ao excluir do banco de dados. Verifique o console.");
      console.error(error);
    } else {
      fetchMemories();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalImageUrl = currentImageUrl;

      if (file) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("memories-images")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("memories-images").getPublicUrl(fileName);

        finalImageUrl = publicUrl;
      }

      if (editingId) {
        const { error: updateError } = await supabase
          .from("memories")
          .update({
            image_url: finalImageUrl,
            date_text: dateText,
            event_date: eventDate, // <-- Atualiza no banco
            message: message,
          })
          .eq("id", editingId);

        if (updateError) throw updateError;
        alert("Registro atualizado com sucesso.");
      } else {
        if (!file) {
          alert("Selecione uma imagem para o novo registro.");
          setLoading(false);
          return;
        }

        const { error: insertError } = await supabase.from("memories").insert([
          {
            image_url: finalImageUrl,
            date_text: dateText,
            event_date: eventDate, // <-- Insere no banco
            message: message,
          },
        ]);

        if (insertError) throw insertError;
        alert("Novo registro salvo com sucesso.");
      }

      handleCancelEdit();
      fetchMemories();
    } catch (error) {
      console.error(error);
      alert("Ocorreu um erro na operação. Verifique os logs (F12).");
    } finally {
      loading && setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f9] py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Botão de Voltar */}
        <div className="mb-8">
          <a
            href="/"
            className="text-xs font-semibold text-zinc-400 hover:text-zinc-900 uppercase tracking-widest transition-colors flex items-center gap-2 w-fit"
          >
            &larr; Voltar para a Galeria
          </a>
        </div>

        {/* Formulário de Upload/Edição */}
        <div className="bg-white p-10 border border-zinc-200 shadow-sm rounded-none">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-serif text-zinc-900 tracking-tight mb-2">
              {editingId ? "Editar Registro" : "Novo Registro"}
            </h1>
            <p className="text-sm font-light text-zinc-500 uppercase tracking-widest">
              {editingId ? "Modo de Atualização" : "Painel de Controle"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                {editingId ? "Substituir Fotografia (Opcional)" : "Fotografia"}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-zinc-600 file:mr-4 file:py-2.5 file:px-4 file:border-0 file:text-xs file:font-semibold file:uppercase file:tracking-wider file:bg-zinc-100 file:text-zinc-900 hover:file:bg-zinc-200 cursor-pointer transition-colors outline-none"
              />
              {editingId && !file && (
                <p className="text-xs text-zinc-400 mt-2">
                  Mantendo a imagem atual cadastrada.
                </p>
              )}
            </div>

            {/* Campo de Texto para Exibição Charmosa */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                Texto de Data (Exibido no Card)
              </label>
              <input
                type="text"
                value={dateText}
                onChange={(e) => setDateText(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 px-4 py-3 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors placeholder:text-zinc-400 text-sm"
                placeholder="Ex: 12 de Junho de 2024"
                required
              />
            </div>

            {/* NOVO CAMPO: Filtro de Calendário para o Sistema Ordenar Cronologicamente */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                Data do Evento (Apenas para Ordenação Automática)
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 px-4 py-3 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors placeholder:text-zinc-400 text-sm cursor-pointer"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                Mensagem do Verso
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 px-4 py-3 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors placeholder:text-zinc-400 resize-none text-sm"
                placeholder="Escreva a dedicatória..."
                required
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-zinc-900 text-white text-xs font-medium uppercase tracking-widest py-4 hover:bg-zinc-800 transition-colors disabled:bg-zinc-200 disabled:text-zinc-400"
              >
                {loading
                  ? "Processando..."
                  : editingId
                    ? "Salvar Alterações"
                    : "Salvar Registro"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="bg-zinc-100 text-zinc-900 text-xs font-medium uppercase tracking-widest py-4 px-6 hover:bg-zinc-200 transition-colors"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Listagem de Gerenciamento */}
        <div className="bg-white p-10 border border-zinc-200 shadow-sm rounded-none">
          <div className="mb-6">
            <h2 className="text-xl font-serif text-zinc-900 tracking-tight">
              Registros Cadastrados
            </h2>
            <p className="text-xs text-zinc-400 font-light uppercase tracking-wider">
              Edição e remoção rápida (Ordenado pelo mais recente)
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  <th className="py-3 px-4 w-24">Miniatura</th>
                  <th className="py-3 px-4 w-40">Data Texto</th>
                  <th className="py-3 px-4 w-40">Data Sistema</th>
                  <th className="py-3 px-4">Mensagem</th>
                  <th className="py-3 px-4 text-right w-36">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-sm text-zinc-700">
                {memories.map((memory) => (
                  <tr
                    key={memory.id}
                    className="hover:bg-zinc-50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <img
                        src={memory.image_url}
                        alt=""
                        className="w-12 h-16 object-cover border border-zinc-200"
                      />
                    </td>
                    <td className="py-4 px-4 font-medium text-zinc-900 whitespace-nowrap">
                      {memory.date_text}
                    </td>
                    <td className="py-4 px-4 text-zinc-500 text-xs whitespace-nowrap">
                      {memory.event_date}
                    </td>
                    <td className="py-4 px-4 max-w-xs truncate">
                      {memory.message}
                    </td>
                    <td className="py-4 px-4 text-right whitespace-nowrap space-x-3">
                      <button
                        onClick={() => handleEditClick(memory)}
                        className="text-xs font-semibold uppercase tracking-wider text-zinc-900 hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteClick(memory.id)}
                        className="text-xs font-semibold uppercase tracking-wider text-red-600 hover:underline"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
                {memories.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-8 text-center text-zinc-400 text-xs uppercase tracking-wider font-light"
                    >
                      Nenhum registro encontrado no banco de dados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
