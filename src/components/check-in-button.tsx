"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MapPin, Loader2, CheckCircle2 } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { checkInVisitAction } from "@/lib/actions/visits";
import { dateLong } from "@/lib/utils";

type Visit = {
  id: string;
  latitude: number;
  longitude: number;
  distanceMeters: number | null;
  notes: string | null;
  createdAt: Date | number;
  repName: string | null;
};

export function CheckInButton({
  customerId,
  customerHasCoords,
  visits,
}: {
  customerId: string;
  customerHasCoords: boolean;
  visits: Visit[];
}) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleCheckIn() {
    if (!("geolocation" in navigator)) {
      toast.error("Seu navegador não suporta GPS");
      return;
    }

    setSubmitting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const result = await checkInVisitAction({
          customerId,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          notes: notes.trim() || undefined,
        });

        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success(result.message ?? "Visita registrada");
          setOpen(false);
          setNotes("");
        }
        setSubmitting(false);
      },
      (err) => {
        console.error(err);
        toast.error(
          err.code === err.PERMISSION_DENIED
            ? "Permissão de localização negada"
            : "Não foi possível obter sua localização",
        );
        setSubmitting(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }

  return (
    <div className="space-y-3">
      {!open ? (
        <Button
          onClick={() => setOpen(true)}
          variant="secondary"
          size="sm"
          className="w-full"
        >
          <MapPin className="h-3.5 w-3.5" />
          Iniciar visita
        </Button>
      ) : (
        <div className="space-y-2 rounded-[var(--radius-sm)] border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-3">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              Anotação (opcional)
            </label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Reunião com gerente, material entregue..."
              maxLength={500}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleCheckIn}
              disabled={submitting}
              size="sm"
              className="flex-1"
            >
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <MapPin className="h-3.5 w-3.5" />
              )}
              {submitting ? "Capturando GPS..." : "Confirmar check-in"}
            </Button>
            <Button
              onClick={() => {
                setOpen(false);
                setNotes("");
              }}
              variant="ghost"
              size="sm"
            >
              Cancelar
            </Button>
          </div>
          {!customerHasCoords && (
            <p className="text-[10px] text-amber-600">
              ⚠ Cliente sem coordenadas cadastradas — não dá pra validar a
              proximidade.
            </p>
          )}
        </div>
      )}

      {/* Histórico de visitas */}
      {visits.length > 0 && (
        <div>
          <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            Visitas anteriores ({visits.length})
          </h4>
          <ul className="space-y-1.5">
            {visits.map((v) => {
              const isClose =
                v.distanceMeters !== null && v.distanceMeters < 200;
              return (
                <li
                  key={v.id}
                  className="flex items-start gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-2)]/40 px-2.5 py-1.5"
                >
                  <CheckCircle2
                    className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${isClose ? "text-emerald-500" : "text-amber-500"}`}
                  />
                  <div className="min-w-0 flex-1 text-xs">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-medium">
                        {dateLong(v.createdAt)}
                      </span>
                      {v.distanceMeters !== null && (
                        <span
                          className={`text-[10px] tabular-nums ${isClose ? "text-emerald-600" : "text-amber-600"}`}
                        >
                          {v.distanceMeters < 1000
                            ? `${v.distanceMeters.toFixed(0)} m`
                            : `${(v.distanceMeters / 1000).toFixed(1)} km`}
                        </span>
                      )}
                    </div>
                    {v.notes && (
                      <p className="mt-0.5 text-[var(--color-text-muted)] line-clamp-2">
                        {v.notes}
                      </p>
                    )}
                    {v.repName && (
                      <p className="text-[10px] text-[var(--color-text-dim)]">
                        {v.repName}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
