export type CircuitState = "closed" | "open" | "half_open";

type Circuit = {
  state: CircuitState;
  failures: number;
  openedAt?: number;
  lastFailure?: number;
};

type GlobalStore = typeof globalThis & {
  __aptusCircuits?: Map<string, Circuit>;
};

const globalStore = globalThis as GlobalStore;

const DEFAULT_THRESHOLD = 5;
const DEFAULT_COOLDOWN_MS = 30_000;

function getCircuits(): Map<string, Circuit> {
  if (!globalStore.__aptusCircuits) {
    globalStore.__aptusCircuits = new Map();
  }
  return globalStore.__aptusCircuits;
}

function getCircuit(name: string): Circuit {
  const circuits = getCircuits();
  if (!circuits.has(name)) {
    circuits.set(name, { state: "closed", failures: 0 });
  }
  return circuits.get(name)!;
}

export class CircuitOpenError extends Error {
  constructor(service: string) {
    super(`Circuit breaker open for ${service}`);
    this.name = "CircuitOpenError";
  }
}

export async function withCircuitBreaker<T>(
  name: string,
  fn: () => Promise<T>,
  threshold = DEFAULT_THRESHOLD,
  cooldownMs = DEFAULT_COOLDOWN_MS,
): Promise<T> {
  const circuit = getCircuit(name);
  const now = Date.now();

  if (circuit.state === "open") {
    if (circuit.openedAt && now - circuit.openedAt >= cooldownMs) {
      circuit.state = "half_open";
    } else {
      throw new CircuitOpenError(name);
    }
  }

  try {
    const result = await fn();
    circuit.state = "closed";
    circuit.failures = 0;
    circuit.openedAt = undefined;
    return result;
  } catch (error) {
    circuit.failures += 1;
    circuit.lastFailure = now;
    if (circuit.failures >= threshold) {
      circuit.state = "open";
      circuit.openedAt = now;
    }
    throw error;
  }
}
