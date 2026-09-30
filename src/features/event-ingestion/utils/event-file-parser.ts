export type ParsedEventFileResult = {
  format: "JSON" | "CSV";
  records: Record<string, unknown>[];
  validCount: number;
  invalidCount: number;
  parseErrors: string[];
};

export function parseEventFileContent(
  content: string,
  fileName: string,
  defaultEventFamily?: string,
): ParsedEventFileResult {
  const isJson = fileName.toLowerCase().endsWith(".json") || content.trim().startsWith("[") || content.trim().startsWith("{");

  if (isJson) {
    return parseJsonEvents(content, defaultEventFamily);
  } else {
    return parseCsvEvents(content, defaultEventFamily);
  }
}

function parseJsonEvents(content: string, defaultEventFamily?: string): ParsedEventFileResult {
  const parseErrors: string[] = [];
  let parsedRaw: unknown;

  try {
    parsedRaw = JSON.parse(content);
  } catch (err: unknown) {
    return {
      format: "JSON",
      records: [],
      validCount: 0,
      invalidCount: 0,
      parseErrors: [err instanceof Error ? err.message : "Invalid JSON syntax"],
    };
  }

  let items: unknown[] = [];
  if (Array.isArray(parsedRaw)) {
    items = parsedRaw;
  } else if (typeof parsedRaw === "object" && parsedRaw !== null) {
    const obj = parsedRaw as Record<string, unknown>;
    if (Array.isArray(obj["events"])) {
      items = obj["events"] as unknown[];
    } else {
      items = [obj];
    }
  }

  const records: Record<string, unknown>[] = [];
  let validCount = 0;
  let invalidCount = 0;

  items.forEach((item, index) => {
    if (typeof item !== "object" || item === null) {
      invalidCount++;
      parseErrors.push(`Row #${index + 1}: Record must be a JSON object`);
      return;
    }

    const rec = { ...(item as Record<string, unknown>) };
    const rawType = typeof rec["eventType"] === "string" ? (rec["eventType"] as string) : "";
    if (!rec["eventFamily"]) {
      rec["eventFamily"] = detectEventFamilyFromType(rawType) || defaultEventFamily;
    }

    const hasType = rawType.trim().length > 0;
    const hasTime = rec["occurredAt"] || rec["timestamp"];

    if (hasType && hasTime) {
      if (!rec["occurredAt"] && rec["timestamp"]) {
        rec["occurredAt"] = rec["timestamp"];
      }
      validCount++;
    } else {
      invalidCount++;
      parseErrors.push(
        `Row #${index + 1}: Missing required fields (${!hasType ? "eventType" : ""}${!hasType && !hasTime ? ", " : ""}${!hasTime ? "occurredAt" : ""})`,
      );
    }

    records.push(rec);
  });

  return {
    format: "JSON",
    records,
    validCount,
    invalidCount,
    parseErrors: parseErrors.slice(0, 20),
  };
}

function parseCsvEvents(content: string, defaultEventFamily?: string): ParsedEventFileResult {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return {
      format: "CSV",
      records: [],
      validCount: 0,
      invalidCount: 0,
      parseErrors: ["CSV file is empty"],
    };
  }

  const headerLine = lines[0];
  if (!headerLine) {
    return {
      format: "CSV",
      records: [],
      validCount: 0,
      invalidCount: 0,
      parseErrors: ["CSV header missing"],
    };
  }

  const headers = parseCsvLine(headerLine).map((h) => normalizeHeaderKey(h));
  const records: Record<string, unknown>[] = [];
  const parseErrors: string[] = [];
  let validCount = 0;
  let invalidCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine || rawLine.trim().length === 0) continue;

    const values = parseCsvLine(rawLine);
    const rowObj: Record<string, unknown> = {};

    headers.forEach((hdr, colIndex) => {
      if (hdr && values[colIndex] !== undefined) {
        rowObj[hdr] = values[colIndex]?.trim();
      }
    });

    const rawType = typeof rowObj["eventType"] === "string" ? (rowObj["eventType"] as string) : "";
    if (!rowObj["eventFamily"]) {
      rowObj["eventFamily"] = detectEventFamilyFromType(rawType) || defaultEventFamily;
    }

    // Normalization aliases
    if (!rowObj["occurredAt"] && rowObj["timestamp"]) {
      rowObj["occurredAt"] = rowObj["timestamp"];
    }

    const hasType = rawType.trim().length > 0;
    const hasTime = typeof rowObj["occurredAt"] === "string" && (rowObj["occurredAt"] as string).trim().length > 0;

    if (hasType && hasTime) {
      validCount++;
    } else {
      invalidCount++;
      parseErrors.push(
        `Line ${i + 1}: Missing required fields (${!hasType ? "eventType" : ""}${!hasType && !hasTime ? ", " : ""}${!hasTime ? "occurredAt" : ""})`,
      );
    }

    records.push(rowObj);
  }

  return {
    format: "CSV",
    records,
    validCount,
    invalidCount,
    parseErrors: parseErrors.slice(0, 20),
  };
}

function parseCsvLine(text: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === "," && !inQuotes) {
      result.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

function normalizeHeaderKey(key: string): string {
  const clean = key.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

  if (["eventtype", "type", "event_type", "action"].includes(clean)) return "eventType";
  if (["eventfamily", "family", "event_family", "category"].includes(clean)) return "eventFamily";
  if (["occurredat", "timestamp", "time", "date", "eventtime", "datetime"].includes(clean)) return "occurredAt";
  if (["accountidentifier", "account", "username", "user", "actor", "email"].includes(clean)) return "accountIdentifier";
  if (["sourceip", "srcip", "ip", "source_ip", "clientip"].includes(clean)) return "sourceIp";
  if (["destinationip", "destip", "dstip", "destination_ip"].includes(clean)) return "destinationIp";
  if (["deviceidentifier", "device", "host", "hostname", "agent", "computer"].includes(clean)) return "deviceIdentifier";
  if (["severity", "level", "priority"].includes(clean)) return "severity";
  if (["externaleventid", "eventid", "id", "rawid", "raw_event_id"].includes(clean)) return "externalEventId";

  return key.trim();
}

export function detectEventFamilyFromType(eventType: string): string | undefined {
  if (!eventType) return undefined;
  const upper = eventType.toUpperCase();

  // VPN & Remote SSO Access patterns (check first as they are specialized)
  if (
    upper.includes("VPN") ||
    upper.includes("SSO") ||
    upper.includes("OKTA") ||
    upper.includes("KEYCLOAK") ||
    upper.includes("SAML") ||
    upper.includes("OIDC") ||
    upper.includes("TUNNEL") ||
    upper.includes("GATEWAY") ||
    upper.includes("AZURE_AD")
  ) {
    return "VPN_SSO";
  }

  // Application & Privilege Access patterns
  if (
    upper.includes("SUDO") ||
    upper.includes("PRIVILEGE") ||
    upper.includes("DATABASE") ||
    upper.includes("SQL") ||
    upper.includes("QUERY") ||
    upper.includes("EXEC") ||
    upper.includes("4672")
  ) {
    return "APPLICATION_ACCESS";
  }

  // Authentication & Identity patterns
  if (
    upper.includes("LOGON") ||
    upper.includes("LOGIN") ||
    upper.includes("AUTH") ||
    upper.includes("PASSWD") ||
    upper.includes("SSH") ||
    upper.includes("PAM") ||
    upper.includes("CREDENTIAL") ||
    upper.includes("4624") ||
    upper.includes("4625") ||
    upper.includes("4740")
  ) {
    return "AUTHENTICATION";
  }

  return undefined;
}
