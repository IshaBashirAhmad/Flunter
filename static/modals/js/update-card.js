var stripe;
var elements;

async function getStripeKey() {
    // let response = await requestAPI('/users/config/', null, {}, 'GET');
    // let res = await response.json();
    // if (response.status == 200) {
    //     stripe_publishable_key = res.stripe_publishable_key;
    //     stripe = Stripe(stripe_publishable_key);
    // }
    stripe = Stripe(stripe_publishable_key);
}

window.addEventListener("DOMContentLoaded", getStripeKey);


async function openUpdateCardModal(modalId) {
    let modal = document.querySelector(`#${modalId}`);
    let form = modal.querySelector("#custom-card-update-form");

    modal.addEventListener('hidden.bs.modal', event => {
        form.reset();
        modal.querySelector('.btn-text').innerText = 'Save';
        document.querySelector('.create-error-msg').classList.remove('active');
        document.querySelector('.create-error-msg').innerText = "";
    });
    
    let token = getCookie('user_access');
    let response = await requestAPI(`${apiURL}/payment/intent/`, null, {'Authorization': `Bearer ${token}`}, "GET");
    let res = await response.json();

    if (response.ok) {
        const client_secret = res.client_secret;
        const appearance = { theme: 'stripe' };
        elements = stripe.elements({ appearance , clientSecret: client_secret });
        var style = {
            base: {
                // Add your base input styles here. For example:
                fontSize: '16px',
                color: '#32325d',
            },
        };
        const paymentElementOptions = { layout: "tabs" };
        const paymentElement = elements.create("card", {'style': style});
        paymentElement.mount('#card-element');

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            handleUpdateCard(client_secret, paymentElement);
        });

        document.querySelector(`.${modalId}`).click();
    } else {
        console.error(res.error);
    }
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

function beforeResponse (button){
    button.disabled = true;
    button.querySelector('.btn-text').textContent = '';
    button.querySelector('#spinner').classList.remove('hide');
}

function afterResponse (button, text){
    button.disabled = false;
    button.querySelector('.btn-text').textContent = text;
    button.querySelector('#spinner').classList.add('hide');
}

async function handleUpdateCard(clientSecret, cardElement) {
    let button = document.querySelector('#card-button');
    let buttonText = button.querySelector('.btn-text').textContent;

    const cardholderName = document.getElementById('card_holder').value;
    if (cardholderName.trim().length === 0) {
        showMessage('Enter valid name');
        return;
    }

    try {
        beforeResponse(button)
        const { setupIntent, error } = await stripe.confirmCardSetup(
            clientSecret, {
                payment_method: {
                    card: cardElement,
                    billing_details: {
                        name: cardholderName
                    },
                },
            }
        );

        if (error) {
            afterResponse(button, buttonText);
            showMessage(error.message);
        } else {
            let token = getCookie('user_access');
            let headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };
            let updateResponse = await requestAPI(`${apiURL}/user/payment/`, JSON.stringify({ payment_id: setupIntent.payment_method }), headers, "POST");
            let updateRes = await updateResponse.json();
            if (updateResponse.ok && updateResponse.status == 200) {
                afterResponse(button, 'Updated');
                setInterval(() => {
                    location.reload();
                }, 1500);
            } else {
                afterResponse(button, buttonText);
                showMessage(updateRes.message);
                console.log(updateRes.message)
            }
        }
    } catch (err) {
        afterResponse(button, 'Error');
        console.log(err);
    }
}
