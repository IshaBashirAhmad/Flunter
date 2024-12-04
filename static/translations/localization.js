let currentLang = getCookie('lang') || null;
var i18n;

window.addEventListener('DOMContentLoaded', function() {
    let browserLanguage = navigator.language || navigator.userLanguage;
    if (currentLang == null && browserLanguage.startsWith("fr"))
        currentLang = 'fr';
    else if (currentLang == null)
        currentLang = 'en';
    
    if (currentLang == 'en') {
        document.getElementById('current-lang-name').textContent = 'EN';
        document.querySelector('.selected-language-flag').classList.remove('fi-fr');
        document.querySelector('.selected-language-flag').classList.add('fi-gb-eng');
    }
    else if (currentLang == 'fr') {
        document.getElementById('current-lang-name').textContent = 'FR';
        document.querySelector('.selected-language-flag').classList.remove('fi-gb-eng');
        document.querySelector('.selected-language-flag').classList.add('fi-fr');
    }
    setCookie('lang', currentLang, 99999999999);
})


jQuery(document).ready(function() {
    i18n = $.i18n();
    i18n.locale = currentLang;
    i18n.load({ en: location.origin + "/static/translations/en.json", fr: location.origin + "/static/translations/fr.json" })
        .done(function() {
            updateContent()
        })
});


function changeLanguage(lang) {
    if (i18n.locale != lang) {
        i18n.locale = lang;
        currentLang = lang;
        updateContent();
    }
}

function updateContent() {
    $('body').i18n();

    var headingSelector = '#home-main-line';
    if ($(headingSelector).length) {
        var translationKey = $(headingSelector).data('i18n');
        var translatedText = $.i18n(translationKey);
        $(headingSelector).html(translatedText);
    }
}