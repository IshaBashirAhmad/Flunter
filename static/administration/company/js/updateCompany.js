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
function preventSubmission(event) {
    event.preventDefault(); 
    history.back()
}


function selectClientType(inputField) {
    if (inputField.checked) {
        document.getElementById('selected-client-type').innerText = inputField.nextElementSibling.innerText;
        document.getElementById('selected-client-type').style.color = '#000000';
        selectedClientType = inputField.value;
    }
}


let error_message = document.querySelector('.create-error-msg');
let first_name = document.getElementById('first_name_errors')
let last_name = document.getElementById('last_name_errors')
let phone__number = document.getElementById('phone_number_errors')
let email = document.getElementById('email_errors')
let company_name = document.getElementById('company_name_errors')
let company_siret_number = document.getElementById('company_siret_number_errors')
let company_address = document.getElementById('company_address_errors')
let designation = document.getElementById('designation_errors')
let client_type = document.getElementById('client_type_errors')


function updateCompanyForm(event) {
    event.preventDefault()
    let form = event.currentTarget;
    let formData = new FormData(form);
    let data = formDataToObject(formData);
    let isValid = true
    
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
    if (data.company_name.trim().length == 0) {
        company_name.innerText = 'This field is required';
        isValid = false
    }
    else
        company_name.innerText=''
    if (data.company_address.trim().length == 0) {
        company_address.innerText = 'This field is required';
        isValid = false
    }
    else
        company_address.innerText=''
    if (data.company_siret_number.trim().length == 0) {
        company_siret_number.innerText = 'This field is required';
        isValid = false
    }
    else
        company_siret_number.innerText = ''
    if (selectedClientType == null) {
        client_type.innerText = 'Select a client type';
        isValid = false
    }
    else
        client_type.innerText=''
    if (data.designation.trim().length == 0) {
        designation.innerText = 'This field is required';
        isValid = false
    }
    else
        designation.innerText=''

    if(!isValid)
        return false
    form.submit();
}