const firebaseConfig = {
    apiKey: "AIzaSyBN2ecWzgagxfm1hQDGVilG8IXMX1iqyNo",
    authDomain: "fin-gen-ai.firebaseapp.com",
    databaseURL: "https://fin-gen-ai-default-rtdb.firebaseio.com",
    projectId: "fin-gen-ai",
    storageBucket: "fin-gen-ai.appspot.com", // Corrected common typo: .appspot.com
    messagingSenderId: "800451913840",
    appId: "1:800451913840:web:2e18eba5f79efcac9eecb5",
    measurementId: "G-8T8TS5NT83"
  };
  
  let app;
  let auth;
  let firestore;
  let googleProvider;
  
  // Ensure Firebase SDKs are loaded before initializing
  function initializeFirebase() {
      try {
          if (typeof firebase !== 'undefined' && firebase.app && firebase.auth && firebase.firestore) {
              app = firebase.initializeApp(firebaseConfig);
              auth = firebase.auth();
              firestore = firebase.firestore();
              googleProvider = new firebase.auth.GoogleAuthProvider();
              console.log("Firebase Initialized Successfully.");
              setupAuthListeners(); // Setup listeners after initialization
          } else {
              console.error("Firebase SDKs not loaded correctly.");
              // Optionally, retry after a delay
              // setTimeout(initializeFirebase, 500);
          }
      } catch (error) {
          console.error("Error initializing Firebase:", error);
      }
  }
  
  function setupAuthListeners() {
      if (!auth) {
          console.error("Firebase Auth is not initialized. Cannot set up listeners.");
          return;
      }
      auth.onAuthStateChanged(async (user) => {
          const loginBtn = document.getElementById('login-btn');
          const signupBtn = document.getElementById('signup-btn');
          const userProfileBtn = document.getElementById('user-profile-btn');
          const dashboardLink = document.getElementById('nav-link-dashboard'); // Assuming you have this ID
          const profileOverlay = document.getElementById('profile-overlay');
          const authOverlay = document.getElementById('auth-overlay');
  
          // Ensure elements exist before manipulating
          if (loginBtn) loginBtn.style.display = user ? 'none' : 'inline-block';
          if (signupBtn) signupBtn.style.display = user ? 'none' : 'inline-block';
          if (userProfileBtn) userProfileBtn.style.display = user ? 'inline-block' : 'none';
          if (dashboardLink) dashboardLink.style.display = user ? 'inline-block' : 'none'; // Show dashboard link if logged in
  
          if (user) {
              console.log("Auth State Changed: User logged in:", user.uid);
              if (authOverlay && authOverlay.classList.contains('show')) {
                   closeAuthOverlay(); // Close auth overlay if open
              }
              try {
                  const userDoc = await firestore.collection('users').doc(user.uid).get();
                  let userData = { email: user.email, name: user.displayName || 'N/A', phone: null, dob: null };
  
                  if (userDoc.exists) {
                      userData = { ...userData, ...userDoc.data() };
                      console.log("User data fetched:", userData);
                  } else {
                      console.log("No profile data found for user, creating basic profile.");
                      // Create a basic profile if it doesn't exist
                      await firestore.collection('users').doc(user.uid).set({
                          email: user.email,
                          name: user.displayName || 'User ' + user.uid.substring(0, 5), // Provide a default name
                          createdAt: firebase.firestore.FieldValue.serverTimestamp()
                      }, { merge: true }); // Use merge: true to avoid overwriting existing fields accidentally
                      userData.name = user.displayName || 'User ' + user.uid.substring(0, 5); // Update local data
                  }
  
                  // Dispatch event with user and userData
                  document.dispatchEvent(new CustomEvent('userLoggedIn', { detail: { user, userData } }));
  
              } catch (error) {
                  console.error("Error fetching/creating user profile:", error);
                  // Dispatch event even if profile fetch fails, UI can show defaults
                   document.dispatchEvent(new CustomEvent('userLoggedIn', { detail: { user, userData: { email: user.email, name: user.displayName || 'N/A' } } }));
              }
          } else {
              console.log("Auth State Changed: User logged out");
               if (profileOverlay && profileOverlay.classList.contains('show')) {
                  // The profile overlay closing logic should be within profile.js or main script
                  // Do not call closeProfileOverlay directly from here unless absolutely necessary and defined globally
                  console.log("User logged out, profile overlay might need closing (handled by its own logic).");
               }
               document.dispatchEvent(new CustomEvent('userLoggedOut'));
          }
      });
  }
  
  
  // Function to open the Auth Overlay
  function openAuthOverlay(showLogin = true) {
      const authOverlay = document.getElementById('auth-overlay');
      const loginBox = document.getElementById('login-box');
      const signupBox = document.getElementById('signup-box');
      const loginError = document.getElementById('login-error-modal') || document.getElementById('login-error'); // Adapt based on modal IDs
      const signupError = document.getElementById('signup-error-modal') || document.getElementById('signup-error');
  
      if (!authOverlay || !loginBox || !signupBox) {
          console.error("Auth overlay elements not found");
          return;
      }
  
      if (loginError) loginError.textContent = '';
      if (signupError) signupError.textContent = '';
  
      if (showLogin) {
          loginBox.classList.add('active');
          signupBox.classList.remove('active');
      } else {
          loginBox.classList.remove('active');
          signupBox.classList.add('active');
      }
      authOverlay.classList.add('show');
  }
  
  // Function to close the Auth Overlay
  function closeAuthOverlay() {
      const authOverlay = document.getElementById('auth-overlay');
       if (authOverlay) {
          authOverlay.classList.remove('show');
       }
  }
  
  // --- Event Listeners ---
  document.addEventListener('DOMContentLoaded', () => {
      initializeFirebase(); // Initialize Firebase on DOMContentLoaded
  
      const loginBtn = document.getElementById('login-btn');
      const signupBtn = document.getElementById('signup-btn');
      const closeAuthBtn = document.getElementById('close-auth-btn');
      const showSignupLink = document.getElementById('show-signup') || document.getElementById('show-signup-modal');
      const showLoginLink = document.getElementById('show-login') || document.getElementById('show-login-modal');
  
      const loginForm = document.getElementById('login-form') || document.getElementById('login-form-modal');
      const signupForm = document.getElementById('signup-form') || document.getElementById('signup-form-modal');
  
      const googleSignInBtnLogin = document.getElementById('google-signin-btn-login') || document.getElementById('google-signin-btn-login-modal');
      const googleSignInBtnSignup = document.getElementById('google-signin-btn-signup') || document.getElementById('google-signin-btn-signup-modal');
  
  
      if (loginBtn) loginBtn.addEventListener('click', () => openAuthOverlay(true));
      if (signupBtn) signupBtn.addEventListener('click', () => openAuthOverlay(false));
      if (closeAuthBtn) closeAuthBtn.addEventListener('click', closeAuthOverlay);
      if (showSignupLink) showSignupLink.addEventListener('click', (e) => { e.preventDefault(); openAuthOverlay(false); });
      if (showLoginLink) showLoginLink.addEventListener('click', (e) => { e.preventDefault(); openAuthOverlay(true); });
  
      // Handle clicks outside the auth box to close
      const authOverlay = document.getElementById('auth-overlay');
      if (authOverlay) {
          authOverlay.addEventListener('click', (event) => {
              if (event.target === authOverlay) { // Check if click is on the backdrop
                  closeAuthOverlay();
              }
          });
      }
  
      // --- Form Submissions ---
      if (loginForm) {
          loginForm.addEventListener('submit', (e) => {
              e.preventDefault();
               const emailInput = document.getElementById('login-email-modal') || document.getElementById('login-email');
               const passwordInput = document.getElementById('login-password-modal') || document.getElementById('login-password');
               const errorElement = document.getElementById('login-error-modal') || document.getElementById('login-error');
               const email = emailInput.value;
               const password = passwordInput.value;
  
               if (!auth) {
                   if(errorElement) errorElement.textContent = "Firebase not ready. Please try again.";
                   return;
               }
               if(errorElement) errorElement.textContent = ''; // Clear previous error
  
              auth.signInWithEmailAndPassword(email, password)
                  .then((userCredential) => {
                      console.log("User logged in:", userCredential.user.uid);
                      closeAuthOverlay();
                  })
                  .catch((error) => {
                      console.error("Login Error:", error);
                       if(errorElement) errorElement.textContent = error.message;
                  });
          });
      }
  
      if (signupForm) {
          signupForm.addEventListener('submit', (e) => {
              e.preventDefault();
               const nameInput = document.getElementById('signup-name-modal') || document.getElementById('signup-name');
               const emailInput = document.getElementById('signup-email-modal') || document.getElementById('signup-email');
               const passwordInput = document.getElementById('signup-password-modal') || document.getElementById('signup-password');
               const errorElement = document.getElementById('signup-error-modal') || document.getElementById('signup-error');
               const name = nameInput.value;
               const email = emailInput.value;
               const password = passwordInput.value;
  
               if (!auth || !firestore) {
                   if(errorElement) errorElement.textContent = "Firebase not ready. Please try again.";
                   return;
               }
               if(errorElement) errorElement.textContent = ''; // Clear previous error
  
  
              auth.createUserWithEmailAndPassword(email, password)
                  .then((userCredential) => {
                      console.log("User signed up:", userCredential.user.uid);
                      const user = userCredential.user;
                      // Update profile and create Firestore document
                      return user.updateProfile({
                          displayName: name
                      }).then(() => {
                          return firestore.collection('users').doc(user.uid).set({
                              name: name,
                              email: email,
                              createdAt: firebase.firestore.FieldValue.serverTimestamp()
                          });
                      }).then(() => {
                          console.log("User profile created in Firestore");
                          closeAuthOverlay();
                           // Manually trigger logged in state if onAuthStateChanged is slow
                           document.dispatchEvent(new CustomEvent('userLoggedIn', { detail: { user, userData: { email: user.email, name: name } } }));
                      });
                  })
                  .catch((error) => {
                      console.error("Signup Error:", error);
                       if(errorElement) errorElement.textContent = error.message;
                  });
          });
      }
  
      // --- Google Sign-In ---
       const handleGoogleSignIn = () => {
           if (!auth || !googleProvider) {
               console.error("Firebase Auth or Google Provider not ready.");
               // Optionally show an error in the UI
               const errorElement = document.getElementById('login-error-modal') || document.getElementById('login-error') || document.getElementById('signup-error-modal') || document.getElementById('signup-error');
               if (errorElement) errorElement.textContent = "Google Sign-In not ready. Please wait.";
               return;
           }
           auth.signInWithPopup(googleProvider)
               .then(async (result) => {
                   const user = result.user;
                   console.log("Google Sign-In successful:", user.uid);
                   // Check if user exists in Firestore, if not, create them
                   const userRef = firestore.collection('users').doc(user.uid);
                   const doc = await userRef.get();
                   if (!doc.exists) {
                       console.log("Creating Firestore entry for new Google user.");
                       await userRef.set({
                           name: user.displayName,
                           email: user.email,
                           createdAt: firebase.firestore.FieldValue.serverTimestamp()
                       }, { merge: true }); // merge:true is good practice
                   } else {
                       console.log("Existing Google user found in Firestore.");
                   }
                   closeAuthOverlay();
                    // Manually trigger logged in state if onAuthStateChanged is slow
                    document.dispatchEvent(new CustomEvent('userLoggedIn', { detail: { user, userData: (await userRef.get()).data() } }));
  
               }).catch((error) => {
                   console.error("Google Sign-In Error:", error);
                   // Handle Errors here.
                   const errorCode = error.code;
                   const errorMessage = error.message;
                   // The email of the user's account used.
                   const email = error.customData ? error.customData.email : 'N/A';
                   // The AuthCredential type that was used.
                   const credential = error.credential ? firebase.auth.AuthCredential.credentialFromError(error) : null;
  
                   const errorElement = document.getElementById('login-error-modal') || document.getElementById('login-error') || document.getElementById('signup-error-modal') || document.getElementById('signup-error');
                   if (errorElement) errorElement.textContent = `Google Sign-In Failed: ${errorMessage}`;
  
               });
       };
  
       if (googleSignInBtnLogin) {
           googleSignInBtnLogin.addEventListener('click', handleGoogleSignIn);
       }
       if (googleSignInBtnSignup) {
            googleSignInBtnSignup.addEventListener('click', handleGoogleSignIn);
       }
  
  });
  
  // Expose necessary functions globally if needed by other scripts, though events are preferred
  // window.openAuthOverlay = openAuthOverlay;
  // window.closeAuthOverlay = closeAuthOverlay;