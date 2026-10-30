import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const explanationState = vi.hoisted(() => ({
  current: {
    isPending: false,
    isError: false,
    data: null as unknown,
    refetch: vi.fn(),
  },
}));
const regenerateState = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  isPending: false,
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: vi.fn() }),
}));
vi.mock("../hooks/use-ai-alerts", () => ({
  useAiAlertExplanation: () => explanationState.current,
  useRegenerateAiAlertExplanation: () => regenerateState,
}));
import { AiAlertDetailDialog, statusTone } from "./ai-alert-detail-dialog";

const alert = {
  id: "11111111-1111-4111-8111-111111111111",
  alertCode: "AI-2026-001",
  anomalyScore: 0.92,
  riskScore: 8.5,
  riskLevel: "high",
  title: "Unusual authentication activity",
  description: "Multiple failed sign-ins were detected.",
  status: "new" as const,
  detectedAt: "2026-09-11T03:00:00.000Z",
  asset: null,
  logSource: {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Windows Authentication",
    sourceType: "authentication",
  },
  model: {
    id: "33333333-3333-4333-8333-333333333333",
    name: "anomaly-detector",
    version: "1.0.0",
    provider: "ollama",
  },
  event: {
    id: "44444444-4444-4444-8444-444444444444",
    eventType: "authentication.failed",
    eventTime: "2026-09-11T02:59:00.000Z",
  },
  createdAt: "2026-09-11T03:00:01.000Z",
};

describe("statusTone", () => {
  it("uses workflow colors instead of risk severity colors", () => {
    expect(statusTone("new")).toBe("info");
    expect(statusTone("reviewing")).toBe("warning");
    expect(statusTone("confirmed")).toBe("success");
    expect(statusTone("resolved")).toBe("success");
    expect(statusTone("false_positive")).toBe("neutral");
    expect(statusTone("dismissed")).toBe("neutral");
  });
});

beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.setAttribute("open", "");
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    },
  });
});

afterEach(cleanup);
beforeEach(() => {
  explanationState.current.isPending = false;
  explanationState.current.isError = false;
  explanationState.current.data = null;
  regenerateState.isPending = false;
  regenerateState.mutateAsync.mockReset();
});

describe("AiAlertDetailDialog", () => {
  it("explains statistical rarity using actual sample counts without fixed-point terms", () => {
    explanationState.current.data = {
      explanationText: "Unusual compared with prior activity.",
      featureContributions: [
        {
          featureName: "statistical_baseline",
          featureValue:
            '{"method":"empirical-history-v1","status":"READY","activeWindows":40,"windowMinutes":5,"comparisons":[{"signal":"failures_per_window","observed":20,"samples":40,"equallyOrMoreUnusual":0}]}',
          contributionScore: 0.97560976,
          rank: 1,
        },
      ],
      baselineData: null,
      createdAt: "2026-10-30T01:00:00Z",
    };
    render(<AiAlertDetailDialog alert={alert} onClose={vi.fn()} />);
    expect(screen.getByText("Historical comparison")).toBeVisible();
    expect(screen.getByText(/0 of 40 historical observations/)).toBeVisible();
    expect(
      screen.queryByText("How the score was calculated"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("55 points")).not.toBeInTheDocument();
  });
  it("shows score changes separately without dumping scoring snapshots", async () => {
    explanationState.current.data = {
      explanationText: "Updated priority.",
      featureContributions: [
        {
          featureName: "alert_score_update",
          featureValue:
            '{"previousScore":0.57,"score":0.81,"updatedAt":"2026-10-30T01:00:00Z","features":[]}',
          contributionScore: null,
          rank: 101,
        },
      ],
      baselineData: null,
      createdAt: "2026-10-30T01:00:00Z",
    };
    render(<AiAlertDetailDialog alert={alert} onClose={vi.fn()} />);
    await userEvent.setup().click(screen.getByText("Score history (1)"));
    expect(screen.getByText("57% → 81%")).toBeVisible();
    expect(screen.queryByText(/"features":/)).not.toBeInTheDocument();
  });
  it("presents a legacy fallback without dumping internal evidence", () => {
    explanationState.current.data = {
      explanationText:
        'Detection rule matched: ["VPN_SSO_NEW_CONTEXT_OFF_HOURS"]. The signal score is 0.6700; rule-based detection is independent of the behavioral threshold 0.7000. Evidence: rule_score_breakdown: {"base":0.55}',
      featureContributions: [],
      baselineData: null,
      createdAt: "2026-09-11T03:00:01.000Z",
    };
    render(<AiAlertDetailDialog alert={alert} onClose={vi.fn()} />);
    expect(
      screen.queryByText(/Evidence: rule_score_breakdown/),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Priority score: 67%/)).toBeInTheDocument();
  });
  it("summarizes SSO evidence without suggesting failed attempts and explains priority points", () => {
    explanationState.current.data = {
      explanationText: "Stored technical explanation.",
      featureContributions: [
        {
          featureName: "matched_rules",
          featureValue: '["VPN_SSO_NEW_CONTEXT_OFF_HOURS"]',
          contributionScore: 0.67,
          rank: 1,
        },
        {
          featureName: "failure_count_in_window",
          featureValue: '{"count":0,"windowMinutes":5}',
          contributionScore: 0,
          rank: 2,
        },
        {
          featureName: "working_hours",
          featureValue:
            '{"offHours":true,"localHour":1,"timeZone":"Asia/Ho_Chi_Minh"}',
          contributionScore: 0,
          rank: 3,
        },
        {
          featureName: "baseline_context",
          featureValue: '{"ready":true,"successfulEvents":20,"newIp":true}',
          contributionScore: 0,
          rank: 4,
        },
        {
          featureName: "rule_score_breakdown",
          featureValue:
            '{"base":0.55,"sourceSeverity":0.020000000000000004,"offHours":0.05,"newIp":0.05,"cap":0.99}',
          contributionScore: 0,
          rank: 5,
        },
      ],
      baselineData: { threshold: 0.7 },
      createdAt: "2026-09-11T03:00:01.000Z",
    };
    render(<AiAlertDetailDialog alert={alert} onClose={vi.fn()} />);
    expect(
      screen.queryByText(/0 failed attempts within/),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("IP address not seen in 20 previous successful events."),
    ).toBeVisible();
    expect(screen.getByText("55 points")).toBeVisible();
    expect(screen.getByText("2 points")).toBeVisible();
    expect(
      screen.getByText("Recorded detection metadata").closest("details"),
    ).not.toHaveAttribute("open");
    expect(
      screen.getByText("Stored explanation").closest("details"),
    ).not.toHaveAttribute("open");
  });

  it("shows readable context and keeps grouped evidence and technical data collapsed", async () => {
    explanationState.current.data = {
      explanationText: "Authentication failures matched a rule.",
      featureContributions: [
        {
          featureName: "matched_rules",
          featureValue: '["AUTH_FAILURE_BURST"]',
          contributionScore: 0.9,
          rank: 1,
        },
        {
          featureName: "failure_count_in_window",
          featureValue: '{"count":5,"windowMinutes":5}',
          contributionScore: 0,
          rank: 2,
        },
        {
          featureName: "engine_version",
          featureValue: '"contextual-rules-v1"',
          contributionScore: 0,
          rank: 9,
        },
        {
          featureName: "correlated_detection",
          featureValue:
            '{"eventId":"extra-event","score":0.87,"occurredAt":"2026-10-30T03:00:00Z"}',
          contributionScore: null,
          rank: 100,
        },
      ],
      baselineData: null,
      createdAt: "2026-09-11T03:00:01.000Z",
    };
    render(<AiAlertDetailDialog alert={alert} onClose={vi.fn()} />);
    expect(screen.getByText("Repeated failed sign-ins")).toBeVisible();
    expect(
      screen.getByText("5 failed attempts within 5 minutes."),
    ).toBeVisible();
    expect(screen.queryByText("No score change")).not.toBeInTheDocument();
    expect(screen.queryByText("Raises score")).not.toBeInTheDocument();
    expect(screen.getByText("Rule score")).toBeVisible();
    expect(screen.getByText("90%")).toBeVisible();
    const grouped = screen.getByText("Grouped detections (1)");
    expect(grouped.closest("details")).not.toHaveAttribute("open");
    expect(
      screen.getByText("Technical details").closest("details"),
    ).not.toHaveAttribute("open");
    await userEvent.setup().click(grouped);
    expect(grouped.closest("details")).toHaveAttribute("open");
    expect(screen.getByText("Related detection 1")).toBeVisible();
    expect(screen.getByText(/30\/10\/2026/)).toBeVisible();
    expect(screen.getByText("extra-event")).not.toBeVisible();
    await userEvent
      .setup()
      .click(screen.getByText("Technical identifiers for detection 1"));
    expect(screen.getByText("extra-event")).toBeVisible();
  });

  it("renders correlated detections with repeated names and ranks without key warnings", () => {
    const consoleError = vi.spyOn(console, "error");
    try {
      explanationState.current.data = {
        explanationText: "Repeated authentication failures.",
        featureContributions: ["event-one", "event-two"].map((eventId) => ({
          featureName: "correlated_detection",
          featureValue: eventId,
          contributionScore: null,
          rank: 100,
        })),
        baselineData: null,
        createdAt: "2026-09-11T03:00:01.000Z",
      };
      render(<AiAlertDetailDialog alert={alert} onClose={vi.fn()} />);
      expect(screen.getByText("event-one")).toBeInTheDocument();
      expect(screen.getByText("event-two")).toBeInTheDocument();
      expect(screen.getAllByText("Event time not recorded")).toHaveLength(2);
      expect(screen.getAllByText("Not recorded")).toHaveLength(2);
      expect(consoleError).not.toHaveBeenCalled();
    } finally {
      consoleError.mockRestore();
    }
  });

  it("shows the stored explanation and influencing factors", () => {
    explanationState.current.data = {
      explanationText: "Five failed sign-ins exceeded the baseline.",
      featureContributions: [
        {
          featureName: "failedSignIns",
          featureValue: "5",
          contributionScore: 0.4,
          rank: 1,
        },
      ],
      baselineData: { normalFailedSignIns: 1 },
      createdAt: "2026-09-11T03:00:01.000Z",
    };
    render(<AiAlertDetailDialog alert={alert} onClose={vi.fn()} />);
    expect(screen.getByText("Alert explanation")).toBeInTheDocument();
    expect(
      screen.getByText(/Ollama only turns the stored evidence/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Five failed sign-ins exceeded the baseline."),
    ).toBeInTheDocument();
    expect(screen.getByText("Failed Sign Ins")).toBeInTheDocument();
    expect(screen.queryByText("Influence rank 1")).not.toBeInTheDocument();
    expect(screen.getByText("+0.4")).toBeInTheDocument();
    expect(screen.getByText("Raises score")).toBeInTheDocument();
    expect(screen.getByText("Normal Failed Sign Ins")).toBeInTheDocument();
  });

  it("requires a reason before regenerating the explanation", async () => {
    explanationState.current.data = {
      explanationText: "Stored explanation.",
      featureContributions: [],
      baselineData: null,
      createdAt: "2026-09-11T03:00:01.000Z",
    };
    render(<AiAlertDetailDialog alert={alert} onClose={vi.fn()} />);
    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: "Regenerate explanation" }),
    );
    const submit = screen.getByRole("button", { name: "Regenerate" });
    expect(submit).toBeDisabled();
    await user.type(
      screen.getByLabelText("Reason for regeneration"),
      "Review explanation accuracy",
    );
    expect(submit).toBeEnabled();
    await user.click(submit);
    expect(regenerateState.mutateAsync).toHaveBeenCalledWith({
      reason: "Review explanation accuracy",
    });
  });

  it("explains when no stored explanation exists", () => {
    render(<AiAlertDetailDialog alert={alert} onClose={vi.fn()} />);
    expect(
      screen.getByText(
        "No alert explanation has been recorded for this alert.",
      ),
    ).toBeInTheDocument();
  });

  it("shows a loading state while the explanation is fetched", () => {
    explanationState.current.isPending = true;
    render(<AiAlertDetailDialog alert={alert} onClose={vi.fn()} />);
    expect(
      screen.getByRole("status", { name: "Loading alert explanation" }),
    ).toBeInTheDocument();
  });

  it("offers a retry when the explanation request fails", async () => {
    explanationState.current.isError = true;
    render(<AiAlertDetailDialog alert={alert} onClose={vi.fn()} />);
    expect(
      screen.getByText("Unable to load the alert explanation."),
    ).toBeInTheDocument();
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Try again" }));
    expect(explanationState.current.refetch).toHaveBeenCalledOnce();
  });

  it("shows backend alert, event, source, and model details", () => {
    render(<AiAlertDetailDialog alert={alert} onClose={vi.fn()} />);
    expect(screen.getByRole("dialog")).toHaveAttribute("open");
    expect(screen.getByText(alert.title)).toBeInTheDocument();
    expect(screen.getByText("92%")).toBeInTheDocument();
    expect(screen.getByText("Detection risk level")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText("8.5")).toBeInTheDocument();
    expect(screen.getByText("authentication.failed")).toBeInTheDocument();
    expect(screen.getByText("Windows Authentication")).toBeInTheDocument();
    expect(screen.getByText("anomaly-detector 1.0.0")).toBeInTheDocument();
  });

  it("identifies alerts without an AI risk suggestion", () => {
    render(
      <AiAlertDetailDialog
        alert={{ ...alert, riskScore: null, riskLevel: null }}
        onClose={vi.fn()}
      />,
    );
    expect(
      screen.getByText("Detection risk level").parentElement,
    ).toHaveTextContent("Not available");
    expect(
      screen.getByText("Detection risk score").parentElement,
    ).toHaveTextContent("Not available");
  });

  it("closes through the secondary action", async () => {
    const onClose = vi.fn();
    render(<AiAlertDetailDialog alert={alert} onClose={onClose} />);
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
