let relatedUserListContainer = document.querySelector('#related-user-list');


function openShareProfileModal(modalId, id) {
    let modal = document.querySelector(`#${modalId}`);
    let form = modal.querySelector("form");
    form.setAttribute("onsubmit", `shareProfileForm(event, ${id});`);
    modal.addEventListener('hidden.bs.modal', event => {
        form.reset();
        form.removeAttribute("onsubmit");
        modal.querySelector('.btn-text').innerText = 'Share';
        document.querySelector('.create-error-msg').classList.remove('active');
        document.querySelector('.create-error-msg').innerText = "";
    })
    document.querySelector(`.${modalId}`).click();
}


async function shareProfileForm(event, id) {
    event.preventDefault();
    let form = event.currentTarget;
    let formData = new FormData(form);
    let data = formDataToObject(formData);
    let errorMsg = form.querySelector('.create-error-msg');
    let button = form.querySelector('button[type="submit"]');
    let buttonText = button.innerText;

    console.log(data);
    if (!('related_user' in data)) {
        errorMsg.innerText = 'Please select a user.';
        errorMsg.classList.add('active');
        return false;
    }
    try {
        data.profile = id;
        data.users = [data.related_user];

        errorMsg.innerText = '';
        errorMsg.classList.remove('active');
        
        let token = getCookie('user_access');
        let headers = {
            "Authorization": `Bearer ${token}`,
            "Content-Type": 'application/json'
        };
        beforeLoad(button);
        let response = await requestAPI(`${apiURL}/share/candidate`, JSON.stringify(data), headers, "POST");
        response.json().then(function (res) {
            console.log(res);
            if (response.status == 200) {
                afterLoad(button, 'Shared');
                button.disabled = true;
                setTimeout(() => {
                    document.querySelector(`.shareProfileModal`).click();
                    button.disabled = false;
                    afterLoad(button, buttonText);
                }, 1200)
            } 
            else {
                afterLoad(button, buttonText);
                displayMessages(res, errorMsg);
                errorMsg.classList.add('active');
            }
        });
    } catch (err) {
        console.log(err);
    }
}