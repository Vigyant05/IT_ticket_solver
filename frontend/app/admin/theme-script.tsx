// This script runs before React hydration to set the theme class
// preventing flash of wrong theme
export function ThemeScript() {
  const script = `
    (function() {
      try {
        var stored = localStorage.getItem('it-ticket-store');
        var theme = 'dark';
        if (stored) {
          var parsed = JSON.parse(stored);
          if (parsed && parsed.state && parsed.state.theme) {
            theme = parsed.state.theme;
          }
        }
        document.documentElement.setAttribute('data-theme', theme);
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (e) {
        document.documentElement.classList.add('dark');
      }
    })();
  `;
  return <script id="theme-script" dangerouslySetInnerHTML={{ __html: script }} />;
}
