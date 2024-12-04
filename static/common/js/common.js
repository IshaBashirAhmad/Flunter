// Generic method to send request to APIs

async function requestAPI(url, data, headers, method) {
    // Default options are marked with *
    const response = await fetch(url, {
        method: method,
        mode: 'cors',
        // cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        headers: headers,
        body: data,
    });
    return response; // parses JSON response into native JavaScript objects
}


function formDataToObject(formData) {
    let getData = {}
    formData.forEach(function(value, key) {
        getData[key] = value;
    });
    return getData
}


function clearFormData(formData){
    for(var a of formData.entries()){
        formData.delete(a[0])
    }
}


function copyObjectKeys(objectA, objectB) {
    for (const key in objectA) {
        if (objectA.hasOwnProperty(key)) {
            objectB[key] = objectA[key];
        }
    }
}


function objectToFormData(obj) {
    const formData = new FormData();
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            formData.append(key, obj[key]);
        }
    }
    return formData;
}


function beforeLoad(button) {
    button.querySelector('.btn-text').innerText = '';
    button.querySelector('.spinner-border').classList.remove('hide');
    button.disabled = true;
    button.style.cursor ='not-allowed';
    button.pointerEvents = "none";
}

function afterLoad(button, text) {
    button.querySelector('.btn-text').innerText = text;
    button.querySelector('span').classList.add('hide');
    button.disabled = false;
    button.style.cursor ='pointer';
    button.pointerEvents = "auto";
}


function parseJwt (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
};


function setCookie(name, value, expiry) {
    if(name === 'access'){
        name = 'user_access_token'
    }else if(name === 'refresh'){
        name = 'user_refresh_token'
    }else{
        name=name
    }
    var date = new Date(expiry * 1000);
    expires = "; expires=" + date.toUTCString();
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}


function getCookie(name) {
    if(name === 'access'){
        name = 'user_access'
    }else if(name === 'refresh'){
        name = 'user_refresh'
    }else{
        name=name
    }
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}


const apiURL = window.API_BASE_URL;

function getAccessTokenFromCookie() {
    return getCookie('access');
}


function getRefreshTokenFromCookie() {
    return getCookie('refresh');
}


function getCookieExpirationTime(name) {
    if(name === 'access'){
        name = 'user_access_token'
    }else if(name === 'refresh'){
        name = 'user_refresh_token'
    }else{
        name=name
    }
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    return ca
}

function setStorage(key, value) {
    localStorage.setItem(key, value);
}

function removeStorage(key) {
    localStorage.removeItem(key);
}

function getStorage(key) {
    return localStorage.getItem(key);
}


async function onRefreshToken() {
    let refreshToken = getRefreshTokenFromCookie();
    let myData = {"refresh": `${refreshToken}`};
    let headers = {
        "Content-Type": "application/json",
    };
    let refreshResponse = await requestAPI(`${apiURL}/refresh`, JSON.stringify(myData), headers, 'POST');
    if(refreshResponse.status == 200) {
        refreshResponse.json().then(function(res) {
            const accessToken = parseJwt(res.access);
            setCookie("access", res.access, accessToken.exp);
        })
    }
    return refreshResponse;
}


async function onAdminRefreshToken() {
    let refreshToken = getCookie('admin_refresh');
    let myData = {"refresh": `${refreshToken}`};
    let headers = {
        "Content-Type": "application/json",
    };
    let refreshResponse = await requestAPI(`${apiURL}/refresh`, JSON.stringify(myData), headers, 'POST');
    if(refreshResponse.status == 200) {
        refreshResponse.json().then(function(res) {
            const accessToken = parseJwt(res.access);
            setCookie("admin_access", res.access, accessToken.exp);
        })
    }
    return refreshResponse; 
}


function clearUserTokens(){
    setCookie('user_access', '', 0);
    setCookie('user_refresh', '', 0);
}


function clearAdminTokens() {
    setCookie('admin_access', '', 0);
    setCookie('admin_refresh', '', 0);
    removeStorage('fcm_token');
    removeStorage('homme_dashboard');
}


async function logout() {
    let logoutModal = document.getElementById('logOutModal');
    let errorMsg = logoutModal.querySelector('.logout-error-msg');
    let token = getCookie('user_access');
    let headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    };
    let response = await requestAPI(`${apiURL}/auth/logout/`, JSON.stringify({"refresh": getCookie('user_refresh')}), headers, 'POST');
    if (response.status == 204) {
        clearUserTokens();
        location.href = location.origin + '/login/';
    }
    else {
        response.json().then(function(res) {
            displayMessages(res, errorMsg);
            errorMsg.classList.add('active');
        })
    }
}


function adminLogout() {
    deleteDevice().then(() => {
        clearAdminTokens();
        location.href = location.origin + '/signin/';
    })
}


function getSearchURL(searchURL, baseURL) {
    try {
        let sourceParams = new URLSearchParams(searchURL.split('?')[1]);
        let destination = new URL(baseURL);
        if(sourceParams.get('page') == undefined) {
            sourceParams.append('page', '1');
        }
        sourceParams.forEach((value, key) => {
            if(destination.searchParams.has(key)) {
                destination.searchParams.set(key, value);
            }
            else {
                destination.searchParams.append(key, value);
            }
        })
        return destination.toString();
    }
    catch (err) {
        return null;
    }
}


function setParams(params, key, value) {
    let paramsList = params.split('&');
    // Create an object to store the parameters and their values
    let paramsObject = {};
    paramsList.forEach(param => {    
        let [key, value] = param.split('=');
        paramsObject[key] = value;
    });

    // Update the value for the key parameter
    paramsObject[key] = value;

    // Reconstruct the updated query string
    let updatedParams = Object.entries(paramsObject).map(([key, value]) => `${key}=${value}`).join('&');
    return updatedParams;
}


const emailRegex = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i
const phoneRegex = /^\+[0-9]{10,}$/;
const locationRegex = /POINT \((-?\d+\.\d+) (-?\d+\.\d+)\)/;

let timeOut;

function isValidEmail(email) {
    let emailMsg = email.closest('form').querySelector('.email-msg');
    if(email.value.trim() == '') {
        emailMsg.innerText = 'Email is required!';
        return false;
    }
    else if(!emailRegex.test(email.value)) {
        emailMsg.innerText = 'Enter a valid email address!';
        return false;
    }
    else {
        email.classList.remove('input-error');
        emailMsg.innerText = '';
        emailMsg.classList.remove('active');
        if(timeOut) {
            clearTimeout(timeOut);
        }
        return true;
    }
}

function isValidPassword(password) {
    let passwordMsg = password.closest('.password-input').querySelector('.password-msg');
    if(password.value == '') {
        passwordMsg.innerText = 'Password is required!';
        return false;
    }
    else if(password.value.length < 8) {
        passwordMsg.innerText = 'Password must be atleast 8 characters!';
        return false;
    }
    else {
        password.classList.remove('input-error');
        passwordMsg.innerText = '';
        passwordMsg.classList.remove('active');
        if(timeOut) {
            clearTimeout(timeOut);
        }
        return true;
    }
}


function isValidName(name) {
    let nameMsg = name.nextElementSibling;
    if(name.value.trim().length == 0) {
        nameMsg.innerText = "Required Field!";
        return false;
    }
    else {
        name.classList.remove('input-error');
        nameMsg.innerText = '';
        nameMsg.classList.remove('active');
        if(timeOut) {
            clearTimeout(timeOut);
        }
        return true;
    }
}


function matchingPassword(password, confirmPassword) {
    let confirmPasswordMsg = confirmPassword.closest('.password-input').querySelector('.password-msg');
    if(password.value != confirmPassword.value) {
        confirmPasswordMsg.innerText = 'Passwords does not match';
        return false;
    }
    else {
        confirmPasswordMsg.innerText = '';
        confirmPasswordMsg.classList.remove('active');
        confirmPassword.classList.remove('input-error');
        if(timeOut) {
            clearTimeout(timeOut);
        }
        return true;
    }
}


function isValidNumber(number) {
    let numberMsg = number.nextElementSibling;
    if(number.value.trim().length == 0) {
        numberMsg.innerText = 'Required Field';
        return false;
    }
    else if(!(!isNaN(number.value) && /^\d+(\.\d+)?$/.test(number.value))) {
        numberMsg.innerText = 'Number must contain only digits';
    }
    // else if(!phoneRegex.test(number.value)) {
    //     numberMsg.innerText = 'Number is invalid!';
    //     return false;
    // }
    else {
        number.classList.remove('input-error');
        numberMsg.innerText = '';
        numberMsg.classList.remove('active');
        if(timeOut) {
            clearTimeout(timeOut);
        }
        return true;
    }
}


function isValidPhoneNumber(number) {
    let numberMsg = number.closest('.mobile-input').querySelector('.mobile-msg');
    if(number.value.trim().length == 0) {
        numberMsg.innerText = 'Required Field';
        return false;
    }
    else if(!(/^\d+(\.\d+)?$/.test(number.value.split('+')[1]))) {
        numberMsg.innerText = 'Number is invalid';
        return false;
    }
    else {
        number.classList.remove('input-error');
        numberMsg.innerText = '';
        numberMsg.classList.remove('active');
        if(timeOut) {
            clearTimeout(timeOut);
        }
        return true;
    }
}


function isValidImage(image) {
    let pictureMsg = image.closest('.image-input-container').querySelector('.picture-msg');
    if(image.files.length == 0) {
        pictureMsg.innerText = 'Image required!';
        return false;
    }
    else {
        image.classList.remove('input-error');
        pictureMsg.innerText = '';
        pictureMsg.classList.remove('active');
        return true;
    }
}


function isCheckboxChecked(checkbox) {
    if(checkbox.checked) {
        checkbox.classList.remove('input-error');
        return true;
    }
    else {
        checkbox.classList.add('input-error');
        return false;
    }
}


function getLatLngFromString(locationString) {
    const match = locationString.match(locationRegex);
    if (match && match.length === 3) {
        const latitude = parseFloat(match[1]);
        const longitude = parseFloat(match[2]);
        return {lat: latitude, lng: longitude};
    } else {
        console.log("Could not extract latitude and longitude.");
    }
}


function roundDecimalPlaces(number, places=2) {
    let value = parseFloat(number);
    let roundedValue = Math.round(value * 100) / 100;
    return roundedValue.toFixed(places);
}


function displayMessages(obj, errorElement) {
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            if (Array.isArray(obj[key])) {
                // If it's an array, iterate through its elements
                obj[key].forEach(element => {
                    if (typeof element === 'object') {
                        // If an element is an object, recursively call the function
                        displayMessages(element, errorElement);
                    } else {
                        // If it's not an object, append the key and message in the same line
                        errorElement.innerHTML += `${element} <br />`;
                    }
                });
            } else if (typeof obj[key] === 'object') {
                // If it's an object, recursively call the function
                displayMessages(obj[key], errorElement);
            } else {
                // If it's neither an array nor an object, append the key and value in the same line
                errorElement.innerHTML += `${obj[key]} <br />`;
            }
        }
    }
}


function captalizeFirstLetter(string) {
    // return word.charAt(0).toUpperCase() + word.slice(1);
    
    // Split the string into an array of words using spaces or underscores as separators
    const words = string.split(/[_\s]+/);
    const capitalizedWords = words.map(word => word.charAt(0).toUpperCase() + word.slice(1));
    const resultString = capitalizedWords.join(' ');

    return resultString;
}


let numberInputs = document.querySelectorAll('input[type=number]');
numberInputs.forEach((input) => {
    input.addEventListener('beforeinput', function (event) {
        if (event.data === "e")
            event.preventDefault();
        else
            return event;
    })
})

if (localStorage.getItem('payment_method_id') !== null) {
    savePaymentMethod(localStorage.getItem('payment_method_id'));
}

async function savePaymentMethod(payment_method_id) {
    let response = await requestAPI('/users/save-payment-method/', JSON.stringify({payment_method_id: payment_method_id}), {}, 'POST');
    response.json().then(function(res) {
        console.log(res);
        localStorage.removeItem('payment_method_id')
    })
}


function arraysEqualIgnoreOrder(arr1, arr2) {
    // Check if arrays have the same length
    if (arr1.length !== arr2.length) {
        return false;
    }
  
    // Sort both arrays and compare each element
    const sortedArr1 = [...arr1].sort();
    const sortedArr2 = [...arr2].sort();
  
    for (let i = 0; i < sortedArr1.length; i++) {
        if (sortedArr1[i] !== sortedArr2[i]) {
            return false;
        }
    }
  
    return true;
}


function showToast(title, body, className) {
    
    // Use the container as the node option
    Toastify({
        // node: toastContent,
        text: body,
        duration: 5000, // 5 seconds
        close: true,
        gravity: "top", // top or bottom
        position: "right", // left, center or right
        className: className,
        stopOnFocus: true, // Prevents dismissing of toast on hover
    }).showToast();
}


function normalizeText(text) {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}


const contactDetailsMapping = {
    "phone1": "Landline",
    "phone2": "Mobile Phone",
    "email1": "Personal Email",
    "email2": "Pro Email"
}


function changeLocale(option, value) {
    setCookie('lang', value, 99999999999);
    document.getElementById('current-lang-name').textContent = option.textContent;
    if (value == 'en') {
        document.querySelector('.selected-language-flag').classList.remove('fi-fr');
        document.querySelector('.selected-language-flag').classList.add('fi-gb-eng');
    }
    else if (value == 'fr') {
        document.querySelector('.selected-language-flag').classList.remove('fi-gb-eng');
        document.querySelector('.selected-language-flag').classList.add('fi-fr');
    }
    changeLanguage(value);
}


function getSeniorityLevel(expYear) {
    if (expYear <= 2)
        return 'junior';
    else if (expYear >= 2.5 && expYear <= 5)
        return 'medior';
    else if (expYear >= 5.5 && expYear <= 11.5)
        return 'senior';
    else if (expYear >= 12)
        return 'expert';
}


function getPageRecords(info) {
    const start = Math.min((info.currentPage - 1) * info.perPage + 1, info.count);
    const end = Math.min(info.currentPage * info.perPage, info.count);

    return { start, end };
}