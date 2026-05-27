import "@testing-library/jest-dom";
import { beforeAll, afterEach, afterAll, vi } from "vitest";
import { server } from "./mocks/server";

// Recharts ResponsiveContainer uses ResizeObserver which isn't in jsdom
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
