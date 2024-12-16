let currentLang = getCookie('lang') || null;
var i18n;

window.addEventListener('DOMContentLoaded', function () {
    let browserLanguage = navigator.language || navigator.userLanguage;

    // Set default language to Arabic if browser language starts with "ar"
    if (currentLang == null && browserLanguage.startsWith("ar")) {
        currentLang = 'ar';
    } else if (currentLang == null) {
        currentLang = 'en'; // Default language is English
    }

    // Apply initial language and direction settings
    updateDirectionAndLanguageDisplay();
    setCookie('lang', currentLang, 99999999999); // Save language in cookies
});

jQuery(document).ready(function () {
    i18n = $.i18n();
    i18n.locale = currentLang;

    // Load translation files for English and Arabic
    i18n.load({
        en: location.origin + "/static/translations/en.json",
        ar: location.origin + "/static/translations/ar.json"
    }).done(function () {
        updateContent(); // Apply translations
    });
});

function changeLanguage(lang) {
    // Change the language only if it's different from the current language
    if (i18n.locale != lang) {
        i18n.locale = lang;
        currentLang = lang;

        // Update direction, language display, and save preference
        updateDirectionAndLanguageDisplay();
        setCookie('lang', currentLang, 99999999999); // Save in cookies
        updateContent(); // Apply new translations
    }
}

function updateContent() {
    // Apply translations to all elements with data-i18n attributes
    $('body').i18n();

    // Example for updating specific translations dynamically
    var headingSelector = '#home-main-line';
    if ($(headingSelector).length) {
        var translationKey = $(headingSelector).data('i18n');
        var translatedText = $.i18n(translationKey);
        $(headingSelector).html(translatedText);
    }
}

function updateDirectionAndLanguageDisplay() {
    // Update the direction and language attributes in <html> tag
    if (currentLang === 'ar') {
        document.documentElement.setAttribute('dir', 'rtl'); // Set direction to RTL
        document.documentElement.setAttribute('lang', 'ar'); // Set language to Arabic
    } else {
        document.documentElement.setAttribute('dir', 'ltr'); // Set direction to LTR
        document.documentElement.setAttribute('lang', 'en'); // Set language to English
    }
}

// Utility function to set cookies
function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

// Utility function to get cookies
function getCookie(name) {
    let cookieArr = document.cookie.split(';');
    for (let i = 0; i < cookieArr.length; i++) {
        let cookiePair = cookieArr[i].trim();
        if (cookiePair.indexOf(name + '=') == 0) {
            return cookiePair.substring(name.length + 1);
        }
    }
    return null;
}
