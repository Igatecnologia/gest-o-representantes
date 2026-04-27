"use client";

import { useEffect, useState } from "react";

/**
 * Persiste preferências de quais campos exibir nos cards de cada entidade.
 * localStorage por usuário (não vai pra DB — preferência cosmética).
 */

export type CustomerCardField = "phone" | "city" | "document" | "rep" | "email";
export type DealCardField = "expectedDate" | "rep" | "daysInStage" | "probability";

const DEFAULT_CUSTOMER: CustomerCardField[] = ["phone", "city", "rep"];
const DEFAULT_DEAL: DealCardField[] = ["expectedDate", "rep", "daysInStage"];

const KEY_CUSTOMER = "iga-card-fields:customer";
const KEY_DEAL = "iga-card-fields:deal";

export function useCustomerCardFields(): [
  Set<CustomerCardField>,
  (next: CustomerCardField[]) => void,
] {
  const [fields, setFields] = useState<Set<CustomerCardField>>(
    () => new Set(DEFAULT_CUSTOMER),
  );

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY_CUSTOMER);
      if (raw) {
        const parsed = JSON.parse(raw) as CustomerCardField[];
        setFields(new Set(parsed));
      }
    } catch {
      /* noop */
    }
  }, []);

  const update = (next: CustomerCardField[]) => {
    setFields(new Set(next));
    try {
      window.localStorage.setItem(KEY_CUSTOMER, JSON.stringify(next));
    } catch {
      /* noop */
    }
  };

  return [fields, update];
}

export function useDealCardFields(): [
  Set<DealCardField>,
  (next: DealCardField[]) => void,
] {
  const [fields, setFields] = useState<Set<DealCardField>>(
    () => new Set(DEFAULT_DEAL),
  );

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY_DEAL);
      if (raw) {
        const parsed = JSON.parse(raw) as DealCardField[];
        setFields(new Set(parsed));
      }
    } catch {
      /* noop */
    }
  }, []);

  const update = (next: DealCardField[]) => {
    setFields(new Set(next));
    try {
      window.localStorage.setItem(KEY_DEAL, JSON.stringify(next));
    } catch {
      /* noop */
    }
  };

  return [fields, update];
}
