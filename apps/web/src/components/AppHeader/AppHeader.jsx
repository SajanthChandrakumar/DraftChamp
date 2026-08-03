import { Brand } from "../Brand";

export function AppHeader({ onHome, showHome }) {
  return (
    <header className="app-header">
      {showHome ? (
        <button type="button" className="app-header__brand-button" onClick={onHome}>
          <Brand size="sm" />
        </button>
      ) : (
        <Brand size="sm" />
      )}
    </header>
  );
}
