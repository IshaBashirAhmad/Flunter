let button = document.querySelector('button[type="submit"]');
let errorMsg = document.querySelector('.update-error-msg');
let passwordChangeContainer = document.getElementById('password-change-container');
let companyInputContainer = document.getElementById('company-input-container');
let profileImageContainer = document.getElementById('profile-image-container');
let countryMenu = document.querySelector('.country-menu');
let companyDropdown = document.getElementById('company-dropdown');
let companyField = document.getElementById('company-field');
let backBtn = document.getElementById('back-btn');
let cancelBtn = document.getElementById('cancel-btn');
let emailInput = document.getElementById('email');

let selectedGender = null;
let selectedCountry = null;
let selectedClientType = null;
let selectedIndividualClientType = null;


function populateCountries() {
    if (countryMenu) {
        countryList.forEach((country, index) => {
            countryMenu.insertAdjacentHTML('beforeend', `<div class="dropdown-item">
                                                            <input ${country['Country'].toLowerCase() == user_country.toLowerCase() ? 'checked' : ''} id="country-${index}" type="radio" value="${country['Country']}" onchange="selectCountry(this);" name="country" />
                                                            <label for="country-${index}">${country['Country']}</label>
                                                        </div>`);
        })
    }
}

window.addEventListener('DOMContentLoaded', populateCountries);


function removeSessionData() {
    sessionStorage.removeItem('searchData');
}

window.addEventListener('load', removeSessionData);


function toggleContainers() {
    if (!companyInputContainer.classList.contains('hide')) {
        companyInputContainer.classList.add('hide');
        profileImageContainer.classList.add('hide');
        passwordChangeContainer.classList.remove('hide');
        button.setAttribute('form', 'password-change-container');
        button.querySelector('.btn-text').innerText = 'Save';
        errorMsg.innerText = '';
        errorMsg.classList.remove('active');
        document.getElementById('container-heading').innerText = 'Change Password';
        backBtn.setAttribute('onclick', 'toggleContainers()');
        cancelBtn.setAttribute('onclick', 'toggleContainers()');
    }
    else {
        companyInputContainer.classList.remove('hide');
        profileImageContainer.classList.remove('hide');
        passwordChangeContainer.classList.add('hide');
        button.setAttribute('form', 'company-input-container');
        button.querySelector('.btn-text').innerText = 'Save';
        errorMsg.innerText = '';
        errorMsg.classList.remove('active');
        document.getElementById('container-heading').innerText = 'Change Personal Info';
        backBtn.setAttribute('onclick', "location.pathname = '/account/'");
        cancelBtn.setAttribute('onclick', "location.pathname = '/account/'");
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
        user_country = inputField.value;
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


// Preview Image on profile form

function previewImage(event, inputElement) {
    let image = event.currentTarget.files;
    let imageTag = document.getElementById('profile-image');
    imageTag.src = window.URL.createObjectURL(image[0]);
}

async function updateAuthUserForm(event, id) {
    event.preventDefault();
    let form = event.currentTarget;
    let formData = new FormData(form);
    let data = formDataToObject(formData);
    let buttonText = button.innerText;
    let imageFile = document.getElementById('image-input')
    
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
    else if (emailRegex.test(data.email) == false) {
        errorMsg.innerText = 'Enter valid email';
        errorMsg.classList.add('active');
        return false;
    }
    try {
        errorMsg.innerText = '';
        errorMsg.classList.remove('active');

        formData.delete('profile_picture');
        if (imageFile.files[0])
            formData.append('profile_picture', imageFile.files[0]);

        let token = getCookie('user_access');
        let headers = { "Authorization": `Bearer ${token}` };
        
        beforeLoad(button);
        let response = await requestAPI(`${apiURL}/user-update/`, formData, headers, "PATCH");
        response.json().then(function (res) {
            if (response.status == 200) {
                console.log(res);
                afterLoad(button, 'Info Updated');
                button.disabled = true;
                setTimeout(()=> {
                    button.disabled = false;
                    afterLoad(button, buttonText);
                }, 1500)
                emailInput.setAttribute('data-value', res.data.email);
            }
            else {
                afterLoad(button, buttonText);
                displayMessages(res, errorMsg);
                errorMsg.classList.add('active');
            }
        });
    }
    catch (err) {
        console.log(err);
    }
}


async function updateUserForm(event, id) {
    event.preventDefault();
    let form = event.currentTarget;
    let formData = new FormData(form);
    let data = formDataToObject(formData);
    let buttonText = button.innerText;
    let imageFile = document.getElementById('image-input');
    
    const phoneError = validatePhoneNumber(phoneInput, phone, errorMapDict);
    
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
    else if (data.gender.toLowerCase() != 'male' && data.gender.toLowerCase() != 'female') {
        errorMsg.innerText = 'Select a gender';
        errorMsg.classList.add('active');
        return false;
    }
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
    else if (user_country == null || user_country == '' || user_country.trim().length == 0) {
        errorMsg.innerText = 'Select a country';
        errorMsg.classList.add('active');
        return false;
    }
    else if (selectedIndividualClientType == null && !('individual_client_type' in data)) {
        errorMsg.innerText = 'Select a client type';
        errorMsg.classList.add('active');
        return false;
    }
    else if (data.country.trim().length == 0) {
        errorMsg.innerText = 'Enter a country';
        errorMsg.classList.add('active');
        return false;
    }
    try {
        errorMsg.innerText = '';
        errorMsg.classList.remove('active');

        let individualData = {
            "user": {
                "first_name": data.first_name, "last_name": data.last_name,
                "phone_number": data.phone_number
            },
            "gender": data.gender, "client_type": data.individual_client_type, "country": user_country,
            "phone_number": data.phone_number
        }

        if (data.email != emailInput.getAttribute('data-value'))
            individualData.user.email = data.email;

        let token = getCookie('user_access');
        let headers = { 
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        };
        beforeLoad(button);
        let response = await requestAPI(`${apiURL}/user-update/`, JSON.stringify(individualData), headers, "PATCH");
        response.json().then(async function (res) {
            if (response.status == 200) {
                if (imageFile.files[0]) {
                    formData.append('profile_picture', imageFile.files[0]);
                    delete headers['Content-Type'];
                    let resp = await requestAPI(`${apiURL}/user-update/image/`, formData, headers, "PATCH");
                    resp.json().then(function(res) {
                        if (resp.status == 200) {
                            afterLoad(button, 'Info Updated');
                            button.disabled = true;
                            imageFile.files = null;
                            setTimeout(()=> {
                                button.disabled = false;
                                afterLoad(button, buttonText);
                            }, 1500)
                        }
                        else {
                            afterLoad(button, buttonText);
                            displayMessages(res, errorMsg);
                            errorMsg.classList.add('active');
                        }
                    })
                }
                else {
                    afterLoad(button, 'Info Updated');
                    button.disabled = true;
                    setTimeout(()=> {
                        button.disabled = false;
                        afterLoad(button, buttonText);
                    }, 1500)
                }
                emailInput.setAttribute('data-value', res.data.user.email);
            }
            else {
                afterLoad(button, buttonText);
                displayMessages(res, errorMsg);
                errorMsg.classList.add('active');
            }
        });
    }
    catch (err) {
        console.log(err);
    }
}


async function updateCompanyForm(event, id) {
    event.preventDefault();
    let form = event.currentTarget;
    let formData = new FormData(form);
    let data = formDataToObject(formData);
    let buttonText = button.innerText;
    let imageFile = document.getElementById('image-input');

    const phoneError = validatePhoneNumber(phoneInput, phone, errorMapDict);
    
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
    else if (data.first_name.trim().length == 0) {
        errorMsg.innerText = 'Enter valid first name';
        errorMsg.classList.add('active');
        return false;
    }
    else if (data.last_name.trim().length == 0) {
        errorMsg.innerText = 'Enter valid last name';
        errorMsg.classList.add('active');
        return false;
    }
    else if (data.designation.trim().length == 0) {
        errorMsg.innerText = 'Enter valid designation';
        errorMsg.classList.add('active');
        return false;
    }
    else if (selectedClientType == null && !('client_type' in data)) {
        errorMsg.innerText = 'Select a client type';
        errorMsg.classList.add('active');
        return false;
    }
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
    try {
        errorMsg.innerText = '';
        errorMsg.classList.remove('active');

        let companyData = {
            "user": {
                "first_name": data.first_name, "last_name": data.last_name,
                "phone_number": data.phone_number
            },
            "company_name": data.company_name, "company_siret_number": data.company_siret_number,
            "company_address": data.company_address, "designation": data.designation,
            "client_type": data.client_type
        }

        if (data.email != emailInput.getAttribute('data-value'))
            companyData.user.email = data.email;

        let token = getCookie('user_access');
        let headers = { 
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        };
        
        beforeLoad(button);
        let response = await requestAPI(`${apiURL}/user-update/`, JSON.stringify(companyData), headers, "PATCH");
        response.json().then(async function (res) {
            if (response.status == 200) {
                if (imageFile.files[0]) {
                    formData.append('profile_picture', imageFile.files[0]);
                    delete headers['Content-Type'];
                    let resp = await requestAPI(`${apiURL}/user-update/image/`, formData, headers, "PATCH");
                    resp.json().then(function(res) {
                        if (resp.status == 200) {
                            afterLoad(button, 'Info Updated');
                            button.disabled = true;
                            imageFile.files = null;
                            setTimeout(()=> {
                                button.disabled = false;
                                afterLoad(button, buttonText);
                            }, 1500)
                        }
                        else {
                            afterLoad(button, buttonText);
                            displayMessages(res, errorMsg);
                            errorMsg.classList.add('active');
                        }
                    })
                }
                else {
                    afterLoad(button, 'Info Updated');
                    button.disabled = true;
                    setTimeout(()=> {
                        button.disabled = false;
                        afterLoad(button, buttonText);
                    }, 1500)
                }
                emailInput.setAttribute('data-value', res.data.user.email);
            }
            else {
                afterLoad(button, buttonText);
                displayMessages(res, errorMsg);
                errorMsg.classList.add('active');
            }
        });
    }
    catch (err) {
        console.log(err);
    }
}

async function updateContactForm(event, id) {
    event.preventDefault();
    let form = event.currentTarget;
    let formData = new FormData(form);
    let data = formDataToObject(formData);
    let buttonText = button.innerText;
    let imageFile = document.getElementById('image-input');

    const phoneError = validatePhoneNumber(phoneInput, phone, errorMapDict);
    
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
    // else if (selectedCompany == null) {
    //     errorMsg.innerText = 'Select a company';
    //     errorMsg.classList.add('active');
    //     return false;
    // }
    else if (data.designation.trim().length == 0) {
        errorMsg.innerText = 'Enter valid designation';
        errorMsg.classList.add('active');
        return false;
    }
    else if (user_country == null) {
        errorMsg.innerText = 'Select a country';
        errorMsg.classList.add('active');
        return false;
    }
    try {
        errorMsg.innerText = '';
        errorMsg.classList.remove('active');

        if (imageFile.files[0]) {
            formData.append('profile_picture', imageFile.files[0]);
        }

        let headers = { "X-CSRFToken": data.csrfmiddlewaretoken };
        
        beforeLoad(button);
        let response = await requestAPI(`/users/update-contact/${id}/`, formData, headers, "POST");
        response.json().then(function (res) {
            if (res.success) {
                console.log(res)
                afterLoad(button, 'Info Updated');
                button.disabled = true;
                setTimeout(()=> {
                    button.disabled = false;
                    afterLoad(button, buttonText);
                    // location.href = location.origin + '/login/';
                }, 1500)
            }
            else {
                console.log(res)
                afterLoad(button, buttonText);
                errorMsg.innerText = res.message;
                errorMsg.classList.add('active');
            }
        });
    }
    catch (err) {
        console.log(err);
    }
}


async function updatePasswordForm(event) {
    event.preventDefault();
    let form = event.currentTarget;
    let formData = new FormData(form);
    let data = formDataToObject(formData);
    let buttonText = button.innerText;

    if (data.old_password.length < 8) {
        errorMsg.innerText = 'Current Password must be atleast 8 characters long';
        errorMsg.classList.add('active');
        return false;
    }
    else if (data.password.length < 8) {
        errorMsg.innerText = 'New Password must be atleast 8 characters long';
        errorMsg.classList.add('active');
        return false;
    }
    else if (data.confirm_password.length < 8) {
        errorMsg.innerText = 'Confirm Password must be atleast 8 characters long';
        errorMsg.classList.add('active');
        return false;
    }
    else if (data.password != data.confirm_password) {
        errorMsg.innerText = 'New Password and Confirm Password do not match';
        errorMsg.classList.add('active');
        return false;
    }
    try {
        errorMsg.innerText = '';
        errorMsg.classList.remove('active');

        let token = getCookie('user_access');
        let headers = { 
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        };
        beforeLoad(button);
        let response = await requestAPI(`${apiURL}/password/update`, JSON.stringify(data), headers, "PATCH");
        response.json().then(function(res) {
            if (response.status == 200) {
                afterLoad(button, 'Info Updated');
                button.disabled = true;
                setTimeout(()=> {
                    button.disabled = false;
                    location.pathname = '/account/';
                    // afterLoad(button, buttonText);
                }, 1500)
            }
            else {
                afterLoad(button, buttonText);
                displayMessages(res, errorMsg);
                errorMsg.classList.add('active');
            }
        })
    }
    catch (err) {
        console.log(err);
    }
}


const phoneInput = document.querySelector("#phone-number");
const errorMapDict = {
    "0": { "message": "Please enter a valid phone number" },
    "1": { "message": "Please enter a phone number with valid country code" },
    "2": { "message": "The entered phone number is too short" },
    "3": { "message": "The entered phone number is too long" },
    "4": { "message": "Please enter a valid phone number" },
}

var phone = window.intlTelInput(phoneInput, {
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
            // success(phone.getSelectedCountryData()['iso2']);
            if (typeof failure === "function") {
                failure(error.message);
            }
        })
    },
    hiddenInput: "full",
    utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/js/utils.js",
});


phone.promise.then(() => {
    phoneInput.value = phone_number;
}).catch(() => {
    phoneInput.value = phone_number;
})


phoneInput.addEventListener("input", function() {
    // var full_number = phone.getNumber(intlTelInputUtils.numberFormat.INTERNATIONAL);
    var full_number;
    full_number = this.value.replaceAll(" ", "");
    full_number = this.value.replaceAll("-", "");
    this.value = full_number;
});
phoneInput.addEventListener("change", function() {
    // var full_number = phone.getNumber(intlTelInputUtils.numberFormat.INTERNATIONAL);
    var full_number;
    full_number = this.value.replaceAll(" ", "");
    full_number = this.value.replaceAll("-", "");
    this.value = full_number;
});
phoneInput.addEventListener("paste", function() {
    var full_number = phone.getNumber(intlTelInputUtils.numberFormat.INTERNATIONAL);
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