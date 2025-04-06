document.addEventListener('DOMContentLoaded', () => {
    const quoteElement = document.getElementById('rotating-quote');
    if (!quoteElement) return; // Exit if element not found

    const quotes = [
        "The best investment you can make is in yourself.",
        "Financial freedom is available to those who learn about it and work for it.",
        "An investment in knowledge pays the best interest.",
        "Don't save what is left after spending, spend what is left after saving.",
        "Beware of little expenses; a small leak will sink a great ship.",
        "The stock market is filled with individuals who know the price of everything, but the value of nothing.",
        "Planning is bringing the future into the present so that you can do something about it now."
    ];

    let currentQuoteIndex = 0;

    function changeQuote() {
        // Fade out
        quoteElement.classList.add('fade-out');

        // Wait for fade out transition to complete
        setTimeout(() => {
            currentQuoteIndex = (currentQuoteIndex + 1) % quotes.length;
            quoteElement.textContent = quotes[currentQuoteIndex];
            // Fade in
            quoteElement.classList.remove('fade-out');
        }, 500); // Should match the transition duration in CSS
    }

    // Initial quote set (no fade)
    quoteElement.textContent = quotes[currentQuoteIndex];

    // Change quote every 6 seconds (adjust as needed)
    setInterval(changeQuote, 6000);
});