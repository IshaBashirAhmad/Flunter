window.addEventListener('load', function () {
    var alertElement = document.querySelector('.alert');
    if (alertElement) {
        // Fade out effect
        alertElement.style.transition = 'opacity 8s';
        alertElement.style.opacity = '0';
        
        // After the fade out, slide up effect
        setTimeout(function () {
            alertElement.style.transition = 'height 0.5s, margin 0.5s, padding 0.5s';
            alertElement.style.height = '0';
            alertElement.style.margin = '0';
            alertElement.style.padding = '0';
        }, 8000);

        // Finally, completely hide the element
        setTimeout(function () {
            alertElement.style.display = 'none';
        }, 5000);
    }
});


function captalizeFirstLetter(string) {
    const words = string.split(/[_\s]+/);
    const capitalizedWords = words.map(word => word.charAt(0).toUpperCase() + word.slice(1));
    const resultString = capitalizedWords.join(' ');

    return resultString;
}