import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/speech")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return new Response("Serviço de áudio não configurado.", { status: 500 });
        }

        let text = "";
        try {
          const body = (await request.json()) as { text?: unknown };
          text = typeof body.text === "string" ? body.text.trim() : "";
        } catch {
          return new Response("Requisição inválida.", { status: 400 });
        }

        if (!text || text.length > 800) {
          return new Response("Texto inválido para áudio.", { status: 400 });
        }

        const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini-tts",
            input: text,
            voice: "alloy",
            response_format: "mp3",
            instructions:
              "Speak in clear, natural American English at a slightly slow pace, so a learner can repeat after you.",
          }),
        });

        if (!res.ok || !res.body) {
          const detail = await res.text().catch(() => "");
          return new Response(detail || "Falha ao gerar o áudio.", {
            status: res.status || 502,
          });
        }

        return new Response(res.body, {
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
