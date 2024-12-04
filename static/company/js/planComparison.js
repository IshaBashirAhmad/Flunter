var stripe;
var elements;
let currenSelectedPlan;
var PlanData;

let subscriptionModal = document.getElementById('subscription-modal');
subscriptionModal.addEventListener('hidden.bs.modal', async event => {
    let headers = { "Content-Type": "application/json" };
    let interval = selectedPlanDetails.selectedPlanInterval == 'monthly' ? 'm' : 'y';
    console.log(interval);
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

function toggleSelectedPlan() {
    let planButton = document.querySelector(`button[plan-id="${selectedPlanDetails.id}"]`);
    if ((selectedPlanDetails.selectedPlanInterval == 'monthly' && selectedSubscriptionInterval == 'y') || (selectedPlanDetails.selectedPlanInterval == 'yearly' && selectedSubscriptionInterval == 'm')) {
        if (role != 'auth_user' && role != 'contact') {
            planButton.classList.remove('active');
            planButton.disabled = false;
            planButton.style.background = '#2B00CC';
            planButton.querySelector('.btn-text').innerText = 'Choose';
        }
    }
    else if ((selectedPlanDetails.selectedPlanInterval == 'monthly' && selectedSubscriptionInterval == 'm') || (selectedPlanDetails.selectedPlanInterval == 'yearly' && selectedSubscriptionInterval == 'y')) {
        if (role != 'auth_user' && role != 'contact') {
            planButton.classList.add('active');
            if (isTrial == true) {
                planButton.disabled = false;
                planButton.style.background = '#2B00CC';
                planButton.querySelector('.btn-text').innerText = 'Choose';
            }
            else {
                planButton.disabled = true;
                planButton.style.background = '#A4A4A4';
                planButton.querySelector('.btn-text').innerText = 'Current';
            }
            // planButton.querySelector('.btn-text').innerText = 'Current';
        }
    }
}


async function getStripeKey() {
    stripe = Stripe(stripe_publishable_key);
}


window.addEventListener("DOMContentLoaded", getStripeKey);




async function startTrial(plan_id, button) {
    let buttonText = button.innerText;
    try {
        let headers = { "Content-Type": "application/json" };
        beforeLoad(button);
        let response = await requestAPI(`/users/start-trial/${plan_id}/`, JSON.stringify({"interval": selectedSubscriptionInterval}), headers, 'POST');
        response.json().then(function(res) {
            if (response.status == 200) {
                console.log(res);
                afterLoad(button, 'Trial Started');
                button.disabled = true;
                document.querySelectorAll('.subscription-choose-btn').forEach(btn => btn.disabled = true)
                currenSelectedPlan = plan_id;
                setTimeout(() => {
                    // afterLoad(button, buttonText);
                    location.pathname = '/subscription/';
                }, 1500);
            }
            else {
                console.log(res);
                afterLoad(button, 'Error, Retry');
                button.disabled = false;
                setTimeout(() => {
                    afterLoad(button, buttonText);
                }, 1500);
            }
        })
    }
    catch (err) {
        console.log(err);
        afterLoad(button, 'Error, Retry');
        button.disabled = false;
        setTimeout(() => {
            afterLoad(button, buttonText);
        }, 1500);
    }
}


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


async function getSubscriptionPlansData(billingType = 'monthly') {
    try {
        let token = getCookie('user_access');
        let headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        };
        let response = await requestAPI(`${apiURL}/subscriptions/list`, null, headers, 'GET');
        let res = await response.json(); // Await the response JSON parsing
        
        if (response.status === 200) {
            console.log("API response 200:", res);
            // renderTable(res.data, billingType);
            PlanData = res.data;
            renderTable(res.data, billingType, userData);
        } else if (response.status === 403) {
            console.log("API response 403:", response);
            // Handle forbidden error
        } else {
            console.log("API response error:", response);
            // Handle other errors
        }
    } catch (err) {
        console.error("Error fetching subscription data:", err);
    }
}


function changeSubscriptionInterval(interval) {
    renderTable(PlanData, interval, userData);
    selectedSubscriptionInterval = interval;
    updateButtonStates(PlanData, interval, userData)
}


document.addEventListener('DOMContentLoaded', () => {
    getSubscriptionPlansData(selectedSubscriptionInterval); 
});


function renderTable(plans, billingType = 'monthly', userData) {
    // Clear the existing table container
    const tableContainer = document.querySelector('.order-details-table-wrapper');
    tableContainer.innerHTML = ''; // Clear the container

    // Create table element
    const table = document.createElement('table');
    table.className = 'order-details-table';

    // Create thead element
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    // Add a header for the row labels
    const planDetailsHeader = document.createElement('th');
    planDetailsHeader.textContent = 'Plan Details';
    headerRow.appendChild(planDetailsHeader);

    // Add headers for each plan name
    plans.forEach(plan => {
        const th = document.createElement('th');
        th.textContent = plan.name;
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create tbody element
    const tbody = document.createElement('tbody');

    // Table rows data structure based on keys in plan object
    const keysToDisplay = ['charges', 'users_limit', 'simultaneous_connections_limit', 'credits'];

    // Generate rows based on plan properties
    keysToDisplay.forEach(key => {
        const tr = document.createElement('tr');
        const labelCell = document.createElement('td');
        labelCell.textContent = key.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase()); // Convert key to label format
        tr.appendChild(labelCell);

        plans.forEach(plan => {
            const td = document.createElement('td');
            let value;

            if (key === 'charges') {
                value = billingType === 'monthly' ? `€${plan.monthly_price}` : `€${plan.yearly_price}`;
            } else {
                value = plan[key];
            }

            td.textContent = value;
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });

    // Create buttons row
    const buttonRow = document.createElement('tr');
    const emptyCell = document.createElement('td');
    buttonRow.appendChild(emptyCell);

    plans.forEach(plan => {
        const td = document.createElement('td');
        const button = document.createElement('button');
        button.className = 'choose-btn';
        button.setAttribute('plan-id', plan.id);

        // Apply conditions from userData for button properties
        const isTrialUser = userData.user.sub?.is_trial_user || false;
        const currentPlanId = userData.user.sub?.id || null;
        const userRole = userData.user.role;
        const hasUsedTrial = userData.user.has_used_trial;

        // Apply conditions for button state and styles
        if (
            userRole === 'auth_user' ||
            userRole === 'contact' ||
            userRole === 'admin' ||
            (currentPlanId === plan.id && !isTrialUser)
        ) {
            button.disabled = true;
            // button.style.background = '#A4A4A4';
        } else {
            button.setAttribute('onclick', `choosePlan(${plan.id}, this)`);
            button.style.background = '#000000';
        }

        // Add spinner and text span elements
        const spinner = document.createElement('span');
        spinner.className = 'spinner-border spinner-border-sm hide';
        spinner.setAttribute('role', 'status');
        spinner.setAttribute('aria-hidden', 'true');
        button.appendChild(spinner);

        const btnText = document.createElement('span');
        btnText.className = 'btn-text';

        // console.log(currentPlanId != null && currentPlanId === plan.id && isTrialUser);

        // userData.user.sub != null && userData.user.sub.id == sub.id && userData.user.sub.is_trial_user == true

        // Set button text based on conditions
        if (currentPlanId == null && !hasUsedTrial) {
            btnText.textContent = 'Start Trial';
        } else if (currentPlanId != null && isTrialUser) {
            btnText.textContent = 'Choose';
        } else if (currentPlanId != null && currentPlanId === plan.id && isTrialUser) {
            btnText.textContent = 'Choose';
        } else if (currentPlanId != null && currentPlanId === plan.id) {
            btnText.textContent = 'Current';
        } else if (currentPlanId != null && hasUsedTrial) {
            btnText.textContent = 'Choose';
        } else {
            btnText.textContent = 'Choose';
        }

        button.appendChild(btnText);
        td.appendChild(button);
        buttonRow.appendChild(td);
    });

    tbody.appendChild(buttonRow);
    table.appendChild(tbody);

    // Append the constructed table to the container
    tableContainer.appendChild(table);
}


function updateButtonStates(plans, billingType, userData) {
    // Get the current plan ID and interval from user data
    const currentPlanId = userData.user.sub?.id || null;
    const currentPlanInterval = userData.user.sub?.current_plan?.toLowerCase() || 'monthly'; // Normalize to lowercase

    // Normalize the billingType to lowercase for comparison
    const normalizedBillingType = billingType.toLowerCase();

    plans.forEach(plan => {
        const button = document.querySelector(`button[plan-id="${plan.id}"]`);

        if (button) {
            // Check if the plan is the current plan and has a matching ID
            const isCurrentPlan = currentPlanId === plan.id;
            const isSameInterval = normalizedBillingType === currentPlanInterval;

            if (userData.user.role != 'auth_user' && userData.user.role != 'contact') {
                if (isCurrentPlan && userData.user.sub.is_trial_user == false) {
                    if (isSameInterval) {
                        // The current plan and interval match: show "Current" and disable the button
                        button.disabled = true;
                        button.style.background = '#transparent';
                        button.querySelector('.btn-text').textContent = 'Current';
                    } else {
                        // Current plan with a different interval: enable the button for switching
                        button.disabled = false;
                        button.style.background = '#000000';
                        button.querySelector('.btn-text').textContent = 'Choose';
                        button.setAttribute('onclick', `choosePlan(${plan.id}, this)`);
                    }
                } else {
                    // For other plans, ensure the button is enabled and shows "Choose"
                    button.disabled = false;
                    button.style.background = '#000000';
                    button.querySelector('.btn-text').textContent = 'Choose';
                    button.setAttribute('onclick', `choosePlan(${plan.id}, this)`);
                }
            }
        }
    });
}
