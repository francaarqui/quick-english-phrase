import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Volume2, Trash2 } from "lucide-react";
import studyScene from "../assets/study-scene.jpg";
import {
  translatePhrase,
  type TranslationResult,
} from "../lib/translate.functions";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "English Easy — Aprenda frases em inglês" },
      {
        name: "description",
        content:
          "English Easy é uma ferramenta pessoal para ajudar você a aprender frases em inglês de forma simples e prática.",
      },
      {
        property: "og:title",
        content: "English Easy — Aprenda frases em inglês",
      },
      {
        property: "og:description",
        content:
          "English Easy é uma ferramenta pessoal para ajudar você a aprender frases em inglês de forma simples e prática.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const CONTEXTS = [
  "Conversa normal",
  "Aeroporto",
  "Hotel",
  "Restaurante",
  "Padaria",
  "Mercado",
  "Estação de metrô",
  "Transporte",
  "Compras",
  "Trabalho",
  "Outros",
];

interface SavedPhrase {
  id: string;
  portuguese: string;
  english: string;
  pronunciation?: string;
  context: string;
}

const STORAGE_KEY = "english-easy-phrases";


function loadSavedPhrases(): SavedPhrase[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function savePhrases(phrases: SavedPhrase[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(phrases));
}

const audioCache = new Map<string, string>();
let currentAudio: HTMLAudioElement | null = null;

async function fetchEnglishAudio(text: string): Promise<string> {
  const cached = audioCache.get(text);
  if (cached) return cached;

  const res = await fetch("/api/speech", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("Muitos áudios em pouco tempo. Tente de novo em instantes.");
    if (res.status === 402) throw new Error("Os créditos de IA acabaram. Adicione créditos para ouvir o áudio.");
    throw new Error(detail?.slice(0, 160) || "Não consegui gerar o áudio agora.");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  audioCache.set(text, url);
  return url;
}

async function playEnglishAudio(text: string) {
  const url = await fetchEnglishAudio(text);
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  const audio = new Audio(url);
  currentAudio = audio;
  await audio.play();
}


function Index() {
  const translate = useServerFn(translatePhrase);
  const [phrase, setPhrase] = useState("");
  const [selectedContext, setSelectedContext] = useState<string>(CONTEXTS[0] ?? "Conversa normal");
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [savedPhrases, setSavedPhrases] = useState<SavedPhrase[]>([]);

  useEffect(() => {
    setSavedPhrases(loadSavedPhrases());
  }, []);

  const handleTranslate = async () => {
    if (isLoading) return;
    if (!phrase.trim()) {
      setResult(null);
      setError("Digite uma frase acima para ver a tradução.");
      return;
    }

    setError("");
    setIsLoading(true);
    try {
      const translation = await translate({
        data: { text: phrase.trim(), context: selectedContext },
      });
      setResult(translation);

      const newPhrase: SavedPhrase = {
        id: crypto.randomUUID(),
        portuguese: translation.portuguese,
        english: translation.english,
        pronunciation: translation.pronunciation,
        context: translation.context,
      };

      const updated = [newPhrase, ...savedPhrases];
      setSavedPhrases(updated);
      savePhrases(updated);
    } catch (err) {
      setResult(null);
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Não foi possível traduzir agora. Tente novamente."
      );
    } finally {
      setIsLoading(false);
    }
  };


  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleTranslate();
    }
  };

  const handleDelete = (id: string) => {
    const updated = savedPhrases.filter((p) => p.id !== id);
    setSavedPhrases(updated);
    savePhrases(updated);
  };

  const phrasesByContext = savedPhrases.reduce(
    (acc, phrase) => {
      const existing = acc[phrase.context];
      if (existing) {
        existing.push(phrase);
      } else {
        acc[phrase.context] = [phrase];
      }
      return acc;
    },
    {} as Record<string, SavedPhrase[]>
  );

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-secondary/30">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-8">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <div className="size-3 rounded-full bg-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight text-primary">
            English Easy
          </span>
        </div>
        <div className="hidden gap-6 text-sm font-medium text-muted-foreground sm:flex">
          <span className="cursor-pointer transition-colors hover:text-primary">
            Coleções
          </span>
          <span className="cursor-pointer transition-colors hover:text-primary">
            Sobre
          </span>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-6 py-12 lg:py-20">
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight lg:text-6xl">
            English Easy
          </h1>
          <p className="text-lg font-light italic text-muted-foreground lg:text-xl">
            "Como eu falo isso em inglês?"
          </p>
        </div>

        <div className="space-y-6 rounded-[2rem] border border-primary/5 bg-card p-6 shadow-xl shadow-primary/5 lg:p-10">
          <div className="space-y-2">
            <label
              htmlFor="phrase"
              className="ml-1 text-xs font-semibold uppercase tracking-widest text-primary"
            >
              Sua frase em português
            </label>
            <textarea
              id="phrase"
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ex: Onde fica a estação de metrô mais próxima?"
              className="h-40 w-full resize-none rounded-2xl border-none bg-background p-6 text-xl outline-none transition-all placeholder:text-muted-foreground/30 focus:ring-2 focus:ring-secondary/50 lg:h-52 lg:text-2xl"
            />
          </div>

          <div className="space-y-3">
            <label className="ml-1 text-xs font-semibold uppercase tracking-widest text-primary">
              Contexto
            </label>
            <div className="flex flex-wrap gap-2">
              {CONTEXTS.map((context) => (
                <button
                  key={context}
                  type="button"
                  onClick={() => setSelectedContext(context)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    selectedContext === context
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:bg-secondary/20 hover:text-foreground"
                  }`}
                >
                  {context}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <button
              type="button"
              onClick={handleTranslate}
              disabled={isLoading}
              className="group inline-flex cursor-pointer items-center gap-3 rounded-2xl bg-primary px-10 py-5 text-lg font-semibold text-primary-foreground transition-all hover:bg-secondary hover:shadow-lg hover:shadow-primary/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Traduzindo..." : "Traduzir"}
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </button>

          </div>

          <div className="mt-12 border-t border-primary/5 pt-12">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Resultado
              </h3>
              <span
                className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                  result
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isLoading ? "TRADUZINDO..." : result ? "PRONTO" : "AGUARDANDO"}
              </span>
            </div>

            <div className="rounded-2xl border border-primary/10 bg-primary/5 p-8">
              {error && (
                <p className="text-base font-medium text-destructive">{error}</p>
              )}

              {!error && !result && (
                <p className="text-xl font-medium leading-relaxed text-muted-foreground">
                  {isLoading
                    ? "Traduzindo sua frase..."
                    : "Clique em traduzir para ver o resultado aqui..."}
                </p>
              )}

              {!error && result && (
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Português
                    </p>
                    <p className="mt-1 text-lg text-foreground">
                      {result.portuguese}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Inglês
                    </p>
                    <p className="mt-1 text-2xl font-semibold leading-relaxed text-primary lg:text-3xl">
                      {result.english}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Pronúncia
                    </p>
                    <p className="mt-1 text-lg italic text-secondary">
                      {result.pronunciation}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Contexto
                    </p>
                    <p className="mt-1 text-base font-medium text-foreground">
                      {result.context}
                    </p>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      onClick={() => speak(result.english)}
                      className="flex h-10 w-28 cursor-pointer items-center justify-center gap-2 rounded-full bg-card text-xs font-bold text-primary shadow-sm transition-colors hover:bg-primary hover:text-primary-foreground"
                    >
                      <Volume2 className="size-4" />
                      OUVIR
                    </button>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(result.english)}
                      className="flex h-10 w-28 cursor-pointer items-center justify-center rounded-full bg-card text-xs font-bold text-primary shadow-sm transition-colors hover:bg-primary hover:text-primary-foreground"
                    >
                      COPIAR
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        <div className="mt-20">
          <div className="mb-8 flex items-center gap-4">
            <h2 className="text-2xl font-bold">Minhas frases</h2>
            <span className="rounded-full bg-secondary/20 px-3 py-1 text-xs font-semibold text-secondary">
              {savedPhrases.length}
            </span>
          </div>

          {savedPhrases.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-primary/20 bg-card/50 p-12 text-center">
              <p className="text-muted-foreground">
                Nenhuma frase salva ainda. Traduza sua primeira frase acima!
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(phrasesByContext).map(([context, phrases]) => (
                <div key={context} className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-primary">
                    {context}
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {phrases.map((saved) => (
                      <div
                        key={saved.id}
                        className="rounded-2xl border border-primary/5 bg-card p-5 shadow-sm"
                      >
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-muted-foreground">
                              {saved.portuguese}
                            </p>
                            <p className="mt-1 text-lg font-semibold text-primary">
                              {saved.english}
                            </p>
                            {saved.pronunciation && (
                              <p className="mt-1 text-sm italic text-secondary">
                                {saved.pronunciation}
                              </p>
                            )}

                          </div>
                          <span className="shrink-0 rounded-full bg-secondary/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-secondary">
                            {saved.context}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => speak(saved.english)}
                            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                          >
                            <Volume2 className="size-4" />
                            Ouvir
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(saved.id)}
                            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <Trash2 className="size-4" />
                            Excluir
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-20 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="rounded-2xl border border-primary/5 bg-card p-6">
            <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-secondary/10 font-bold text-secondary">
              1
            </div>
            <h4 className="mb-2 font-bold">Escreva natural</h4>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Não se preocupe com a gramática perfeita ao digitar.
            </p>
          </div>
          <div className="rounded-2xl border border-primary/5 bg-card p-6">
            <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-secondary/10 font-bold text-secondary">
              2
            </div>
            <h4 className="mb-2 font-bold">Aprenda o contexto</h4>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Veja variações comuns para a mesma expressão.
            </p>
          </div>
          <div className="rounded-2xl border border-primary/5 bg-card p-6">
            <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-secondary/10 font-bold text-secondary">
              3
            </div>
            <h4 className="mb-2 font-bold">Salve frases</h4>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Crie seu dicionário pessoal de sobrevivência.
            </p>
          </div>
        </div>

        <div className="mt-20 mb-10">
          <img
            src={studyScene}
            alt="Cena minimalista de estudos com laptop e caderno em uma mesa branca"
            className="h-48 w-full rounded-3xl object-cover"
            loading="lazy"
            width={1200}
            height={512}
          />
        </div>
      </main>

      <footer className="border-t border-primary/5 py-10 text-center text-sm text-muted-foreground">
        <p>
          © {new Date().getFullYear()} English Easy. Seu guia pessoal de
          idiomas.
        </p>
      </footer>
    </div>
  );
}
