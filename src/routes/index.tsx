import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import studyScene from "../assets/study-scene.jpg";

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

function Index() {
  const [phrase, setPhrase] = useState("");
  const [result, setResult] = useState("");
  const [isTranslated, setIsTranslated] = useState(false);

  const handleTranslate = () => {
    if (!phrase.trim()) {
      setResult("Digite uma frase acima para ver a tradução.");
      setIsTranslated(false);
      return;
    }

    // Simulação local: sem API externa
    setResult(
      "Aqui aparecerá a tradução da sua frase quando a API for conectada."
    );
    setIsTranslated(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleTranslate();
    }
  };

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

          <div className="flex justify-center lg:justify-end">
            <button
              type="button"
              onClick={handleTranslate}
              className="group inline-flex cursor-pointer items-center gap-3 rounded-2xl bg-primary px-10 py-5 text-lg font-semibold text-primary-foreground transition-all hover:bg-secondary hover:shadow-lg hover:shadow-primary/20 active:scale-95"
            >
              Traduzir
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
                  isTranslated
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isTranslated ? "PRONTO" : "AGUARDANDO"}
              </span>
            </div>

            <div className="rounded-2xl border border-primary/10 bg-primary/5 p-8">
              <p className="text-2xl font-medium leading-relaxed text-primary lg:text-3xl">
                {result || "Clique em traduzir para ver o resultado aqui..."}
              </p>
              {isTranslated && (
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    className="flex h-10 w-28 cursor-pointer items-center justify-center rounded-full bg-card text-xs font-bold text-primary shadow-sm transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    OUVIR
                  </button>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(result)}
                    className="flex h-10 w-28 cursor-pointer items-center justify-center rounded-full bg-card text-xs font-bold text-primary shadow-sm transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    COPIAR
                  </button>
                </div>
              )}
            </div>
          </div>
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
