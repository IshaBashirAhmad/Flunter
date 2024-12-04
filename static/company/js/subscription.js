var stripe;
var elements;
let currenSelectedPlan;
let subscriptionData = [];
let subscriptionCardsWrapper = document.getElementById('subscription-cards-wrapper');


async function getSubscriptionPlans() {
    let token = getCookie('user_access');
    let headers = { "Authorization": `Bearer ${token}` };
    let response = await requestAPI(`${apiURL}/subscriptions/list`, null, headers, "GET");
    response.json().then(function(res) {
        if (response.status == 200) {
            subscriptionData = [...res.data];
            subscriptionCardsWrapper.innerHTML = '';
            subscriptionData.forEach(sub => {
                subscriptionCardsWrapper.innerHTML += `<div class="col">
                                                            <div class="card h-100 subscription-card ${userData.user.sub?.id == sub.id ? 'active' : ''}" plan-card-id="${sub.id}">
                                                                <div class="card-body">
                                                                    <div>
                                                                        <div class="d-flex flex-column justify-content-between">
                                                                            <h3 class="subscription-type text-center">${sub.name}</h5>
                                                                        </div>
                                                                        <h4 id="silver-plan" class="subscription-fee" plan-price="${sub.id}">€${sub.monthly_price}/month</h4>
                                                                        <div class="subscription-points">
                                                                            <div>
                                                                                <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                                    <path d="M27.5 15C27.5 21.9035 21.9035 27.5 15 27.5C8.09644 27.5 2.5 21.9035 2.5 15C2.5 8.09644 8.09644 2.5 15 2.5C21.9035 2.5 27.5 8.09644 27.5 15Z" fill="#000000"/>
                                                                                    <path d="M20.0379 11.2121C20.404 11.5782 20.404 12.1718 20.0379 12.5379L13.7879 18.7879C13.4217 19.154 12.8282 19.154 12.4621 18.7879L9.96208 16.2879C9.59597 15.9217 9.59597 15.3282 9.96208 14.9621C10.3282 14.596 10.9218 14.596 11.2879 14.9621L13.125 16.7991L15.9185 14.0056L18.7121 11.2121C19.0782 10.846 19.6717 10.846 20.0379 11.2121Z" fill="white"/>
                                                                                </svg>
                                                                                <span> ${sub.users_limit} user</span>
                                                                            </div>
                                                                            <div>
                                                                                <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                                    <path d="M27.5 15C27.5 21.9035 21.9035 27.5 15 27.5C8.09644 27.5 2.5 21.9035 2.5 15C2.5 8.09644 8.09644 2.5 15 2.5C21.9035 2.5 27.5 8.09644 27.5 15Z" fill="#000000"/>
                                                                                    <path d="M20.0379 11.2121C20.404 11.5782 20.404 12.1718 20.0379 12.5379L13.7879 18.7879C13.4217 19.154 12.8282 19.154 12.4621 18.7879L9.96208 16.2879C9.59597 15.9217 9.59597 15.3282 9.96208 14.9621C10.3282 14.596 10.9218 14.596 11.2879 14.9621L13.125 16.7991L15.9185 14.0056L18.7121 11.2121C19.0782 10.846 19.6717 10.846 20.0379 11.2121Z" fill="white"/>
                                                                                </svg>
                                                                                <span> ${sub.simultaneous_connections_limit} simultaneous connections</span>
                                                                            </div>
                                                                            <div>
                                                                                <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                                    <path d="M27.5 15C27.5 21.9035 21.9035 27.5 15 27.5C8.09644 27.5 2.5 21.9035 2.5 15C2.5 8.09644 8.09644 2.5 15 2.5C21.9035 2.5 27.5 8.09644 27.5 15Z" fill="#000000"/>
                                                                                    <path d="M20.0379 11.2121C20.404 11.5782 20.404 12.1718 20.0379 12.5379L13.7879 18.7879C13.4217 19.154 12.8282 19.154 12.4621 18.7879L9.96208 16.2879C9.59597 15.9217 9.59597 15.3282 9.96208 14.9621C10.3282 14.596 10.9218 14.596 11.2879 14.9621L13.125 16.7991L15.9185 14.0056L18.7121 11.2121C19.0782 10.846 19.6717 10.846 20.0379 11.2121Z" fill="white"/>
                                                                                </svg>
                                                                                <span> ${sub.credits} Credits Per Month</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div class="subscription-btn-container">
                                                                    <button class="subscription-choose-btn" plan-id="${sub.id}" ${userData.user.role == 'auth_user' || userData.user.role == 'contact' || userData.user.role == 'admin' || (userData.user.sub?.id == sub.id && userData.user.sub?.is_trial_user == false) ? "disabled" : `onclick='choosePlan(${sub.id}, this);' style="background: #000000;"`}>
                                                                        <span class="spinner-border spinner-border-sm hide" role="status" aria-hidden="true"></span>
                                                                        <span class="btn-text">${userData.user.sub == null && userData.user.has_used_trial == false ? 'Start Trial' : userData.user.sub != null && userData.user.sub.id == sub.id && userData.user.sub.is_trial_user == true ? 'Choose' : userData.user.sub != null && userData.user.sub.id == sub.id ? 'Current' : userData.user.sub != null && userData.user.has_used_trial == true ? 'Choose' : 'Choose'}</span>
                                                                    </button>
                                                                    <span class="compare-plan-text cursor-pointer" onclick="location.pathname = 'plans-comparison'">Compare plans</span>
                                                                    ${userData.user.sub?.is_trial_user == true && userData.user.sub?.id == sub.id ? `<span style="color: red!important; position: absolute; bottom: 5px; font-size: .875rem;">Your trial ends in ${userData.user.sub.remaining_trial_days} day&#40;s&#41;</span>` : '' }
                                                                </div>
                                                            </div>                  
                                                        </div>`
            })
        }
    })
}

window.addEventListener('load', getSubscriptionPlans);


let subscriptionModal = document.getElementById('subscription-modal');
subscriptionModal.addEventListener('hidden.bs.modal', async event => {
    let headers = { "Content-Type": "application/json" };
    let interval = selectedPlanDetails.selectedPlanInterval == 'monthly' ? 'monthly' : 'yearly';
    let response = await requestAPI(`/users/initiate-subscription/${selectedPlanDetails.id}/`, JSON.stringify({"interval": interval}), headers, 'POST');
})


function removeSessionData() {
    sessionStorage.removeItem('searchData');
}

window.addEventListener('load', removeSessionData);


function selectCurrency(logo, name) {
    document.getElementById('currency-icon').innerText = logo;
    document.getElementById('currency-name').innerText = name;
}


function changeSubscriptionInterval(interval) {
    let planCards = document.querySelectorAll('.subscription-fee');
    if (interval == 'monthly') {
        planCards.forEach(card => {
            let planDetail = subscriptionData.find(plan => plan.id == card.getAttribute('plan-price'));
            card.innerText = `€${planDetail.monthly_price}/month`;
        })
        selectedSubscriptionInterval = 'monthly';
    }
    else if (interval == 'annually') {
        planCards.forEach(card => {
            let planDetail = subscriptionData.find(plan => plan.id == card.getAttribute('plan-price'));
            card.innerText = `€${planDetail.yearly_price}/year`;
        })
        selectedSubscriptionInterval = 'yearly';
    }
    toggleSelectedPlan();
}


function toggleSelectedPlan() {
    let planCard = document.querySelector(`div[plan-card-id="${userData.user.sub?.id}"]`);
    if (planCard) {
        if ((userData.user.sub.current_plan == 'Monthly' && selectedSubscriptionInterval == 'yearly') || (userData.user.sub.current_plan == 'Yearly' && selectedSubscriptionInterval == 'monthly')) {
            if (userData.user.role != 'auth_user' && userData.user.role != 'contact') {
                if (userData.user.sub.is_trial_user != true) {
                    planCard.classList.remove('active');
                }
                planCard.querySelector('.subscription-choose-btn').disabled = false;
                planCard.querySelector('.subscription-choose-btn').style.background = '#000000';
                planCard.querySelector('.btn-text').innerText = 'Choose';
            }
        }
        else if ((userData.user.sub.current_plan == 'Monthly' && selectedSubscriptionInterval == 'monthly') || (userData.user.sub.current_plan == 'Yearly' && selectedSubscriptionInterval == 'yearly')) {
            if (userData.user.role != 'auth_user' && userData.user.role != 'contact') {
                planCard.classList.add('active');
                if (userData.user.sub.is_trial_user == true) {
                    planCard.querySelector('.subscription-choose-btn').disabled = false;
                    planCard.querySelector('.subscription-choose-btn').style.background = '#000000';
                    planCard.querySelector('.btn-text').innerText = 'Choose';
                }
                else {
                    planCard.querySelector('.subscription-choose-btn').disabled = true;
                    planCard.querySelector('.subscription-choose-btn').style.background = 'transparent';
                    planCard.querySelector('.btn-text').innerText = 'Current';
                }
            }
        }
    }
}


async function getStripeKey() {
    stripe = Stripe(stripe_publishable_key);
}

window.addEventListener("DOMContentLoaded", getStripeKey);


let client_Secret;
let paymentElement;

async function choosePlan(plan_id, button) {
    let buttonText = button.innerText;
    let token = getCookie('user_access');
    let headers = { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
    beforeLoad(button);
    let response = await requestAPI(`${apiURL}/subscription/create`, JSON.stringify({"subscription": plan_id, "frequency": selectedSubscriptionInterval}), headers, 'POST');
    response.json().then(function(res) {
        if (response.status == 200) {
            if ('user' in res) {
                afterLoad(button, 'Trial Started');
                button.disabled = true;
                document.querySelectorAll('.subscription-choose-btn').forEach(btn => btn.disabled = true)
                currenSelectedPlan = plan_id;
                setTimeout(() => {
                    location.pathname = '/subscription/';
                }, 1500);
            }
            else {
                client_Secret = res[1].client_secret;
                document.querySelector("#payment-form").addEventListener("submit", handleSubmit);

                const appearance = { theme: 'stripe' };
                elements = stripe.elements({ appearance, clientSecret: client_Secret });
                
                const paymentElementOptions = { layout: "tabs" };
                paymentElement = elements.create("payment", paymentElementOptions);
                paymentElement.mount("#payment-element");
                document.querySelector('.subscription-modal').click();
                afterLoad(button, buttonText);
            }
        }
    })
}


async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
  
    const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
            return_url: location.origin + '/subscription-successful',
        },
    });
  
    if (error) {
        showMessage(error.message);
    }
    else if (paymentIntent && paymentIntent.status === 'succeeded') {
        showMessage('Payment succeeded!');
        setInterval(() => {
            location.href = location.origin + '/subscription-successful';
        }, 1500)
    }
    else {
        showMessage("An unexpected error occurred.");
    }
    setLoading(false);
}


function showMessage(messageText) {
    const messageContainer = document.querySelector("#payment-message");
  
    messageContainer.classList.remove("hidden");
    messageContainer.textContent = messageText;
  
    setTimeout(function () {
        messageContainer.classList.add("hidden");
        messageContainer.textContent = "";
    }, 5000);
}


function setLoading(isLoading) {
    if (isLoading) {
        // Disable the button and show a spinner
        document.querySelector("#submit").disabled = true;
        document.querySelector("#spinner").classList.remove("hidden");
        document.querySelector("#button-text").classList.add("hidden");
    } else {
        document.querySelector("#submit").disabled = false;
        document.querySelector("#spinner").classList.add("hidden");
        document.querySelector("#button-text").classList.remove("hidden");
    }
}


const phoneInput = document.querySelector("#phone");
let page_load = false
var phone = window.intlTelInput(phoneInput, {
    separateDialCode: true,
    initialCountry: "auto",
    //customPlaceholder: '000 00 000',
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

phone.promise.then(() => {
    phoneInput.value = phone_number;
})
const input = document.querySelector("#phone");
const errorMsg = document.querySelector("#error-msg");
const validMsg = document.querySelector("#valid-msg");
const sumit_btn = document.querySelector('#sumit_btn');
// here, the index maps to the error code returned from getValidationError - see readme
const errorMap = ["Invalid number", "Invalid country code", "Too short", "Too long", "Invalid number"];

// initialise plugin
// const iti = window.intlTelInput(input, {
//     initialCountry: "us",
//     utilsScript: "/intl-tel-input/js/utils.js?1714308177587"
//   });

const reset = () => {
    input.classList.remove("error");
    errorMsg.innerHTML = "";
    errorMsg.classList.add("hide");
    validMsg.classList.add("hide");
};
const showError = (msg) => {
    input.classList.add("error");
    errorMsg.innerHTML = msg;
    errorMsg.classList.remove("hide");
  };
  
// on click button: validate
phoneInput.addEventListener('keyup', () => {
    reset();
    if (!input.value.trim()) {
      showError("Required");
      sumit_btn.disabled = true;
    } else if (phone.isValidNumber()) {
      validMsg.classList.remove("hide");
      sumit_btn.disabled = false;
    } else {
      const errorCode = phone.getValidationError();
      const msg = errorMap[errorCode] || "Invalid number";
      showError(msg);
      sumit_btn.disabled = true;
    }
});
  
phoneInput.addEventListener("countrychange", function() {
    if (page_load){
        this.dispatchEvent(new KeyboardEvent('keyup'));
    }
    page_load = true
});

phoneInput.addEventListener("input", function() {
    var full_number = phone.getNumber(intlTelInputUtils.numberFormat.INTERNATIONAL);
    full_number = full_number.replaceAll(" ", "");
    full_number = full_number.replaceAll("-", "");
    this.value = full_number;
});
phoneInput.addEventListener("change", function() {
    var full_number = phone.getNumber(intlTelInputUtils.numberFormat.INTERNATIONAL);
    full_number = full_number.replaceAll(" ", "");
    full_number = full_number.replaceAll("-", "");
    this.value = full_number;
});
phoneInput.addEventListener("paste", function() {
    var full_number = phone.getNumber(intlTelInputUtils.numberFormat.INTERNATIONAL);
    full_number = full_number.replaceAll(" ", "");
    full_number = full_number.replaceAll("-", "");
    this.value = full_number;
});


function openContactUsModal(modalId) {
    let modal = document.querySelector(`#${modalId}`);
    let form = modal.querySelector("form");
    form.setAttribute("onsubmit", `contactUsForm(event);`);
    modal.addEventListener('hidden.bs.modal', event => {
        form.reset();
        form.removeAttribute("onsubmit");
        modal.querySelector('.btn-text').innerText = 'Add';
        document.querySelector('.contact-us-error-msg').classList.remove('active');
        document.querySelector('.contact-us-error-msg').innerText = "";
    })
    document.querySelector(`.${modalId}`).click();
}


async function contactUsForm(event) {
    event.preventDefault();
    let form = event.currentTarget;
    let formData = new FormData(form);
    let data = formDataToObject(formData);
    let button = form.querySelector('button[type="submit"]');
    let buttonText = button.innerText;
    let errorMsg = form.querySelector('.contact-us-error-msg');

    if (data.contact_name.trim().length == 0) {
        errorMsg.innerText = 'Enter a valid contact name.';
        errorMsg.classList.add('active');
        return false;
    }
    else if (emailRegex.test(data.contact_email) == false) {
        errorMsg.innerText = 'Enter a valid contact email.';
        errorMsg.classList.add('active');
        return false;
    }
    else if (phoneRegex.test(data.contact_phone) == false) {
        errorMsg.innerText = 'Please enter a valid contact phone number with country code';
        errorMsg.classList.add('active');
        return false;
    }
    else if (data.business_name.trim().length == 0) {
        errorMsg.innerText = 'Enter a valid business name.';
        errorMsg.classList.add('active');
        return false;
    }
    else if (emailRegex.test(data.business_email) == false) {
        errorMsg.innerText = 'Enter a valid business email.';
        errorMsg.classList.add('active');
        return false;
    }
    else if (data.number_of_employees.trim().length == 0) {
        errorMsg.innerText = 'Enter a valid number of employees.';
        errorMsg.classList.add('active');
        return false;
    }
    else if (data.desired_credits.trim().length == 0) {
        errorMsg.innerText = 'Enter a valid number of desired credits.';
        errorMsg.classList.add('active');
        return false;
    }
    else if (data.desired_connections.trim().length == 0 || isNaN(data.desired_connections)) {
        errorMsg.innerText = 'Enter a valid number of desired simultaneous connections.';
        errorMsg.classList.add('active');
        return false;
    }
    else if (data.comment.trim().length == 0) {
        errorMsg.innerText = 'Enter your comment.';
        errorMsg.classList.add('active');
        return false;
    }
    try {
        errorMsg.innerText = '';
        errorMsg.classList.remove('active');

        let headers = { "Content-Type": "application/json", "X-CSRFToken": data.csrfmiddlewaretoken };
        beforeLoad(button);
        let response = await requestAPI('/users/send-contact-us-email/', JSON.stringify(data), headers, 'POST');
        response.json().then(function(res) {
            if (res.success) {
                form.reset();
                reset();
                afterLoad(button, 'Email Sent');
                setTimeout(() => {
                    afterLoad(button, 'Send');
                    document.querySelector('.contactUsModal').click();
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
