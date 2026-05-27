import { useAppContext, type ActiveTab } from "../../context/AppContext";

const TABS: { id: ActiveTab; label: string; emoji: string }[] = [
  { id: "eda",         label: "Explore Data",       emoji: "📊" },
  { id: "model",       label: "Train Model",         emoji: "🤖" },
  { id: "experiments", label: "Experiment History",  emoji: "📋" },
];

export function TabBar() {
  const { state, dispatch } = useAppContext();
  const { activeTab, fileId } = state;

  if (!fileId) return null;

  return (
    <>
      {/* Desktop tab bar */}
      <nav
        className="tab-bar-desktop"
        style={{
          background: "var(--color-surface)",
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          gap: "4px",
          padding: "0 var(--spacing-3)",
        }}
        role="tablist"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => dispatch({ type: "SET_TAB", payload: tab.id })}
            style={{
              padding: "12px 20px",
              border: "none",
              borderBottom: activeTab === tab.id
                ? "2px solid var(--color-primary)"
                : "2px solid transparent",
              background: "none",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: activeTab === tab.id ? 700 : 500,
              color: activeTab === tab.id
                ? "var(--color-primary)"
                : "var(--color-text-muted)",
              whiteSpace: "nowrap",
              transition: "color var(--transition), border-color var(--transition)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>{tab.emoji}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Mobile select dropdown */}
      <div
        className="tab-bar-mobile"
        style={{ padding: "var(--spacing-1) var(--spacing-2)" }}
      >
        <select
          className="form-select"
          value={activeTab}
          onChange={(e) =>
            dispatch({ type: "SET_TAB", payload: e.target.value as ActiveTab })
          }
          aria-label="Select tab"
        >
          {TABS.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.emoji} {tab.label}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
