import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const TranslateInput = z.object({
  text: z.string().min(1).max(500),
  context: z.string().min(1).max(60),
});

export interface TranslationResult {
  portuguese: string;
  english: string;
  pronunciation: string;
  context: string;
}

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    english: {
      type: "string",
      description: "Natural, simple English translation for the given context",
    },
    pronunciation: {
      type: "string",
      description:
        "Approximate pronunciation of the English sentence written with Brazilian Portuguese phonetics",
    },
  },
  required: ["english", "pronunciation"],
} as const;

export const translatePhrase = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => TranslateInput.parse(input))
  .handler(async ({ data }): Promise<TranslationResult> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      throw new Error("Serviço de tradução não configurado.");
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-5.6-sol",
        stream: true,
        instructions:
          "Você é um professor de inglês. Traduza a frase em português para um inglês natural, simples e curto, como uma pessoa realmente falaria na situação/contexto informado. " +
          "Também forneça a pronúncia aproximada da frase em inglês escrita com fonética do português brasileiro (ex.: 'Where is the bathroom?' -> 'Uér iz dê báthrum?'). Responda apenas no formato JSON pedido.",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Contexto: ${data.context}\nFrase em português: ${data.text}`,
              },
            ],
          },
        ],
        reasoning: { effort: "low", summary: "auto" },
        text: {
          format: {
            type: "json_schema",
            name: "translation",
            strict: true,
            schema: SCHEMA,
          },
        },
      }),
    });

    if (!res.ok || !res.body) {
      const body = await res.text().catch(() => "");
      if (res.status === 429) {
        throw new Error("Muitas traduções em pouco tempo. Tente de novo em instantes.");
      }
      if (res.status === 402) {
        throw new Error("Os créditos de IA acabaram. Adicione créditos para continuar traduzindo.");
      }
      throw new Error(`Falha na tradução (${res.status}). ${body.slice(0, 200)}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let output = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const event = JSON.parse(payload) as {
            type?: string;
            delta?: string;
            response?: { output_text?: string };
          };
          if (event.type === "response.output_text.delta" && event.delta) {
            output += event.delta;
          } else if (event.type === "response.completed" && event.response?.output_text) {
            if (!output) output = event.response.output_text;
          }
        } catch {
          // ignore malformed keep-alive chunks
        }
      }
    }

    let parsed: { english?: string; pronunciation?: string } = {};
    try {
      parsed = JSON.parse(output.trim());
    } catch {
      throw new Error("Não consegui entender a resposta da tradução. Tente novamente.");
    }

    return {
      portuguese: data.text.trim(),
      english: parsed.english?.trim() || "",
      pronunciation: parsed.pronunciation?.trim() || "",
      context: data.context,
    };
  });
