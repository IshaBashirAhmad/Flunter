let individualInputContainer = document.getElementById('individual-input-container');
let companyInputContainer = document.getElementById('company-input-container');
let countryMenu = document.querySelector('.country-menu');
let errorMsg = document.querySelector('.create-error-msg');
let inputStatus = false;
let role = 'user';
let selectedGender = null;
let selectedCountry = null;
let selectedClientType = null;
let selectedIndividualClientType = null;


function populateCountries() {
    countryList.forEach((country, index) => {
        countryMenu.insertAdjacentHTML('beforeend', `<div class="dropdown-item">
                                                        <input id="country-${index}" type="radio" value="${country['Country']}" onchange="selectCountry(this);" name="country" />
                                                        <label for="country-${index}">${country['Country']}</label>
                                                    </div>`);
    })
}

window.addEventListener('DOMContentLoaded', populateCountries);


function toggleStatus() {
    inputStatus = !inputStatus;
    errorMsg.classList.remove('active');
    errorMsg.innerText = '';
    if (inputStatus) {
        companyInputContainer.classList.remove('hide');
        individualInputContainer.classList.add('hide');
        role = 'company';
    }
    else {
        individualInputContainer.classList.remove('hide');
        companyInputContainer.classList.add('hide');
        role = 'user';
    }
}


function togglePasswordField(event, icon) {
    let passwordField = icon.closest('.password-input-div').querySelector('input[data-type="password"]');

    if (icon.classList.contains('hide-password-icon') && passwordField.type == 'password') {
        passwordField.type = 'text';
        icon.classList.add('hide');
        icon.closest('.password-input-div').querySelector('.show-password-icon').classList.remove('hide');
    }
    else if (icon.classList.contains('show-password-icon') && passwordField.type == 'text') {
        passwordField.type = 'password';
        icon.classList.add('hide');
        icon.closest('.password-input-div').querySelector('.hide-password-icon').classList.remove('hide');
    }
}


function selectGender(inputField) {
    if (inputField.checked) {
        document.getElementById('selected-gender').innerText = inputField.nextElementSibling.innerText;
        document.getElementById('selected-gender').style.color = '#000000';
        selectedGender = inputField.value;
    }
}


function selectCountry(inputField) {
    if (inputField.checked) {
        document.getElementById('selected-country').innerText = inputField.nextElementSibling.innerText;
        document.getElementById('selected-country').style.color = '#000000';
        selectedCountry = inputField.value;
    }
}


function selectClientType(inputField, type='company') {
    if (inputField.checked) {
        document.getElementById(`selected-${type}-client-type`).innerText = inputField.nextElementSibling.innerText;
        document.getElementById(`selected-${type}-client-type`).style.color = '#000000';
        if (type == 'individual')
            selectedIndividualClientType = inputField.value;
        else
            selectedClientType = inputField.value;
    }
}


function formDataToObject(formData) {
    let getData = {}
    formData.forEach(function(value, key) {
        getData[key] = value;
    });
    return getData
}

function beforeLoad(button) {
    button.querySelector('.btn-text').innerText = '';
    button.querySelector('.spinner-border').classList.remove('hide');
    button.disabled = true;
    button.style.cursor ='not-allowed';
}

function afterLoad(button, text) {
    button.querySelector('.btn-text').innerText = text;
    button.querySelector('span').classList.add('hide');
    button.disabled = false;
    button.style.cursor ='pointer';
}


async function registerForm(event) {
    event.preventDefault();
    let form = event.currentTarget;
    let formData = new FormData(form);
    let data = formDataToObject(formData);
    let button = form.querySelector('button[type="submit"]');
    let buttonText = button.innerText;
    let finalData = {};
    if (role == 'user') {
        const phoneError = validatePhoneNumber(phoneInput1, phone1, errorMapDict);
        if (data.first_name.trim().length == 0) {
            errorMsg.innerText = 'Enter valid first name';
            errorMsg.classList.add('active');
            return false;
        }
        else if (data.last_name.trim().length == 0) {
            errorMsg.innerText = 'Enter valid last name';
            errorMsg.classList.add('active');
            return false;
        }
        else if (selectedGender == null) {
            errorMsg.innerText = 'Select a gender';
            errorMsg.classList.add('active');
            return false;
        }
        // else if (data.gender.toLowerCase() != 'male' && data.gender.toLowerCase() != 'female') {
        //     errorMsg.innerText = 'Enter a valid gender: Male or Female';
        //     errorMsg.classList.add('active');
        //     return false;
        // }
        else if (phoneError != true) {
            errorMsg.innerText = phoneError.message;
            errorMsg.classList.add('active');
            return false;
        }
        else if (emailRegex.test(data.email) == false) {
            errorMsg.innerText = 'Enter valid email';
            errorMsg.classList.add('active');
            return false;
        }
        else if (selectedCountry == null) {
            errorMsg.innerText = 'Select a country';
            errorMsg.classList.add('active');
            return false;
        }
        // else if (data.country.trim().length == 0) {
        //     errorMsg.innerText = 'Enter a country';
        //     errorMsg.classList.add('active');
        //     return false;
        // }
        else if (selectedIndividualClientType == null) {
            errorMsg.innerText = 'Select a client type';
            errorMsg.classList.add('active');
            return false;
        }
        else if (data.password.length < 8) {
            errorMsg.innerText = 'Password must be atleast 8 characters long';
            errorMsg.classList.add('active');
            return false;
        }
        else if (data.confirm_password.length < 8) {
            errorMsg.innerText = 'Confirm Password must be atleast 8 characters long';
            errorMsg.classList.add('active');
            return false;
        }
        else if (data.password != data.confirm_password) {
            errorMsg.innerText = 'Password and Confirm Password do not match';
            errorMsg.classList.add('active');
            return false;
        }
        finalData = {
            "first_name": data.first_name,
            "last_name": data.last_name,
            "gender": data.gender.toLowerCase(),
            "phone_number": data.phone_number,
            "email": data.email,
            "country": data.country,
            "client_type": data.individual_client_type,
            "password": data.password,
            "confirm_password": data.confirm_password,
            "role": "user"
        }
    }
    else if (role == 'company') {
        const phoneError = validatePhoneNumber(phoneInput2, phone2, errorMapDict);
        if (data.company_name.trim().length == 0) {
            errorMsg.innerText = 'Enter valid company name';
            errorMsg.classList.add('active');
            return false;
        }
        else if (data.company_siret_number.trim().length != 14) {
            errorMsg.innerText = 'Enter 14 digit company siret number';
            errorMsg.classList.add('active');
            return false;
        }
        else if (data.company_address.trim().length == 0) {
            errorMsg.innerText = 'Enter valid company address';
            errorMsg.classList.add('active');
            return false;
        }
        else if (data.company_first_name.trim().length == 0) {
            errorMsg.innerText = 'Enter valid first name';
            errorMsg.classList.add('active');
            return false;
        }
        else if (data.company_last_name.trim().length == 0) {
            errorMsg.innerText = 'Enter valid last name';
            errorMsg.classList.add('active');
            return false;
        }
        else if (data.designation.trim().length == 0) {
            errorMsg.innerText = 'Enter valid designation';
            errorMsg.classList.add('active');
            return false;
        }
        else if (selectedClientType == null) {
            errorMsg.innerText = 'Select a client type';
            errorMsg.classList.add('active');
            return false;
        }
        else if (phoneError != true) {
            errorMsg.innerText = phoneError.message;
            errorMsg.classList.add('active');
            return false;
        }
        else if (emailRegex.test(data.work_email) == false) {
            errorMsg.innerText = 'Enter valid email';
            errorMsg.classList.add('active');
            return false;
        }
        else if (data.company_password.length < 8) {
            errorMsg.innerText = 'Password must be atleast 8 characters long';
            errorMsg.classList.add('active');
            return false;
        }
        else if (data.company_confirm_password.length < 8) {
            errorMsg.innerText = 'Confirm Password must be atleast 8 characters long';
            errorMsg.classList.add('active');
            return false;
        }
        else if (data.company_password != data.company_confirm_password) {
            errorMsg.innerText = 'Password and Confirm Password do not match';
            errorMsg.classList.add('active');
            return false;
        }
        
        finalData = {
            "company_name": data.company_name,
            "company_siret_number": data.company_siret_number,
            "company_address": data.company_address,
            "first_name": data.company_first_name,
            "last_name": data.company_last_name,
            "designation": data.designation,
            "client_type": data.client_type,
            "phone_number": data.company_phone,
            "email": data.work_email,
            "password": data.company_password,
            "confirm_password": data.company_confirm_password,
            "role": "company"
        }
    }
    try {
        errorMsg.innerText = '';
        errorMsg.classList.remove('active');

        let headers = {
            "Content-Type": "application/json",
            "X-CSRFToken": data.csrfmiddlewaretoken
        };
        beforeLoad(button);
        let response = await requestAPI(`${apiURL}/user/register`, JSON.stringify(finalData), headers, 'POST');
        response.json().then(function(res) {
            // console.log(res);
            if (response.status == 200) {
                afterLoad(button, 'User Created');
                button.disabled = true;
                setTimeout(() => {
                    button.disabled = false;
                    location.pathname = '/login/';
                }, 1500)
            }
            else {
                afterLoad(button, buttonText);
                displayMessages(res, errorMsg);
                // errorMsg.innerText = res.message;
                errorMsg.classList.add('active');
            }
        })
    }
    catch (err) {
        console.log(err);
    }
}


async function initMap() {
    const addressElement = document.getElementById("company-address");
    addressElement.addEventListener('keydown', function(e) {
        if(e.keyCode === 13) {
            e.preventDefault();
        }
    })
    const searchBox = new google.maps.places.SearchBox(addressElement);
}


const phoneInput1 = document.querySelector("#phone-number");
const phoneInput2 = document.querySelector('#phone');
const errorMapDict = {
    "0": { "message": "Please enter a valid phone number" },
    "1": { "message": "Please enter a phone number with valid country code" },
    "2": { "message": "The entered phone number is too short" },
    "3": { "message": "The entered phone number is too long" },
    "4": { "message": "Please enter a valid phone number" },
}

var phone1 = window.intlTelInput(phoneInput1, {
    separateDialCode: true,
    initialCountry: "auto",
    customPlaceholder: '000 00 000',
    showFlags:false,
    nationalMode: false,
    geoIpLookup: function(success, failure) {
        let headers = {
            Accept: "application/json",
        };
        requestAPI("https://ipinfo.io", null, headers, 'GET').then(function(response) {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        }).then(function(resp) {
            var countryCode = (resp && resp.country) ? resp.country : "us";
            success(countryCode);
        }).catch(function(error) {
            if (typeof failure === "function") {
                failure(error.message);
            }
        })
    },
    hiddenInput: "full",
    utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/js/utils.js",
});

phoneInput1.addEventListener("input", function() {
    var full_number = phone1.getNumber(intlTelInputUtils.numberFormat.INTERNATIONAL);
    full_number = full_number.replaceAll(" ", "");
    full_number = full_number.replaceAll("-", "");
    this.value = full_number;
});
phoneInput1.addEventListener("change", function() {
    var full_number = phone1.getNumber(intlTelInputUtils.numberFormat.INTERNATIONAL);
    full_number = full_number.replaceAll(" ", "");
    full_number = full_number.replaceAll("-", "");
    this.value = full_number;
});
phoneInput1.addEventListener("paste", function() {
    var full_number = phone1.getNumber(intlTelInputUtils.numberFormat.INTERNATIONAL);
    full_number = full_number.replaceAll(" ", "");
    full_number = full_number.replaceAll("-", "");
    this.value = full_number;
});


var phone2 = window.intlTelInput(phoneInput2, {
    separateDialCode: true,
    initialCountry: "auto",
    customPlaceholder: '000 00 000',
    showFlags:false,
    nationalMode: false,
    geoIpLookup: function(success, failure) {
        let headers = {
            Accept: "application/json",
        };
        requestAPI("https://ipinfo.io", null, headers, 'GET').then(function(response) {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        }).then(function(resp) {
            var countryCode = (resp && resp.country) ? resp.country : "us";
            success(countryCode);
        }).catch(function(error) {
            if (typeof failure === "function") {
                failure(error.message);
            }
        })
    },
    hiddenInput: "full",
    utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/js/utils.js",
});

phoneInput2.addEventListener("input", function() {
    var full_number = phone2.getNumber(intlTelInputUtils.numberFormat.INTERNATIONAL);
    full_number = full_number.replaceAll(" ", "");
    full_number = full_number.replaceAll("-", "");
    this.value = full_number;
});
phoneInput2.addEventListener("change", function() {
    var full_number = phone2.getNumber(intlTelInputUtils.numberFormat.INTERNATIONAL);
    full_number = full_number.replaceAll(" ", "");
    full_number = full_number.replaceAll("-", "");
    this.value = full_number;
});
phoneInput2.addEventListener("paste", function() {
    var full_number = phone2.getNumber(intlTelInputUtils.numberFormat.INTERNATIONAL);
    full_number = full_number.replaceAll(" ", "");
    full_number = full_number.replaceAll("-", "");
    this.value = full_number;
});


function validatePhoneNumber(phoneInput, intlInstance, errorMapDict) {
    if (phoneInput.value.trim()) {
        if (!intlInstance.isValidNumber()) {
            const errorCode = intlInstance.getValidationError();
            return errorMapDict[errorCode];
        }
    } else {
        return "Phone number is required.";
    }
    return true;
}