/** Next types mark NODE_ENV readonly; tests still need to flip it. */
export function setNodeEnv(value: string) {
  (process.env as { NODE_ENV: string }).NODE_ENV = value;
}
