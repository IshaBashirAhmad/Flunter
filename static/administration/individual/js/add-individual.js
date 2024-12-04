function togglePasswordField(event, icon) {
    let passwordField = icon.closest('.password-input-div').querySelector('input[data-type="password"]');

    if (icon.classList.contains('hide-password-icon') && passwordField.type == 'password') {
        passwordField.type = 'text';
        icon.classList.add('hide');
        console.log(icon.closest('.password-input-div').querySelector('.show-password-icon'));
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


function selectClientType(inputField) {
    if (inputField.checked) {
        document.getElementById('selected-client-type').innerText = inputField.nextElementSibling.innerText;
        document.getElementById('selected-client-type').style.color = '#000000';
        selectedClientType = inputField.value;
    }
}


function preventSubmission(event) {
    event.preventDefault(); 
    location.pathname = '/administration/individuals/'
}

let countryMenu = document.querySelector('.country-menu');
let selectedCountry = null;
let selectedGender = null
function populateCountries() {
    countryList.forEach((country, index) => {

        countryMenu.insertAdjacentHTML('beforeend', `<div class="dropdown-item">
                                                        <input ${country['Country'].toLowerCase() == user_country.toLowerCase() ? 'checked' : ''} id="country-${index}" type="radio" value="${country['Country']}" onchange="selectCountry(this);" name="country" />
                                                        <label for="country-${index}">${country['Country']}</label>
                                                    </div>`);
    })
}

window.addEventListener('DOMContentLoaded', populateCountries);


let error_message = document.querySelector('.create-error-msg');
let first_name = document.getElementById('first_name_errors')
let last_name = document.getElementById('last_name_errors')
let phone__number = document.getElementById('phone_number_errors')
let email = document.getElementById('email_errors')
let gender = document.getElementById('gender_errors')
let country = document.getElementById('country_errors')
let password1 = document.getElementById('password1_errors')
let password2 = document.getElementById('password2_errors')
let client_type = document.getElementById('client_type_errors')


function addIndividualForm(event) {
    event.preventDefault()
    let form = event.currentTarget;
    let formData = new FormData(form);
    let data = formDataToObject(formData);
    let isValid = true
    console.log(data)

    if (data.first_name.trim().length == 0) {
        first_name.innerText = 'This field is required';
        isValid = false
    }
    else
        first_name.innerText = '';
    if (data.last_name.trim().length == 0) {
        last_name.innerText = 'This field is required';
        isValid = false
    }
    else
        last_name.innerText = ''
    if (phoneRegex.test(data.phone_number) == false) {
        phone__number.innerText = 'Please enter a valid number with country code';
        isValid = false
    }
    else
        phone__number.innerText = ''
    if (emailRegex.test(data.email) == false) {
        email.innerText = 'Enter valid email';
        isValid = false
    }
    else
        email.innerText = ''
    if (selectedClientType == null) {
        client_type.innerText = 'Select a client type';
        isValid = false
    }
    else
        client_type.innerText=''
    if (data.password1.length < 8) {
        password1.innerText = 'Password must be atleast 8 characters';
        isValid = false
    }
    else
        password1.innerText = ''
    if (data.password2.length < 8) {
        password2.innerText = 'Confirm Password must be atleast 8 characters';
        isValid = false
    }
    else
        password2.innerText= ''
    if (data.password1 != data.password2 || data.password2.length == 0) {
        password2.innerText = 'Password and Confirm Password do not match';
        isValid = false
    }
    else{
        password2.innerText=''
    }
    if (selectedCountry == null && !('country' in data)) {
        country.innerText = 'Select a country';
        isValid = false
    }
    else
        country.innerText =''
    if (selectedGender == null && !('gender' in data)) {
        gender.innerText = 'Select a gender';
        isValid =false
    }
    else
        gender.innerText = ''
    if(!isValid)
        return false
    form.submit();
}