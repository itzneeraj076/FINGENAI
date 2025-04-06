document.addEventListener('DOMContentLoaded', () => {
    const marketWidget = document.getElementById('market-data-widget');
    const finnhubDataDisplay = document.getElementById('finnhub-market-data');

    if (!marketWidget && !finnhubDataDisplay) {
        console.warn("No market data display elements found (market-data-widget or finnhub-market-data).");
        return;
    }

    const FINNHUB_API_KEY = 'cvp47i1r01qihjts2n20cvp47i1r01qihjts2n2g';
    const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
    const stockSymbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA'];

    async function fetchFinnhubQuote(symbol) {
        const url = `${FINNHUB_BASE_URL}/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                 let errorMsg = `HTTP error! status: ${response.status}`;
                 try {
                    const errData = await response.json();
                    if (errData && errData.error) errorMsg += ` - ${errData.error}`;
                 } catch (e) { }
                 throw new Error(errorMsg);
            }
            const data = await response.json();

            if (data && typeof data.c !== 'undefined' && data.c !== 0) {
                return { symbol: symbol, quote: data };
            } else {
                console.warn(`No valid quote data received for ${symbol}. Response:`, data);
                return { symbol: symbol, quote: null };
            }
        } catch (error) {
            console.error(`Error fetching Finnhub quote for ${symbol}:`, error);
             return { symbol: symbol, quote: null };
        }
    }

    function displayData(stockQuotes, targetElement) {
        if (!targetElement) return;

        let html = '';

        if (!stockQuotes || stockQuotes.length === 0) {
             targetElement.innerHTML = '<p>Could not load market data. Please try again later.</p>';
             return;
        }

        stockQuotes.forEach(quoteData => {
            if (quoteData && quoteData.quote) {
                const quote = quoteData.quote;
                const symbol = quoteData.symbol;
                const price = parseFloat(quote.c).toFixed(2);
                const change = parseFloat(quote.d);
                const changePercent = parseFloat(quote.dp);
                const prevClose = parseFloat(quote.pc).toFixed(2);
                let changeClass = '';
                let sign = '';
                let changeText = 'N/A';

                if (change !== null && !isNaN(change) && changePercent !== null && !isNaN(changePercent)) {
                    changeClass = change >= 0 ? 'positive' : 'negative';
                    sign = change >= 0 ? '+' : '';
                    changeText = `${sign}${change.toFixed(2)} (<span>${sign}${changePercent.toFixed(2)}%</span>)`;
                }

                html += `
                    <div class="market-item">
                        <p><strong>${symbol}:</strong> <span>$${price}</span></p>
                        <p class="change ${changeClass}">Change: ${changeText}</p>
                         <p class="details"><small>Prev. Close: $${prevClose}</small></p>
                    </div>
                `;
            } else if (quoteData) {
                 html += `
                    <div class="market-item unavailable">
                        <p><strong>${quoteData.symbol}:</strong> <span class="nodata">Data unavailable</span></p>
                        <p class="change"><small>Could not fetch quote.</small></p>
                    </div>
                `;
            }
        });

        if (html) {
             targetElement.innerHTML = html;
        } else {
             targetElement.innerHTML = '<p>No market data available for the selected symbols.</p>';
        }

         const existingNote = targetElement.nextElementSibling;
         if (!existingNote || !existingNote.classList.contains('api-note')) {
            targetElement.insertAdjacentHTML('afterend', '<p class="api-note">Market data powered by <a href="https://finnhub.io" target="_blank" rel="noopener noreferrer">Finnhub.io</a>. Free tier may have limitations.</p>');
         }
    }

    async function loadMarketData() {
        const elementsToUpdate = [marketWidget, finnhubDataDisplay].filter(el => el);

        elementsToUpdate.forEach(el => {
            const existingNote = el.nextElementSibling;
             if (existingNote && existingNote.classList.contains('api-note')) {
                 existingNote.remove();
             }
            el.innerHTML = '<p>Loading market data...</p>';
        });


        const stockPromises = stockSymbols.map(symbol => fetchFinnhubQuote(symbol));

        try {
            const results = await Promise.allSettled(stockPromises);
             const successfulQuotes = results
                .filter(result => result.status === 'fulfilled' && result.value)
                .map(result => result.value);

             elementsToUpdate.forEach(el => {
                 if (successfulQuotes.length > 0) {
                     displayData(successfulQuotes, el);
                 } else {
                      console.error("All Finnhub quote fetches failed or returned no data.", results);
                       el.innerHTML = '<p>Error loading market data for all symbols. See console for details.</p>';
                       el.insertAdjacentHTML('afterend', '<p class="api-note">Market data powered by <a href="https://finnhub.io" target="_blank" rel="noopener noreferrer">Finnhub.io</a>.</p>');
                 }
             });

        } catch (error) {
            console.error("Error processing market data fetches:", error);
            elementsToUpdate.forEach(el => {
                 el.innerHTML = '<p>Error loading market data. See console for details.</p>';
                 el.insertAdjacentHTML('afterend', '<p class="api-note">Market data powered by <a href="https://finnhub.io" target="_blank" rel="noopener noreferrer">Finnhub.io</a>.</p>');
             });
        }
    }

    loadMarketData();

});