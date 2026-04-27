"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button, Card } from "@/components/ui";
import {
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { importCustomersAction } from "@/lib/actions/import-customers";

type ParsedRow = {
  raw: Record<string, string>;
  data: {
    name: string;
    tradeName?: string;
    document?: string;
    email?: string;
    phone?: string;
    city?: string;
    state?: string;
    cep?: string;
    notes?: string;
  };
  error?: string;
};

const COLUMN_ALIASES: Record<string, keyof ParsedRow["data"]> = {
  // name
  nome: "name",
  cliente: "name",
  razao: "name",
  "razão social": "name",
  // tradeName
  fantasia: "tradeName",
  "nome fantasia": "tradeName",
  // document
  cnpj: "document",
  cpf: "document",
  documento: "document",
  // email
  email: "email",
  "e-mail": "email",
  // phone
  telefone: "phone",
  celular: "phone",
  fone: "phone",
  // city
  cidade: "city",
  município: "city",
  // state
  uf: "state",
  estado: "state",
  // cep
  cep: "cep",
  // notes
  observações: "notes",
  observacoes: "notes",
  obs: "notes",
};

function detectDelimiter(line: string): string {
  const semi = (line.match(/;/g) ?? []).length;
  const comma = (line.match(/,/g) ?? []).length;
  return semi > comma ? ";" : ",";
}

function splitCSVLine(line: string, delim: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delim && !inQuotes) {
      result.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result.map((s) => s.trim());
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const delim = detectDelimiter(lines[0]);
  const headers = splitCSVLine(lines[0], delim).map((h) =>
    h.toLowerCase().replace(/[ô]/g, "o").trim(),
  );

  // Mapeia colunas pra nossos campos
  const fieldMap: (keyof ParsedRow["data"] | null)[] = headers.map(
    (h) => COLUMN_ALIASES[h] ?? null,
  );

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCSVLine(lines[i], delim);
    const raw: Record<string, string> = {};
    const data: ParsedRow["data"] = { name: "" };

    headers.forEach((h, idx) => {
      raw[h] = cells[idx] ?? "";
      const field = fieldMap[idx];
      if (field) {
        data[field] = cells[idx]?.trim() ?? "";
      }
    });

    let error: string | undefined;
    if (!data.name || data.name.length < 2) {
      error = "Nome ausente ou muito curto";
    }
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      error = "E-mail inválido";
    }
    if (data.state && data.state.length > 2) {
      error = "UF deve ter 2 letras";
    }

    rows.push({ raw, data, error });
  }
  return rows;
}

export function ImportForm() {
  const router = useRouter();
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [filename, setFilename] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      setRows(parsed);
      if (parsed.length === 0) {
        toast.error("CSV vazio ou sem cabeçalho");
      }
    };
    reader.readAsText(file, "utf-8");
  }

  async function handleConfirm() {
    const validRows = rows.filter((r) => !r.error).map((r) => r.data);
    if (validRows.length === 0) {
      toast.error("Nenhuma linha válida pra importar");
      return;
    }
    setSubmitting(true);
    const result = await importCustomersAction(validRows);
    setSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(
      `${result.imported} cliente(s) importado(s)${(result.skipped ?? 0) > 0 ? `, ${result.skipped} pulado(s)` : ""}`,
    );
    router.push("/clientes");
  }

  const validCount = rows.filter((r) => !r.error).length;
  const errorCount = rows.length - validCount;

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Instrucoes */}
      <Card>
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" />
          <div className="text-xs leading-relaxed text-[var(--color-text-muted)]">
            <p className="font-semibold text-[var(--color-text)]">
              Formato esperado
            </p>
            <p className="mt-1">
              CSV com cabeçalho na primeira linha. Colunas reconhecidas:{" "}
              <code>nome</code>, <code>fantasia</code>, <code>cnpj</code>,{" "}
              <code>email</code>, <code>telefone</code>, <code>cidade</code>,{" "}
              <code>uf</code>, <code>cep</code>, <code>obs</code>. Separadores{" "}
              <code>,</code> ou <code>;</code> aceitos.
            </p>
          </div>
        </div>
      </Card>

      {/* Upload */}
      <Card>
        <label className="flex cursor-pointer flex-col items-center gap-3 rounded-[var(--radius)] border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface-2)]/30 px-4 py-8 text-center transition-colors hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/5">
          <Upload className="h-8 w-8 text-[var(--color-text-dim)]" />
          <div>
            <div className="text-sm font-semibold">
              {filename || "Selecionar arquivo CSV"}
            </div>
            <div className="mt-0.5 text-xs text-[var(--color-text-muted)]">
              {filename
                ? "Clique pra trocar"
                : "Arraste ou clique pra escolher"}
            </div>
          </div>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFile}
            className="hidden"
          />
        </label>
      </Card>

      {/* Preview */}
      {rows.length > 0 && (
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">
              Preview — {rows.length} linha(s)
            </h2>
            <div className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="h-3 w-3" />
                {validCount} válida(s)
              </span>
              {errorCount > 0 && (
                <span className="inline-flex items-center gap-1 text-amber-600">
                  <AlertTriangle className="h-3 w-3" />
                  {errorCount} com erro
                </span>
              )}
            </div>
          </div>

          <div className="max-h-[400px] overflow-auto rounded-[var(--radius-sm)] border border-[var(--color-border)]">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-[var(--color-surface-2)]">
                <tr>
                  <th className="px-2 py-1.5 text-left">#</th>
                  <th className="px-2 py-1.5 text-left">Nome</th>
                  <th className="px-2 py-1.5 text-left">Doc</th>
                  <th className="px-2 py-1.5 text-left">Email</th>
                  <th className="px-2 py-1.5 text-left">Cidade</th>
                  <th className="px-2 py-1.5 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 100).map((r, i) => (
                  <tr
                    key={i}
                    className={
                      r.error
                        ? "bg-amber-500/10"
                        : "border-t border-[var(--color-border)]"
                    }
                  >
                    <td className="px-2 py-1 text-[var(--color-text-dim)]">
                      {i + 2}
                    </td>
                    <td className="px-2 py-1 truncate max-w-[200px]">
                      {r.data.name || "—"}
                    </td>
                    <td className="px-2 py-1 font-mono text-[10px]">
                      {r.data.document ?? ""}
                    </td>
                    <td className="px-2 py-1 truncate max-w-[180px]">
                      {r.data.email ?? ""}
                    </td>
                    <td className="px-2 py-1">
                      {r.data.city ?? ""}
                      {r.data.state ? `/${r.data.state}` : ""}
                    </td>
                    <td className="px-2 py-1">
                      {r.error ? (
                        <span className="inline-flex items-center gap-1 text-amber-600">
                          <AlertTriangle className="h-3 w-3" />
                          {r.error}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                          <CheckCircle2 className="h-3 w-3" />
                          OK
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 100 && (
              <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1.5 text-center text-[10px] text-[var(--color-text-muted)]">
                Mostrando 100 de {rows.length} — todas as linhas válidas serão
                importadas
              </div>
            )}
          </div>
        </Card>
      )}

      <div className="flex gap-3">
        <Link href="/clientes">
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>
        {validCount > 0 && (
          <Button onClick={handleConfirm} disabled={submitting}>
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {submitting
              ? "Importando..."
              : `Importar ${validCount} cliente${validCount === 1 ? "" : "s"}`}
          </Button>
        )}
      </div>
    </div>
  );
}
