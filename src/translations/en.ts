export const en = {
    // Compatibility
    compatibilityTitle: "Compatibility Check",
    compatibilitySubtitle: "Select your PC components to ensure the product is compatible.",
    cpuLabel: "Processor (CPU)",
    cpuIntel: "Intel",
    cpuAmd: "AMD",
    gpuLabel: "Graphics Card (GPU)",
    gpuNvidia: "NVIDIA",
    gpuAmd: "AMD",
    gpuIntel: "Intel",
    igpuLabel: "Do you have an Integrated Intel GPU?",
    igpuYes: "Yes",
    igpuNo: "No",
    checkButton: "Check Compatibility",
    fillAllFields: "Please fill all fields to check compatibility.",
    compatibleTitle: "Compatible!",
    compatibleMessage: "This product works perfectly with your hardware specs.",
    proceedButton: "Proceed to Purchase",
    incompatibleTitle: "Incompatible",
    incompatibleMessageSinki: "Sinki products only work with NVIDIA graphics cards. Please check our other products.",
    incompatibleMessageCheatloop: "Cheatloop products do not work with an active Intel integrated GPU. Please check our other products.",
    incompatibleMessageGeneral: "This product is not compatible with your hardware specs.",
    suggestionsTitle: "Suggested Compatible Products:",
    noSuggestions: "Unfortunately, there are no other compatible products for your selected hardware.",
    loading: "Loading...",
    error: "An error occurred while loading product details.",
    goBack: "Go Back",
    errorTitle: "An Error Occurred",
    checkingFor: "Checking compatibility for:",
    backToProducts: "Back to All Products",

    // Payment
    payFor: 'Pay for',
    paymentFor: 'Payment for',
    instructionsTitle: 'Payment Instructions',
    instructions: [
        'Open the camera on your mobile phone.',
        'Scan the QR code shown above.',
        'Open the link that appears on your screen and complete the payment.',
        {
            caption: 'After payment, a notification will appear. Click the bell icon at the top of the page.',
            src: 'https://i.imgur.com/your-image-1.png', // Placeholder for notification icon
            alt: 'Notification Bell Icon'
        },
        {
            caption: 'Find the purchase notification and click "Confirm" to confirm receipt of the service.',
            src: 'https://i.imgur.com/your-image-2.png', // Placeholder for confirm button
            alt: 'Confirm Button in Notification'
        },
        'A form will appear. Please fill in your details and click "Send to Telegram" to receive your product key.',
    ],
    deliveryTitle: 'Confirm Your Purchase',
    deliverySubtitle: 'After paying, check your notifications (bell icon at the top) to confirm your purchase and get your key.',
    contactButton: 'Check Notifications',
    modalTitle: 'Submit Purchase Details',
    emailLabel: 'Purchase Email *',
    emailPlaceholder: 'example@email.com',
    phoneLabel: 'Phone Number (Optional)',
    phonePlaceholder: 'e.g., +1234567890',
    anydeskLabel: 'AnyDesk ID/Address (Optional)',
    modalSubmitButton: 'Send to Telegram',
    formError: 'Please provide a valid email address.',
    errorLoadingImage: 'Could not load payment image.',
    backToHome: 'Back to Home',
};

export type Translations = typeof en;
