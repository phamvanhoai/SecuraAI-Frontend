import { useRef, useState } from "react";

/** Selection spans option pages; successful writes are removed, failed ones retained. */
export function useIncidentLinkSelection() {
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [failures, setFailures] = useState<string[]>([]);
  const running = useRef(false);
  const toggle = (id: string, label: string) => {
    if (running.current) return;
    setSelected((current) => {
      const next = { ...current };
      if (id in next) delete next[id];
      else next[id] = label;
      return next;
    });
  };
  const reset = () => {
    if (running.current) return;
    setSelected({});
    setFailures([]);
  };
  const submit = async (link: (id: string) => Promise<unknown>) => {
    if (running.current) return null;
    running.current = true;
    setBusy(true);
    setFailures([]);
    const failed: Record<string, string> = {};
    let succeeded = 0;
    try {
      for (const [id, label] of Object.entries(selected)) {
        try {
          await link(id);
          succeeded += 1;
        } catch {
          failed[id] = label;
        }
      }
      setSelected(failed);
      setFailures(Object.values(failed));
      return { succeeded, failed: Object.keys(failed).length };
    } finally {
      running.current = false;
      setBusy(false);
    }
  };
  return {
    selected,
    count: Object.keys(selected).length,
    busy,
    failures,
    toggle,
    reset,
    submit,
  };
}
