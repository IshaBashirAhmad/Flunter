let countryMenu = document.querySelector('.country-menu');
let selectedCountry = null;


function populateCountries() {
    countryList.forEach((country, index) => {
        countryMenu.insertAdjacentHTML('beforeend', `<div class="dropdown-item">
                                                        <input id="country-${index}" type="radio" value="${country['Country']}" onchange="selectCountry(this);" name="country" />
                                                        <label for="country-${index}">${country['Country']}</label>
                                                    </div>`);
    })
}

window.addEventListener('DOMContentLoaded', populateCountries);

function selectCountry(inputField) {
    if (inputField.checked) {
        document.getElementById('selected-country').innerText = inputField.nextElementSibling.innerText;
        document.getElementById('selected-country').style.color = '#000000';
        user_country = inputField.value;
    }
}

function openOptOutForm(modalId) {
    let modal = document.querySelector(`#${modalId}`);
    let form = modal.querySelector("form");
    form.setAttribute("onsubmit", `optOutForm(event);`);
    modal.addEventListener('hidden.bs.modal', event => {
        form.reset();
        form.removeAttribute("onsubmit");
        modal.querySelector('.btn-text').innerText = 'Send';
        modal.querySelector('#selected-country').innerText = 'Select a Country';
        modal.querySelector('#selected-country').style.color = "#A9A9A9";
        document.querySelector('.contact-us-error-msg').classList.remove('active');
        document.querySelector('.contact-us-error-msg').innerText = "";
    })
    document.querySelector(`.${modalId}`).click();
}

async function optOutForm(event) {
    event.preventDefault();
    let form = event.currentTarget;
    let formData = new FormData(form);
    let data = formDataToObject(formData);
    let button = form.querySelector('button[type="submit"]');
    let buttonText = button.innerText;
    let errorMsg = form.querySelector('.contact-us-error-msg');

    if (data.full_name.trim().length == 0) {
        errorMsg.innerText = 'Enter a valid full name.';
        errorMsg.classList.add('active');
        return false;
    }
    else if (emailRegex.test(data.email) == false) {
        errorMsg.innerText = 'Enter a valid email.';
        errorMsg.classList.add('active');
        return false;
    }
    if (selectedCountry == null && !('country' in data)) {
        errorMsg.innerText = 'Select a country';
        errorMsg.classList.add('active');
        return false;
    }
    if (data.contact_phone != '') {
        if (phoneRegex.test(data.contact_phone) == false) {
            errorMsg.innerText = 'Please enter a valid contact phone number with country code';
            errorMsg.classList.add('active');
            return false;
        }
    }
    try {
        errorMsg.innerText = '';
        errorMsg.classList.remove('active');

        let headers = { "Content-Type": "application/json", "X-CSRFToken": data.csrfmiddlewaretoken };
        beforeLoad(button);
        let response = await requestAPI('/users/send-opt-out-request/', JSON.stringify(data), headers, 'POST');
        response.json().then(function(res) {
            if (res.success) {
                form.reset();
                afterLoad(button, 'Email Sent');
                setTimeout(() => {
                    afterLoad(button, 'Send');
                    document.querySelector('.openOptOutModal').click();
                }, 1200)
            }
            else {
                errorMsg.innerText = res.message;
                errorMsg.classList.add('active');
                afterLoad(button, 'Send');
            }
        })
    }
    catch (err) {
        console.log(err);
        afterLoad(button, buttonText);
    }
}
