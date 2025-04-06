import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "https://esm.run/@google/generative-ai";

// --- Configuration ---
// !!! IMPORTANT: REPLACE THIS WITH YOUR ACTUAL, VALID GEMINI API KEY !!!
const GEMINI_API_KEY = "AIzaSyAL24aU1wmySCy1xwZndfF-CzQwlQRNE8s"; // <-- VERIFY THIS KEY
const CHAT_MODEL_NAME = "gemini-2.0-flash"; // Ensure this model is available for your key

// --- DOM Elements ---
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const chatForm = document.getElementById('chat-form');
const chatContainer = document.querySelector('.chat-container'); // Used for login prompt overlay

// --- Global Variables ---
let genAI;
let model;
let isGenAIInitialized = false; // Track initialization status

// --- Initialization ---
try {
    if (!GEMINI_API_KEY || GEMINI_API_KEY.startsWith("YOUR_") || GEMINI_API_KEY.length < 30) { // Basic check
         throw new Error("Gemini API Key looks invalid or is a placeholder.");
    }
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    model = genAI.getGenerativeModel({
        model: CHAT_MODEL_NAME,
        safetySettings: [ // Basic safety settings
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        ],
    });
    isGenAIInitialized = true;
    console.log("GoogleGenerativeAI Initialized Successfully.");
} catch (error) {
    console.error("FATAL: Error initializing GoogleGenerativeAI:", error);
    // Display error persistently if init fails
    displayInitializationError(`Chatbot Initialization Failed: ${error.message}. Please check the API Key and console.`);
}

// --- Helper Functions ---
function addMessage(sender, text, isLoading = false) {
     if (!chatMessages) return null;
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');

    // Basic Markdown Handling
    let formattedText = text
        .replace(/&/g, "&amp;") // Escape HTML first
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
        .replace(/\*(.*?)\*/g, '<em>$1</em>')       // Italics
        .replace(/```([\s\S]*?)```/g, (match, p1) => `<pre><code>${p1.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`) // Code blocks
        .replace(/`([^`]+)`/g, '<code>$1</code>') // Inline code
        .replace(/\n/g, '<br>'); // Newlines

    messageDiv.innerHTML = formattedText; // Use innerHTML for formatted text

    if (isLoading) {
        messageDiv.classList.add('loading');
        messageDiv.setAttribute('id', 'loading-indicator'); // Give it an ID to find/remove later
    }
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
    return messageDiv; // Return the created element
}

function displayError(errorMessage) {
    addMessage('bot', `⚠️ **Error:** ${errorMessage}`);
    scrollToBottom();
}

function displayInitializationError(errorMessage) {
     if (!chatMessages) return;
     // Clear previous messages and show persistent error
     chatMessages.innerHTML = '';
     addMessage('bot', `⚠️ ${errorMessage}`);
     if(messageInput) messageInput.disabled = true;
     if(sendButton) sendButton.disabled = true;
     if(messageInput) messageInput.placeholder = "Chatbot unavailable";
}


function scrollToBottom() {
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

function setChatInputEnabled(enabled, reason = "Ask a financial question...") {
    if (messageInput) {
        messageInput.disabled = !enabled;
        messageInput.placeholder = reason;
    }
    if (sendButton) {
        sendButton.disabled = !enabled;
    }
}

// Function to show/hide login prompt overlay
function updateLoginPromptOverlay() {
     if (!chatContainer) return;
    const existingPrompt = chatContainer.querySelector('.login-prompt-overlay');
    if(existingPrompt) existingPrompt.remove(); // Remove old prompt first

    let showPrompt = false;
    let promptMessage = "";
    let showLoginButton = false;

     // Check Firebase Auth Status (ensure Firebase is loaded)
     let isLoggedIn = false;
     if (typeof firebase !== 'undefined' && firebase.auth && typeof firebase.auth === 'function' && firebase.auth().currentUser) {
         isLoggedIn = true;
     }

     if (!isGenAIInitialized) {
         // Don't show login prompt if core AI failed
         setChatInputEnabled(false, "Chatbot unavailable (Init failed)");
         return; // Initialization error is handled by displayInitializationError
     } else if (!isLoggedIn) {
         promptMessage = "Please log in to use the chatbot.";
         showPrompt = true;
         showLoginButton = true;
         setChatInputEnabled(false, "Log in required...");
     } else {
         // Logged in AND GenAI initialized
         showPrompt = false;
         setChatInputEnabled(true, "Ask a financial question...");
     }

     if (showPrompt) {
         const promptDiv = document.createElement('div');
         promptDiv.className = 'login-prompt-overlay';
         promptDiv.innerHTML = `<p>${promptMessage}</p>`;

         if (showLoginButton) {
            const loginButton = document.createElement('button');
            loginButton.textContent = 'Login / Sign Up';
            loginButton.className = 'btn btn-secondary';
            loginButton.onclick = () => {
                 // Try to call the function from firebase-auth.js (ensure it's globally exposed if needed)
                 if (typeof openAuthOverlay === 'function') {
                     openAuthOverlay(true); // Assuming openAuthOverlay is available globally
                 } else {
                     console.warn('openAuthOverlay function not found. Cannot trigger login popup.');
                     alert("Please use the main 'Login' button to sign in.");
                 }
            };
            promptDiv.appendChild(loginButton);
         }
         // Style appropriately (position absolute/fixed, background, etc.) in CSS
         chatContainer.style.position = 'relative'; // Ensure container is positioned
         chatContainer.appendChild(promptDiv);
     }
}


// --- Main Chat Logic ---
async function handleSendMessage(userMessage) {
    // 1. Check Initialization and Login *again*
    if (!isGenAIInitialized || !model) {
        displayError("Chatbot is not available (Initialization failed).");
        setChatInputEnabled(false, "Chatbot unavailable");
        return;
    }
     let isLoggedIn = false;
     if (typeof firebase !== 'undefined' && firebase.auth && typeof firebase.auth === 'function' && firebase.auth().currentUser) {
         isLoggedIn = true;
     }
    if (!isLoggedIn) {
        displayError("Please log in to send messages.");
        updateLoginPromptOverlay(); // Re-show login prompt
        return;
    }

    // 2. Add User Message and Loading Indicator
    addMessage('user', userMessage);
    messageInput.value = ''; // Clear input *after* getting value
    const loadingIndicator = addMessage('bot', 'Thinking...', true);
    setChatInputEnabled(false, "Waiting for response..."); // Disable input during request

    // 3. Call API
    try {
        // Start a new chat session for each message IF you don't need context
        // For conversational context, you'd need to manage `chat` object persistence
        const result = await model.generateContent(userMessage);
        const response = await result.response;
        const botText = await response.text();

        // Remove loading indicator before adding final message
        const loadingElem = document.getElementById('loading-indicator');
        if(loadingElem) loadingElem.remove();

        addMessage('bot', botText);

    } catch (error) {
        console.error('Gemini API Error:', error);
        const loadingElem = document.getElementById('loading-indicator');
        if(loadingElem) loadingElem.remove(); // Remove loading if error occurred

        let errorMessageText = "Sorry, I encountered an issue processing your request.";
        // Try to extract a more specific message if possible
        if (error instanceof Error) {
             errorMessageText += ` (${error.message})`;
        } else if (typeof error === 'string') {
             errorMessageText += ` (${error})`;
        }
        displayError(errorMessageText);
    } finally {
        // Re-enable input only if still logged in
         if (typeof firebase !== 'undefined' && firebase.auth && typeof firebase.auth === 'function' && firebase.auth().currentUser) {
             setChatInputEnabled(true);
              if(messageInput) messageInput.focus();
         } else {
             setChatInputEnabled(false, "Log in required...");
             updateLoginPromptOverlay(); // Ensure prompt shows if user logged out during request
         }
        scrollToBottom();
    }
}


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {

    // Initial UI setup based on initialization status
    if (isGenAIInitialized) {
        addMessage('bot', 'Welcome to the FinGenius AI Chatbot! Please log in to start chatting.');
    } else {
         // Error already displayed by displayInitializationError
    }

    // Set initial Auth state check
    if (typeof firebase !== 'undefined' && firebase.auth && typeof firebase.auth === 'function') {
         firebase.auth().onAuthStateChanged((user) => {
             console.log("Chatbot Auth State Changed:", user ? user.uid : "Logged out");
             updateLoginPromptOverlay(); // Update UI based on login status
             if (user && isGenAIInitialized) {
                 setChatInputEnabled(true); // Enable input on login if AI is ready
             } else if (!user) {
                  // Optionally clear chat messages on logout
                  // if(chatMessages) chatMessages.innerHTML = '';
                  // addMessage('bot', 'You have been logged out.');
             }
         });
    } else {
         console.warn("Firebase Auth not available when chatbot script loaded. Chatbot requires login.");
         // Show login prompt manually if Firebase auth isn't ready immediately
         setTimeout(updateLoginPromptOverlay, 500); // Delay slightly
    }


    // Form Submission Handler
    if (chatForm) {
        chatForm.addEventListener('submit', (e) => {
            // **** MOST IMPORTANT PART FOR REFRESH ISSUE ****
            e.preventDefault(); // Prevent the default form submission/page refresh

            if (!messageInput) return;
            const messageText = messageInput.value.trim();

            // Double check conditions before sending
             if (messageText === '' || !isGenAIInitialized) {
                 console.warn("Message empty or GenAI not ready. Cannot send.");
                 return;
             }
            // The login check is handled inside handleSendMessage

            handleSendMessage(messageText);
        });
    } else {
         console.error("Chat form element (#chat-form) not found!");
    }

    // Optional: Add listener to input field to trigger login prompt if focused while disabled
    if (messageInput) {
         messageInput.addEventListener('focus', () => {
              let isLoggedIn = false;
              if (typeof firebase !== 'undefined' && firebase.auth && typeof firebase.auth === 'function' && firebase.auth().currentUser) {
                 isLoggedIn = true;
              }
              // If input is focused AND disabled AND the reason is lack of login
              if (!isLoggedIn && messageInput.disabled) {
                   updateLoginPromptOverlay(); // Re-trigger prompt display which includes the button
                   messageInput.blur(); // Remove focus after triggering prompt/login
              }
         });
     }

});