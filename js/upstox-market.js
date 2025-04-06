document.addEventListener('DOMContentLoaded', () => {
    const connectButton = document.getElementById('connect-upstox-button');
    const subscribeButton = document.getElementById('subscribe-button');
    const instrumentInput = document.getElementById('instrument-key');
    const marketTableBody = document.getElementById('market-table-body');
    const statusSpan = document.getElementById('upstox-status');
    const controlsDiv = document.getElementById('market-data-controls');
    const logOutput = document.getElementById('log-output');
    const noDataRow = document.getElementById('no-data-row');

    let websocket = null;
    let subscribedInstruments = {}; // Keep track of subscribed instruments
    let firebaseUser = null;

    // --- Authentication Placeholder ---
    // WARNING: This is highly simplified. Real OAuth requires backend handling.
    // You'd typically redirect to Upstox, get an auth code, exchange it for an
    // access token on your server, and then your server provides the WebSocket URL.
    function connectToUpstox() {
        log("Attempting connection (Placeholder)...");
        // 1. **SERVER-SIDE:** Initiate OAuth flow with Upstox using your API key/secret.
        // 2. User logs into Upstox and authorizes.
        // 3. Upstox redirects back to your configured callback URL with an authorization code.
        // 4. **SERVER-SIDE:** Exchange the code for an access_token and refresh_token. Store securely.
        // 5. **SERVER-SIDE:** Use the access_token to call the Upstox API
        //    (e.g., /v3/feed/market-data-feed/authorize) to get the authorized WebSocket URL (wss://...).
        // 6. **SERVER-SIDE:** Securely pass the WebSocket URL to this client-side script.

        // **Client-Side Placeholder:** Assume we magically got the URL from the backend
        const WSS_URL_FROM_BACKEND = "wss://your-backend-should-provide-this.upstox.com/..."; // **REPLACE THIS**

        if (!WSS_URL_FROM_BACKEND || WSS_URL_FROM_BACKEND.includes("should-provide-this")) {
             log("Error: WebSocket URL not provided. Backend setup required.");
             updateStatus("Error: Setup Required", true);
             return;
        }

        log(`Obtained WebSocket URL: ${WSS_URL_FROM_BACKEND}`);
        establishWebSocketConnection(WSS_URL_FROM_BACKEND);
    }

    // --- WebSocket Handling ---
    function establishWebSocketConnection(url) {
        if (websocket && websocket.readyState === WebSocket.OPEN) {
            log("WebSocket already open.");
            return;
        }

        log("Establishing WebSocket connection...");
        updateStatus("Connecting...");

        websocket = new WebSocket(url);

        websocket.onopen = () => {
            log("WebSocket Connection Established.");
            updateStatus("Connected", false);
            controlsDiv.style.display = 'block'; // Show controls only when connected
            if (noDataRow) noDataRow.style.display = 'none'; // Hide default message
        };

        websocket.onmessage = (event) => {
            // **CRITICAL:** Upstox sends data as Protobuf (binary).
            // You need to decode event.data here using a Protobuf library
            // and the MarketDataFeed.proto definitions from Upstox.
            log("Received binary message (needs Protobuf decoding).");

            // Placeholder for decoded data structure (adjust based on actual proto)
            // let decodedData = decodeProtobufMessage(event.data); // You need to implement this

            // Example: Assuming decodedData has a structure like { feedType: 'ltpc', data: { ltp: ..., instrumentKey: ... } }
            // handleDecodedData(decodedData);
        };

        websocket.onerror = (error) => {
            console.error("WebSocket Error:", error);
            log(`WebSocket Error: ${error.message || 'Unknown error'}`);
            updateStatus("Error", true);
            controlsDiv.style.display = 'none';
            if(noDataRow) noDataRow.style.display = 'table-row';
        };

        websocket.onclose = (event) => {
            log(`WebSocket Closed. Code: ${event.code}, Reason: ${event.reason || 'No reason specified'}`);
            updateStatus("Disconnected", true);
            websocket = null;
            subscribedInstruments = {}; // Reset subscriptions on close
            clearTable(); // Clear the table
            controlsDiv.style.display = 'none'; // Hide controls
             if(noDataRow) noDataRow.style.display = 'table-row';
        };
    }

    // --- Protobuf Decoding Placeholder ---
    function decodeProtobufMessage(binaryData) {
        // 1. Make sure you have included a Protobuf JS library (e.g., protobuf.js).
        // 2. Load the Upstox MarketDataFeed.proto definitions.
        // 3. Use the library to decode the binaryData (which might be a Blob or ArrayBuffer).
        // Example using protobuf.js (syntax might vary):
        // const MarketDataFeed = protobufRoot.lookupType("com.upstox.marketdatafeeder.rpc.proto.MarketDataFeed");
        // const message = MarketDataFeed.decode(new Uint8Array(binaryData));
        // return MarketDataFeed.toObject(message, { /* options */ });

        log("Protobuf decoding not implemented.");
        return null; // Return null until implemented
    }


    // --- Data Handling and UI Update ---
     function handleDecodedData(decodedData) {
        if (!decodedData || !decodedData.instrumentKey) return; // Need instrumentKey to update table

        const instrumentKey = decodedData.instrumentKey;
        let row = document.getElementById(`row-${instrumentKey.replace('|', '-')}`); // Create unique ID

        if (!row) { // If row doesn't exist, create it (should happen after subscription ack)
            row = marketTableBody.insertRow();
            row.id = `row-${instrumentKey.replace('|', '-')}`;
            row.innerHTML = `
                <td>${instrumentKey}</td>
                <td data-field="ltp">--</td>
                <td data-field="change">--</td>
                <td data-field="open">--</td>
                <td data-field="high">--</td>
                <td data-field="low">--</td>
                <td data-field="close">--</td>
                <td data-field="volume">--</td>
                <td data-field="timestamp">--</td>
                <td><button class="button-small unsubscribe-btn" data-instrument="${instrumentKey}">Unsubscribe</button></td>
            `;
             // Add event listener for the new unsubscribe button
            row.querySelector('.unsubscribe-btn').addEventListener('click', handleUnsubscribe);
        }

        // Update cells based on feed type and data received
        // This needs to be mapped according to the actual Protobuf structure
        const updateCell = (field, value) => {
            const cell = row.querySelector(`[data-field="${field}"]`);
            if (cell && value !== undefined && value !== null) {
                 const oldValue = parseFloat(cell.textContent);
                 const newValue = parseFloat(value);
                 cell.textContent = value; // Update text

                 // Optional: Add visual flash for changes
                 if (!isNaN(oldValue) && !isNaN(newValue) && field === 'ltp') {
                    let flashClass = '';
                     if (newValue > oldValue) flashClass = 'flash-green';
                     else if (newValue < oldValue) flashClass = 'flash-red';

                     if(flashClass) {
                         cell.classList.add(flashClass);
                         setTimeout(() => cell.classList.remove(flashClass), 500); // Remove flash after 500ms
                     }
                 }
            }
        };

        // Example updates based on assumed decoded structure
        if (decodedData.feedType === 'ltpc' || decodedData.feedType === 'full') { // Adjust based on Upstox proto
             updateCell('ltp', decodedData.data?.ltpc?.ltp); // Use optional chaining
             updateCell('close', decodedData.data?.ltpc?.cp);
             updateCell('timestamp', formatTimestamp(decodedData.data?.ltpc?.ltt)); // Format timestamp
             // ... add more fields if available in 'ltpc' (e.g., change calculation if needed)
        }
        if (decodedData.feedType === 'full') {
             updateCell('open', decodedData.data?.marketLevel?.ohlc?.o);
             updateCell('high', decodedData.data?.marketLevel?.ohlc?.h);
             updateCell('low', decodedData.data?.marketLevel?.ohlc?.l);
             updateCell('volume', decodedData.data?.marketLevel?.vtt); // Volume Traded Today
             // ... add more fields from 'full' mode
        }
        // Add handlers for 'quote', market status updates etc.
     }

    function formatTimestamp(unixTimestamp) {
        if (!unixTimestamp) return '--';
        // Assuming timestamp is in seconds or milliseconds - adjust if needed
        const date = new Date(parseInt(unixTimestamp) * 1000); // Multiply by 1000 if it's seconds
        return date.toLocaleTimeString();
    }

    // --- Subscription Handling ---
    function subscribeToInstrument(instrumentKey) {
        if (!websocket || websocket.readyState !== WebSocket.OPEN) {
            log("WebSocket not connected. Cannot subscribe.");
            return;
        }
        if (!instrumentKey) {
             log("No instrument key provided.");
             return;
        }
         if (subscribedInstruments[instrumentKey]) {
            log(`Already subscribed to ${instrumentKey}`);
            return;
        }

        log(`Subscribing to ${instrumentKey}...`);
        const subscriptionRequest = {
            guid: generateGuid(), // Unique ID for the request
            method: "sub",
            data: {
                mode: "full", // Or "ltpc" or "quote"
                instrumentKeys: [instrumentKey]
            }
        };

        // Send the subscription request (must be binary Protobuf format)
        // websocket.send(encodeProtobufMessage(subscriptionRequest)); // You need an encoder!
        websocket.send(JSON.stringify(subscriptionRequest)); // TEMP: Sending JSON - WILL LIKELY FAIL if Upstox expects binary
         log("Sent subscription request (Note: Needs Protobuf encoding)");

        subscribedInstruments[instrumentKey] = true; // Assume success for now
        instrumentInput.value = ''; // Clear input field

        // Add placeholder row immediately (optional)
        if (!document.getElementById(`row-${instrumentKey.replace('|', '-')}`)) {
             const placeholderRow = marketTableBody.insertRow();
             placeholderRow.id = `row-${instrumentKey.replace('|', '-')}`;
             placeholderRow.innerHTML = `
                <td>${instrumentKey}</td>
                <td data-field="ltp">Subscribing...</td>
                <td data-field="change">--</td>
                <td data-field="open">--</td>
                <td data-field="high">--</td>
                <td data-field="low">--</td>
                <td data-field="close">--</td>
                <td data-field="volume">--</td>
                <td data-field="timestamp">--</td>
                <td><button class="button-small unsubscribe-btn" data-instrument="${instrumentKey}">Unsubscribe</button></td>
            `;
             placeholderRow.querySelector('.unsubscribe-btn').addEventListener('click', handleUnsubscribe);
        }

    }
     function handleUnsubscribe(event) {
        const instrumentKey = event.target.getAttribute('data-instrument');
        unsubscribeFromInstrument(instrumentKey);
    }


    function unsubscribeFromInstrument(instrumentKey) {
         if (!websocket || websocket.readyState !== WebSocket.OPEN) {
            log("WebSocket not connected. Cannot unsubscribe.");
            return;
        }
        if (!instrumentKey || !subscribedInstruments[instrumentKey]) {
            log(`Not subscribed to ${instrumentKey}`);
            return;
        }

         log(`Unsubscribing from ${instrumentKey}...`);
          const unsubscribeRequest = {
            guid: generateGuid(),
            method: "unsub",
            data: {
                 instrumentKeys: [instrumentKey]
            }
        };

         // Send the request (Needs Protobuf encoding)
         // websocket.send(encodeProtobufMessage(unsubscribeRequest));
         websocket.send(JSON.stringify(unsubscribeRequest)); // TEMP: Sending JSON - WILL LIKELY FAIL
         log("Sent unsubscribe request (Note: Needs Protobuf encoding)");


        delete subscribedInstruments[instrumentKey];

        // Remove the row from the table
        const row = document.getElementById(`row-${instrumentKey.replace('|', '-')}`);
        if (row) {
            row.remove();
        }

         if (Object.keys(subscribedInstruments).length === 0 && noDataRow) {
            noDataRow.style.display = 'table-row';
        }
    }

     // Placeholder for Protobuf message encoding
    function encodeProtobufMessage(jsObject) {
        log("Protobuf encoding not implemented. Sending JSON (likely incorrect).");
        // Implement using your Protobuf library and the .proto definitions
        return JSON.stringify(jsObject); // Return JS object as JSON string - **WRONG for Upstox**
    }


    // --- Utility Functions ---
    function log(message) {
        console.log(message);
        const timestamp = new Date().toLocaleTimeString();
        logOutput.textContent = `[${timestamp}] ${message}\n` + logOutput.textContent;
        // Limit log size
        const lines = logOutput.textContent.split('\n');
        if (lines.length > 50) {
            logOutput.textContent = lines.slice(0, 50).join('\n');
        }
    }

    function updateStatus(text, isError = false) {
        statusSpan.textContent = text;
        statusSpan.style.color = isError ? '#dc3545' : '#28a745'; // Red for error, Green for success
    }

     function generateGuid() { // Simple GUID generator for request IDs
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

     function clearTable() {
         marketTableBody.innerHTML = ''; // Clear all rows
          // Re-add the 'no data' row if needed
        if (noDataRow) {
             marketTableBody.appendChild(noDataRow);
            noDataRow.style.display = 'table-row';
        }
     }


    // --- Initialization ---
    function initializePage() {
        if (typeof firebase !== 'undefined' && firebase.apps.length) {
            firebase.auth().onAuthStateChanged(user => {
                firebaseUser = user;
                if (!user) {
                    // Optional: Disable connect button if not logged into Firebase
                     log("Firebase user not logged in.");
                     updateStatus("Disconnected (Login required)", true);
                     connectButton.disabled = true;
                } else {
                    log("Firebase user logged in.");
                     connectButton.disabled = false; // Enable connect button
                }
            });
        } else {
            log("Firebase not initialized.");
             updateStatus("Error: Firebase missing", true);
             connectButton.disabled = true;
        }

        connectButton.addEventListener('click', connectToUpstox);
        subscribeButton.addEventListener('click', () => {
             const key = instrumentInput.value.trim();
             subscribeToInstrument(key);
        });

        // Initial state
        controlsDiv.style.display = 'none';
        updateStatus("Disconnected");
        log("Page Initialized. Ready to connect.");
    }

    initializePage();

});

// Add some basic CSS for flashing cells if not already in style.css
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = `
  @keyframes flashGreen { 0%, 100% { background-color: inherit; } 50% { background-color: rgba(40, 167, 69, 0.5); } }
  @keyframes flashRed { 0%, 100% { background-color: inherit; } 50% { background-color: rgba(220, 53, 69, 0.5); } }
  .flash-green { animation: flashGreen 0.5s ease-out; }
  .flash-red { animation: flashRed 0.5s ease-out; }
  .button-small { padding: 0.2rem 0.5rem; font-size: 0.8rem; }
  .warning { color: #ffc107; background-color: rgba(255, 193, 7, 0.1); border: 1px solid #ffc107; padding: 0.5rem; border-radius: 4px; margin-top: 1rem;}
  .info { font-size: 0.9rem; color: var(--secondary-color); margin-top: 0.5rem; }
  #market-table th, #market-table td { text-align: left; padding: 8px; }
  #market-table thead { border-bottom: 2px solid var(--border-color); }
`;
document.head.appendChild(styleSheet);