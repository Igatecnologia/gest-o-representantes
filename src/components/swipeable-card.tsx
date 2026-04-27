"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type SwipeAction = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string; // ex: "bg-emerald-500"
  onAction: () => void;
};

/**
 * Card com swipe gestures (apenas mobile).
 * - Swipe esquerda revela actions à direita (ex: WhatsApp, ligar)
 * - Swipe direita revela actions à esquerda (ex: arquivar, excluir)
 *
 * Usa pointer events nativos. Em desktop (≥768px) o componente passa
 * direto sem wrapping (graceful degradation).
 */
export function SwipeableCard({
  children,
  rightActions = [],
  leftActions = [],
  className,
  threshold = 80,
}: {
  children: React.ReactNode;
  rightActions?: SwipeAction[];
  leftActions?: SwipeAction[];
  className?: string;
  threshold?: number;
}) {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const startedAt = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!isMobile || (rightActions.length === 0 && leftActions.length === 0)) {
    return <div className={className}>{children}</div>;
  }

  const maxRight = rightActions.length * 72; // 72px por action
  const maxLeft = leftActions.length * 72;

  function onPointerDown(e: React.PointerEvent) {
    // Só processa toques (não mouse direito etc)
    if (e.pointerType === "mouse" && e.button !== 0) return;
    startX.current = e.clientX;
    currentX.current = translateX;
    startedAt.current = Date.now();
    setIsDragging(true);
    containerRef.current?.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!isDragging) return;
    const delta = e.clientX - startX.current;
    let next = currentX.current + delta;
    // Limita ao range das actions disponíveis
    if (next > maxLeft) next = maxLeft;
    if (next < -maxRight) next = -maxRight;
    setTranslateX(next);
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!isDragging) return;
    setIsDragging(false);
    containerRef.current?.releasePointerCapture(e.pointerId);

    const elapsed = Date.now() - startedAt.current;
    const dist = Math.abs(translateX);
    // Se passar do threshold OU foi um swipe rápido, "encaixa"
    const fastSwipe = elapsed < 250 && dist > threshold / 2;
    const passed = dist > threshold;

    if (translateX < 0 && (passed || fastSwipe)) {
      setTranslateX(-maxRight);
    } else if (translateX > 0 && (passed || fastSwipe)) {
      setTranslateX(maxLeft);
    } else {
      setTranslateX(0); // volta
    }
  }

  function close() {
    setTranslateX(0);
  }

  function handleAction(action: SwipeAction) {
    action.onAction();
    close();
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden touch-pan-y", className)}
    >
      {/* Actions à esquerda (revealed por swipe right) */}
      {leftActions.length > 0 && (
        <div
          className="absolute inset-y-0 left-0 flex"
          style={{ width: maxLeft }}
        >
          {leftActions.map((a, i) => {
            const Icon = a.icon;
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleAction(a)}
                className={cn(
                  "flex h-full w-[72px] flex-col items-center justify-center gap-1 text-white",
                  a.color,
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{a.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Actions à direita (revealed por swipe left) */}
      {rightActions.length > 0 && (
        <div
          className="absolute inset-y-0 right-0 flex"
          style={{ width: maxRight }}
        >
          {rightActions.map((a, i) => {
            const Icon = a.icon;
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleAction(a)}
                className={cn(
                  "flex h-full w-[72px] flex-col items-center justify-center gap-1 text-white",
                  a.color,
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{a.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Conteúdo arrastável */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
        className="relative bg-[var(--color-surface)] touch-pan-y"
      >
        {children}
      </div>

      {/* Overlay tap pra fechar quando swipe está aberto */}
      {translateX !== 0 && !isDragging && (
        <button
          type="button"
          onClick={close}
          aria-label="Fechar ações"
          className="absolute inset-0 z-10 cursor-default"
          style={{
            // Cobre a área do conteúdo deslocado
            transform: `translateX(${translateX}px)`,
          }}
        />
      )}
    </div>
  );
}
