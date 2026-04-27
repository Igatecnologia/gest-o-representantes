"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ExternalLink, Phone, MapPin } from "lucide-react";

type CustomerPin = {
  id: string;
  name: string;
  tradeName: string | null;
  latitude: number;
  longitude: number;
  city: string | null;
  state: string | null;
  phone: string | null;
  repName: string | null;
};

/**
 * Renderiza Leaflet client-side.
 * Carrega CSS e biblioteca dinamicamente (Leaflet usa window).
 */
export function CustomerMap({ customers }: { customers: CustomerPin[] }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);

  useEffect(() => {
    let mounted = true;
    let cleanup: (() => void) | null = null;

    async function setup() {
      const L = await import("leaflet");
      // Inject CSS
      if (!document.querySelector("link[data-leaflet]")) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        link.crossOrigin = "";
        link.dataset.leaflet = "true";
        document.head.appendChild(link);
      }

      if (!mounted || !mapContainer.current) return;

      // Calcula centro e bounds
      const lats = customers.map((c) => c.latitude);
      const lngs = customers.map((c) => c.longitude);
      const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;
      const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;

      const map = L.map(mapContainer.current, {
        center: [centerLat, centerLng],
        zoom: customers.length === 1 ? 14 : 6,
        scrollWheelZoom: true,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
      }).addTo(map);

      // Pin custom DivIcon
      const makePinIcon = (n: number) =>
        L.divIcon({
          className: "iga-pin",
          html: `<div style="
            background: var(--color-primary, #2e6db4);
            color: white;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            border: 2px solid white;
            font-weight: 700;
            font-size: 11px;
          ">${n}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

      const markers: unknown[] = [];
      customers.forEach((c, i) => {
        const popupHtml = `
          <div style="font-family: system-ui; min-width: 200px;">
            <div style="font-weight: 700; font-size: 13px; margin-bottom: 2px;">${escapeHtml(c.name)}</div>
            ${c.tradeName ? `<div style="font-size: 11px; color: #6b7280; margin-bottom: 4px;">${escapeHtml(c.tradeName)}</div>` : ""}
            ${c.city ? `<div style="font-size: 11px; color: #6b7280; margin-bottom: 4px;">📍 ${escapeHtml(c.city)}${c.state ? `/${escapeHtml(c.state)}` : ""}</div>` : ""}
            ${c.phone ? `<div style="font-size: 11px; color: #6b7280; margin-bottom: 4px;">📞 ${escapeHtml(c.phone)}</div>` : ""}
            ${c.repName ? `<div style="font-size: 11px; color: #9ca3af; margin-bottom: 6px;">👤 ${escapeHtml(c.repName)}</div>` : ""}
            <a href="/clientes/${c.id}" style="display: inline-block; background: #2e6db4; color: white; padding: 4px 10px; border-radius: 4px; font-size: 11px; text-decoration: none; font-weight: 600;">
              Ver cliente →
            </a>
          </div>
        `;
        const marker = L.marker([c.latitude, c.longitude], {
          icon: makePinIcon(i + 1),
        })
          .bindPopup(popupHtml)
          .addTo(map);
        markers.push(marker);
      });

      // Fit bounds se mais de 1 cliente
      if (customers.length > 1) {
        const group = L.featureGroup(markers as L.Layer[]);
        map.fitBounds(group.getBounds(), { padding: [50, 50] });
      }

      cleanup = () => {
        map.remove();
        mapRef.current = null;
      };
    }

    setup();

    return () => {
      mounted = false;
      cleanup?.();
    };
  }, [customers]);

  return (
    <div className="space-y-3">
      <div
        ref={mapContainer}
        className="h-[60vh] w-full overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-2)]"
        style={{ minHeight: 400 }}
      />

      {/* Lista lateral compacta */}
      <details className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
        <summary className="cursor-pointer text-xs font-semibold text-[var(--color-text)]">
          Lista de clientes no mapa ({customers.length})
        </summary>
        <ul className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
          {customers.map((c, i) => (
            <li key={c.id}>
              <Link
                href={`/clientes/${c.id}`}
                className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-2)]/40 px-3 py-2 text-xs hover:bg-[var(--color-surface-2)]"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-bold text-white">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{c.name}</div>
                  {c.city && (
                    <div className="text-[10px] text-[var(--color-text-muted)]">
                      <MapPin className="mr-0.5 inline h-2.5 w-2.5" />
                      {c.city}
                      {c.state ? `/${c.state}` : ""}
                    </div>
                  )}
                </div>
                <ExternalLink className="h-3 w-3 text-[var(--color-text-dim)]" />
              </Link>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
