document.addEventListener('DOMContentLoaded', () => {
    const themeIcon = document.getElementById('theme-icon');
    if (!themeIcon) {
        console.warn("Theme icon element (#theme-icon) not found.");
        return;
    }

    const applyTheme = (darkMode) => {
        document.body.classList.toggle('dark-mode', darkMode);
        if (darkMode) {
            themeIcon.classList.remove('bx-sun');
            themeIcon.classList.add('bx-moon');
        } else {
            themeIcon.classList.remove('bx-moon');
            themeIcon.classList.add('bx-sun');
        }
    };

    themeIcon.addEventListener('click', () => {
        const newIsDarkMode = !document.body.classList.contains('dark-mode');
        applyTheme(newIsDarkMode);
        try {
            localStorage.setItem('theme', newIsDarkMode ? 'dark' : 'light');
        } catch (e) {
            console.error("Could not save theme preference:", e);
        }
    });

    let savedTheme = null;
    try {
        savedTheme = localStorage.getItem('theme');
    } catch (e) {
        console.error("Could not read theme preference:", e);
    }

    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
    const initialDarkMode = savedTheme === 'dark' || (!savedTheme && prefersDark);
    applyTheme(initialDarkMode);
});