document.addEventListener('DOMContentLoaded', () => {
    // Elements for the Profile OVERLAY
    const profileOverlay = document.getElementById('profile-overlay');
    const userProfileBtn = document.getElementById('user-profile-btn');
    const closeProfileBtn = document.getElementById('close-profile-btn');
    const profileNameModal = document.getElementById('profile-name-modal');
    const profileEmailModal = document.getElementById('profile-email-modal');
    const profilePhoneModal = document.getElementById('profile-phone-modal');
    const profileDobModal = document.getElementById('profile-dob-modal');
    const profileAvatarModal = document.getElementById('profile-avatar-modal'); // Assuming ID exists
    const profileInfoDivModal = document.querySelector('#profile-overlay .profile-info');
    const profileEditDivModal = document.querySelector('#profile-overlay .profile-edit');
    const editProfileBtnModal = document.getElementById('edit-profile-btn-modal');
    const cancelEditBtnModal = document.getElementById('cancel-edit-btn-modal');
    const saveProfileBtnModal = document.getElementById('save-profile-btn-modal');
    const logoutBtnModal = document.getElementById('logout-btn-modal');
    const editNameInputModal = document.getElementById('edit-name-modal');
    const editPhoneInputModal = document.getElementById('edit-phone-modal');
    const editDobInputModal = document.getElementById('edit-dob-modal');
    const successMessageModal = document.getElementById('profile-update-success-modal');
    const errorMessageModal = document.getElementById('profile-update-error-modal');


    // Elements for the dedicated PROFILE PAGE (/profile.html)
    const profilePageView = document.getElementById('profile-view'); // Only on profile.html
    const profilePageEditForm = document.getElementById('profile-edit-form'); // Only on profile.html
    const profilePageEditButton = document.getElementById('edit-profile-button'); // Only on profile.html
    const profilePageSaveButton = document.getElementById('save-profile-button-page'); // Only on profile.html
    const profilePageCancelButton = document.getElementById('cancel-edit-button-page'); // Only on profile.html
    const profilePageLogoutButton = document.getElementById('logout-button-page'); // Only on profile.html

    // --- Global Variables ---
    let currentUser = null;
    let currentUserData = null;


    // --- Utility Functions ---
    function showElement(el) { if (el) el.style.display = 'block'; }
    function hideElement(el) { if (el) el.style.display = 'none'; }
    function showInlineElement(el) { if (el) el.style.display = 'inline-block'; }

    // --- Profile OVERLAY Logic ---

    function openProfileOverlay() {
        if (!currentUser) {
            console.warn("Cannot open profile overlay, user not logged in.");
             // Maybe open login overlay instead?
             // if (typeof openAuthOverlay === 'function') openAuthOverlay();
            return;
        }
        if (profileOverlay) {
             populateProfileOverlay(currentUserData); // Populate with latest known data
             toggleOverlayEditMode(false); // Ensure view mode first
             profileOverlay.classList.add('show');
        } else {
            console.error("Profile overlay element not found.");
        }
    }

    function closeProfileOverlay() {
         if (profileOverlay) {
            profileOverlay.classList.remove('show');
         }
    }

    function populateProfileOverlay(userData) {
        if (!userData) return;
        if (profileNameModal) profileNameModal.textContent = userData.name || 'N/A';
        if (profileEmailModal) profileEmailModal.textContent = userData.email || 'N/A';
        if (profilePhoneModal) profilePhoneModal.textContent = userData.phone || 'Not set';
        if (profileDobModal) profileDobModal.textContent = userData.dob || 'Not set';
        // Add avatar logic if needed:
        // if (profileAvatarModal) profileAvatarModal.src = userData.avatarUrl || 'images/default-avatar.png';

         // Populate edit form as well
         if (editNameInputModal) editNameInputModal.value = userData.name || '';
         if (editPhoneInputModal) editPhoneInputModal.value = userData.phone || '';
         if (editDobInputModal) editDobInputModal.value = userData.dob || '';
    }

    function toggleOverlayEditMode(edit) {
        if (!profileInfoDivModal || !profileEditDivModal || !editProfileBtnModal || !cancelEditBtnModal) return;

        hideElement(successMessageModal); // Clear messages on mode toggle
        hideElement(errorMessageModal);

        if (edit) {
            hideElement(profileInfoDivModal);
            showElement(profileEditDivModal);
            hideElement(editProfileBtnModal);
            showInlineElement(cancelEditBtnModal);
        } else {
            showElement(profileInfoDivModal);
            hideElement(profileEditDivModal);
            showInlineElement(editProfileBtnModal);
            hideElement(cancelEditBtnModal);
        }
    }

    async function saveOverlayProfileChanges() {
        if (!currentUser || !firestore) {
            if (errorMessageModal) errorMessageModal.textContent = 'Error: Not logged in or Firebase not ready.';
            return;
        }

        const updatedData = {
            name: editNameInputModal ? editNameInputModal.value.trim() : currentUserData.name,
            phone: editPhoneInputModal ? editPhoneInputModal.value.trim() : currentUserData.phone,
            dob: editDobInputModal ? editDobInputModal.value : currentUserData.dob,
        };

        if (saveProfileBtnModal) saveProfileBtnModal.disabled = true;
        hideElement(successMessageModal);
        hideElement(errorMessageModal);

        try {
            const userRef = firestore.collection('users').doc(currentUser.uid);
            await userRef.update(updatedData);
            currentUserData = { ...currentUserData, ...updatedData }; // Update local cache
            populateProfileOverlay(currentUserData); // Update view
             if (successMessageModal) successMessageModal.textContent = 'Profile updated successfully!';
             showElement(successMessageModal);
             setTimeout(() => {
                 toggleOverlayEditMode(false);
             }, 1500); // Show success briefly

             // If on profile page, update its view too
             populateProfilePageView(currentUserData);

        } catch (error) {
            console.error("Error updating profile (overlay):", error);
             if (errorMessageModal) errorMessageModal.textContent = 'Update failed: ' + error.message;
             showElement(errorMessageModal);
        } finally {
             if (saveProfileBtnModal) saveProfileBtnModal.disabled = false;
        }
    }


    // --- Profile PAGE Logic (/profile.html) ---

    // Function to safely get element by ID, only if on profile page
    function getProfilePageElement(id) {
        if (window.location.pathname.includes('/profile.html')) {
            return document.getElementById(id);
        }
        return null; // Return null if not on profile page
    }

    function populateProfilePageView(userData) {
        if (!window.location.pathname.includes('/profile.html')) return; // Only run on profile page

        const viewName = getProfilePageElement('view-name');
        const viewEmail = getProfilePageElement('view-email');
        const viewPhone = getProfilePageElement('view-phone');
        const viewDob = getProfilePageElement('view-dob');
        const editNameInput = getProfilePageElement('edit-name-page');
        const editEmailInput = getProfilePageElement('edit-email-page'); // Disabled field
        const editPhoneInput = getProfilePageElement('edit-phone-page');
        const editDobInput = getProfilePageElement('edit-dob-page');

        if (viewName) viewName.textContent = userData?.name || 'N/A';
        if (viewEmail) viewEmail.textContent = userData?.email || 'N/A';
        if (viewPhone) viewPhone.textContent = userData?.phone || 'Not set';
        if (viewDob) viewDob.textContent = userData?.dob || 'Not set';

        if (editNameInput) editNameInput.value = userData?.name || '';
        if (editEmailInput) editEmailInput.value = userData?.email || ''; // Set disabled email
        if (editPhoneInput) editPhoneInput.value = userData?.phone || '';
        if (editDobInput) editDobInput.value = userData?.dob || '';
    }

    function togglePageEditMode(edit) {
        if (!window.location.pathname.includes('/profile.html')) return; // Only run on profile page

        const profileView = getProfilePageElement('profile-view');
        const profileEditForm = getProfilePageElement('profile-edit-form');
        const successMessagePage = getProfilePageElement('profile-update-success-page');
        const errorMessagePage = getProfilePageElement('profile-update-error-page');


        if (!profileView || !profileEditForm) return; // Don't proceed if elements aren't there

        if (successMessagePage) successMessagePage.textContent = '';
        if (errorMessagePage) errorMessagePage.textContent = '';

        if (edit) {
            hideElement(profileView);
            showElement(profileEditForm);
        } else {
            showElement(profileView);
            hideElement(profileEditForm);
        }
    }

    function clearProfilePageView() {
        if (!window.location.pathname.includes('/profile.html')) return; // Only run on profile page

        const viewName = getProfilePageElement('view-name');
        const viewEmail = getProfilePageElement('view-email');
        const viewPhone = getProfilePageElement('view-phone');
        const viewDob = getProfilePageElement('view-dob');

         // Check if elements exist before setting textContent
         if (viewName) viewName.textContent = 'Loading...';
         if (viewEmail) viewEmail.textContent = 'Loading...';
         if (viewPhone) viewPhone.textContent = 'N/A';
         if (viewDob) viewDob.textContent = 'N/A';
    }

     async function savePageProfileChanges(event) {
         event.preventDefault(); // Prevent form submission
         if (!window.location.pathname.includes('/profile.html')) return;
         if (!currentUser || !firestore) {
              const errorMessagePage = getProfilePageElement('profile-update-error-page');
              if (errorMessagePage) errorMessagePage.textContent = 'Error: Not logged in or Firebase not ready.';
             return;
         }

         const editNameInput = getProfilePageElement('edit-name-page');
         const editPhoneInput = getProfilePageElement('edit-phone-page');
         const editDobInput = getProfilePageElement('edit-dob-page');
         const successMessagePage = getProfilePageElement('profile-update-success-page');
         const errorMessagePage = getProfilePageElement('profile-update-error-page');
         const saveButton = getProfilePageElement('save-profile-button-page');

         const updatedData = {
             name: editNameInput ? editNameInput.value.trim() : currentUserData.name,
             phone: editPhoneInput ? editPhoneInput.value.trim() || null : currentUserData.phone, // Store null if empty
             dob: editDobInput ? editDobInput.value || null : currentUserData.dob, // Store null if empty
         };

         if (saveButton) saveButton.disabled = true;
         if (successMessagePage) successMessagePage.textContent = '';
         if (errorMessagePage) errorMessagePage.textContent = '';


         try {
             const userRef = firestore.collection('users').doc(currentUser.uid);
             await userRef.update(updatedData);
             currentUserData = { ...currentUserData, ...updatedData }; // Update local cache

             populateProfilePageView(currentUserData); // Update view on page
             populateProfileOverlay(currentUserData); // Update overlay view too

              if (successMessagePage) successMessagePage.textContent = 'Profile updated successfully!';
              setTimeout(() => {
                  togglePageEditMode(false);
              }, 1500); // Show success briefly


         } catch (error) {
             console.error("Error updating profile (page):", error);
              if (errorMessagePage) errorMessagePage.textContent = 'Update failed: ' + error.message;
         } finally {
              if (saveButton) saveButton.disabled = false;
         }
     }

    // --- Global Auth Handling ---

     function handleUserLogin(event) {
        currentUser = event.detail.user;
        currentUserData = event.detail.userData;
        console.log("Profile.js received login event:", currentUserData);

        populateProfileOverlay(currentUserData); // Update overlay on login
        populateProfilePageView(currentUserData); // Update profile page if on it

         // Show profile button, hide login/signup
         showInlineElement(userProfileBtn);
    }

     function handleUserLogout() {
        console.log("Profile.js received logout event.");
        currentUser = null;
        currentUserData = null;

         // Clear and close overlay if open
         closeProfileOverlay();
         // Clear profile page view if on profile page
         clearProfilePageView();

         // Hide profile button, potentially show login/signup (handled by firebase-auth.js)
         hideElement(userProfileBtn);

         // If on profile page, redirect or show logged out message
         if (window.location.pathname.includes('/profile.html')) {
             console.log("User logged out on profile page. Redirecting to home.");
             // Optionally show a message before redirecting
             // alert("You have been logged out.");
             window.location.href = 'index.html'; // Redirect to home
         }
    }


    // --- Event Listeners Setup ---

    // Overlay listeners
    if (userProfileBtn) userProfileBtn.addEventListener('click', openProfileOverlay);
    if (closeProfileBtn) closeProfileBtn.addEventListener('click', closeProfileOverlay);
    if (editProfileBtnModal) editProfileBtnModal.addEventListener('click', () => toggleOverlayEditMode(true));
    if (cancelEditBtnModal) cancelEditBtnModal.addEventListener('click', () => toggleOverlayEditMode(false));
    if (saveProfileBtnModal) saveProfileBtnModal.addEventListener('click', saveOverlayProfileChanges);
    if (logoutBtnModal && typeof auth !== 'undefined' && auth.signOut) {
         logoutBtnModal.addEventListener('click', () => {
             auth.signOut().then(() => {
                 console.log('User signed out via overlay button.');
                 // onAuthStateChanged will handle UI updates via userLoggedOut event
             }).catch(error => {
                 console.error('Overlay logout error:', error);
             });
         });
    }
    if (profileOverlay) {
        profileOverlay.addEventListener('click', (event) => {
             if (event.target === profileOverlay) { // Click on backdrop
                 closeProfileOverlay();
             }
        });
    }

    // Profile Page listeners (only add if elements exist)
    const mainProfileForm = getProfilePageElement('main-profile-form');
    if (profilePageEditButton) profilePageEditButton.addEventListener('click', () => togglePageEditMode(true));
    if (profilePageCancelButton) profilePageCancelButton.addEventListener('click', () => togglePageEditMode(false));
    if (mainProfileForm) mainProfileForm.addEventListener('submit', savePageProfileChanges); // Use submit event

    if (profilePageLogoutButton && typeof auth !== 'undefined' && auth.signOut) {
         profilePageLogoutButton.addEventListener('click', () => {
             auth.signOut().then(() => {
                 console.log('User signed out via profile page button.');
                 // onAuthStateChanged will handle UI updates via userLoggedOut event
                 // Redirection will happen in handleUserLogout if on profile.html
             }).catch(error => {
                 console.error('Profile page logout error:', error);
             });
         });
    }

    // Listen for global auth events dispatched from firebase-auth.js
    document.addEventListener('userLoggedIn', handleUserLogin);
    document.addEventListener('userLoggedOut', handleUserLogout);

    // Initial check in case user is already logged in when script loads
    // Note: firebase-auth.js's onAuthStateChanged usually handles the initial state
    // If experiencing race conditions, you might need to explicitly check auth.currentUser here after Firebase init.


    // Expose function globally ONLY IF NEEDED (e.g., for inline JS onclick, but prefer event listeners)
    // window.updateUserProfile = updateUserProfile; // Example exposure

});