let activityUserTableContainer = document.querySelector('#activity-user-table-container-div');
let activityUserTable = document.querySelector('#activity-user-table');
let activityUserTablePagination = document.querySelector('#activity-user-pagination-container');
let tableLoader = document.querySelector('#table-loader');

let filterData = {
    "start_date": null,
    "end_date": null,
    "city": '',
    "country": '',
    "state": '',
    "region": '',
    "activity_users": [current_user_id],
    "action_type": ''
}

let activityUserDataObject = {"parent_user": parent_user, "page": 1, "q": '', "filter_data": filterData};
let pageNumber = 1;
let activityUserListUrl = `/action?perPage=20&search=&created_by=${current_user_id}`;

let relatedUsers = [];
let savedActivitiesData = [];

async function getRelatedUserList(url) {
    let token = getCookie('user_access');
    let headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
    let response = await requestAPI(`${apiURL}${url}`, null, headers, 'GET');
    response.json().then(function(res) {
        savedActivitiesData = res;
        getActivityUserList(savedActivitiesData);
        // populateActivityUserDropdown(relatedUsers);
    })
}

window.addEventListener('load', getRelatedUserList(activityUserListUrl));

async function getSharedUserList() {
    let token = getCookie('user_access');
    let headers = { "Authorization": `Bearer ${token}` };
    let response = await requestAPI(`${apiURL}/user/team`, null, headers, 'GET');
    response.json().then(function(res) {
        relatedUsers = [...res];
        populateActivityUserDropdown(relatedUsers);
    })
}

window.addEventListener('load', getSharedUserList);


async function getActivityUserList(object) {    
    tableLoader.classList.remove('hide');
    activityUserTableContainer.classList.add('hide');
    res = object;
    if (res.data) {
        let tableBody = activityUserTable.querySelector('tbody');
        tableBody.innerHTML = '';
        if (res.data.length > 0) {
            res.data.forEach((rec) => {
                let created_by_user = rec.created_by.id;
                if (created_by_user != null) {
                    tableBody.innerHTML += `<tr class="cursor-pointer"  data-id='${rec.id}'>
                                                <td>
                                                    <div><span class="table-text-overflow" title="${rec.profile.first_name}">${rec.profile.first_name}</span></div>
                                                </td>
                                                <td>
                                                    <div><span class="table-text-overflow" title="${rec.profile.last_name}">${rec.profile.last_name}</span></div>
                                                </td>
                                                <td>
                                                    <div><span class="table-text-overflow" title="${rec.profile.current_position}">${rec.profile.current_position}</span></div>
                                                </td>
                                                <td>
                                                    <div><span class="table-text-overflow" title="${rec.profile.company_name}">${rec.profile.company_name}</span></div>
                                                </td>
                                                <td>
                                                    <div><span class="table-text-overflow" title="${rec.profile.person_city}">${rec.profile.person_city}</span></div>
                                                </td>
                                                <td>
                                                    <div><span class="table-text-overflow text-capitalize" title="${captalizeFirstLetter(rec.action_type)}">${captalizeFirstLetter(rec.action_type)}</span></div>
                                                </td>
                                                <td>
                                                    <div><span class="table-text-overflow" title="${rec.created_by.first_name} ${rec.created_by.last_name}">${rec.created_by.first_name} ${rec.created_by.last_name}</span></div>
                                                </td>
                                                <td>
                                                    <div><span class="table-text-overflow">${convertDateFormat(rec.action_datetime)}</span></div>
                                                </td>
                                                <td>
                                                    <div class="actions">
                                                        <div onclick="getProfile(${rec.profile.id});" class="show-btn">
                                                            <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <circle cx="12" cy="12.5" r="3.3" stroke="#68759A" stroke-width="1.4"></circle>
                                                                <path d="M20.188 11.4343C20.5762 11.9056 20.7703 12.1412 20.7703 12.5C20.7703 12.8588 20.5762 13.0944 20.188 13.5657C18.7679 15.2899 15.6357 18.5 12 18.5C8.36427 18.5 5.23206 15.2899 3.81197 13.5657C3.42381 13.0944 3.22973 12.8588 3.22973 12.5C3.22973 12.1412 3.42381 11.9056 3.81197 11.4343C5.23206 9.71014 8.36427 6.5 12 6.5C15.6357 6.5 18.7679 9.71014 20.188 11.4343Z" stroke="#68759A" stroke-width="1.7"></path>
                                                            </svg>
                                                        </div>
                                                        <svg ${rec.created_by.id == current_user_id ? `onclick="openDeleteActionModal(event, 'delModal', ${rec.id})"` : 'class="opacity-point-3-5"'} class="cursor-pointer" width="23" height="22" viewBox="0 0 23 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M6.69531 19.25C6.19115 19.25 5.75955 19.0705 5.40052 18.7115C5.04149 18.3524 4.86198 17.9208 4.86198 17.4167V5.5H3.94531V3.66667H8.52865V2.75H14.0286V3.66667H18.612V5.5H17.6953V17.4167C17.6953 17.9208 17.5158 18.3524 17.1568 18.7115C16.7977 19.0705 16.3661 19.25 15.862 19.25H6.69531ZM15.862 5.5H6.69531V17.4167H15.862V5.5ZM8.52865 15.5833H10.362V7.33333H8.52865V15.5833ZM12.1953 15.5833H14.0286V7.33333H12.1953V15.5833Z" fill="#68759A"/>
                                                        </svg>
                                                    </div>
                                                </td>
                                            </tr>`
                }
            })
        }
        else {
            tableBody.innerHTML = `<tr>
                                        <td colspan="9" class="no-record-row" style="height: 35px; background: #FFFFFF">No Record Available</td>
                                    </tr>`
        }
        tableLoader.classList.add('hide');
        activityUserTableContainer.classList.remove('hide');
        activityUserTablePagination.classList.remove('hide');
        // generatePages(res.current_page, res.total_pages, res.has_previous, res.has_next, res.records_count || 0, res.start_record || 0, res.end_record || 0, 'activity-user');
        let pageStartEndRecords = getPageRecords(res.pagination);
        generatePages(res.pagination.currentPage, res.pagination.total, res.pagination.links.previous, res.pagination.links.next, res.pagination.count || 0, pageStartEndRecords.start || 0, pageStartEndRecords.end || 0, 'activity-user');
    }
}


function getProfile(record_id){
    location.pathname=`/specific-activity-profile/${record_id}/`;
}


function generatePages(currentPage, totalPages, has_previous, has_next, recordCount, startRecord, endRecord, type='activity-user') {
    const pagesContainer = document.getElementById(`${type}-pages-container`);
    let getFirstPageBtn = document.getElementById(`${type}-pagination-get-first-record-btn`);
    let getPreviousPageBtn = document.getElementById(`${type}-pagination-get-previous-record-btn`);
    let getNextPageBtn = document.getElementById(`${type}-pagination-get-next-record-btn`);
    let getLastPageBtn = document.getElementById(`${type}-pagination-get-last-record-btn`);

    document.querySelector(`#${type}-records-count`).innerText = recordCount || 0;
    document.querySelector(`#${type}-start-record`).innerText = startRecord || 0;
    document.querySelector(`#${type}-end-record`).innerText = endRecord || 0;

    pagesContainer.innerHTML = '';

    let startPage = Math.max(1, currentPage - 1);
    let endPage = Math.min(totalPages, startPage + 2);

    if (endPage - startPage < 2) {
        startPage = Math.max(1, endPage - 2);
    }

    if (startPage > 1) {
        pagesContainer.innerHTML += '<span class="cursor-pointer">1</span>';
        if (startPage > 2) {
            pagesContainer.innerHTML += '<span class="ellipsis-container">...</span>';
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        pagesContainer.innerHTML += `<span${i === currentPage ? ' class="active"' : ' class="cursor-pointer"'}>${i}</span>`;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            pagesContainer.innerHTML += '<span class="ellipsis-container">...</span>';
        }
        pagesContainer.innerHTML += `<span class="cursor-pointer">${totalPages}</span>`;
    }
    pagesContainer.querySelectorAll('span').forEach((span) => {
        if ((!span.classList.contains('active'))  && (!span.classList.contains('ellipsis-container'))) {
            let page = span.innerText;
            span.setAttribute("onclick", `getPage(${parseInt(page)})`);
        }
    })
    if (has_previous) {
        getFirstPageBtn.setAttribute('onclick', 'getPage(1)');
        getFirstPageBtn.classList.remove('opacity-point-3-5');
        getPreviousPageBtn.setAttribute('onclick', `getPage(${pageNumber - 1})`);
        getPreviousPageBtn.classList.remove('opacity-point-3-5');
    }
    else {
        getFirstPageBtn.removeAttribute('onclick');
        getFirstPageBtn.classList.add('opacity-point-3-5');
        getPreviousPageBtn.removeAttribute('onclick');
        getPreviousPageBtn.classList.add('opacity-point-3-5');
    }

    if (has_next) {
        getLastPageBtn.setAttribute('onclick', `getPage(${totalPages})`);
        getLastPageBtn.classList.remove('opacity-point-3-5');
        getNextPageBtn.setAttribute('onclick', `getPage(${pageNumber + 1})`);
        getNextPageBtn.classList.remove('opacity-point-3-5');
    }
    else {
        getLastPageBtn.removeAttribute('onclick');
        getLastPageBtn.classList.add('opacity-point-3-5');
        getNextPageBtn.removeAttribute('onclick');
        getNextPageBtn.classList.add('opacity-point-3-5');
    }
}


function getPage(page) {
    pageNumber = page;
    activityUserDataObject.page = page;
    activityUserListUrl = setParams(activityUserListUrl, 'page', page);
    getRelatedUserList(activityUserListUrl)
}


function openDeleteActionModal(event, modalId, id, created_by) {
    event.stopPropagation();
    let modal = document.querySelector(`#${modalId}`);
    let form = modal.querySelector("form");
    form.setAttribute("onsubmit", `deleteActionForm(event, ${id});`);
    modal.querySelector('#del-modal-header').innerText = 'Delete Action';
    modal.querySelector('#warning-statement').innerText = 'Are you sure you want to delete this action?';
    modal.addEventListener('hidden.bs.modal', event => {
        form.reset();
        form.removeAttribute("onsubmit");
        form.querySelector('button[type="submit"]').disabled = false;
        modal.querySelector('#del-modal-header').innerText = '';
        modal.querySelector('#warning-statement').innerText = '';
        modal.querySelector('.btn-text').innerText = 'Delete';
    })
    document.querySelector(`.${modalId}`).click();
}


async function deleteActionForm(event, record) {
    event.preventDefault();
    let form = event.currentTarget;
    let button = form.querySelector('button[type="submit"]');
    let buttonText = button.innerText;
    let errorMsg = form.querySelector('.delete-error-msg');
    try {
        errorMsg.innerText = '';
        errorMsg.classList.remove('active');

        let token = getCookie('user_access');
        let headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        };

        beforeLoad(button);
        let response = await requestAPI(`${apiURL}/action/${record}`, null, headers, "DELETE");
        if (response.status == 204) {
            afterLoad(button, 'Deleted');
            button.disabled = true;
            getRelatedUserList(activityUserListUrl)
            setTimeout(() => {
                document.querySelector(`.delModal`).click();
                button.disabled = false;
                afterLoad(button, 'Delete');
            }, 1200)
        }   
        else{
            afterLoad(button, buttonText);
            response.json().then(function(res) {
                errorMsg.innerText = res.message;
                errorMsg.classList.add('active');
            })
        }
    }
    catch (err) {
        console.log(err);
    }
}


async function searchForm(event) {
    event.preventDefault();
    let form = event.currentTarget;
    let formData = new FormData(form);
    let data = formDataToObject(formData);

    activityUserDataObject['q'] = data.keywords;
    activityUserListUrl = setParams(activityUserListUrl, 'search', data.keywords);
    getRelatedUserList(activityUserListUrl)
}


function convertDateFormat(dateStr) {
    try {
        // Extract date and time parts
        const [datePart, timePart] = dateStr.split(" ");
        const [day, month, year] = datePart.split("-").map(Number);
        const [time, meridian] = timePart.split(" ");
        let [hour, minutes] = time.split(":").map(Number);

        // Adjust hours for AM/PM
        if (meridian === "PM" && hour < 12) hour += 12;
        if (meridian === "AM" && hour === 12) hour = 0;

        // Create a valid date object
        const date = new Date(Date.UTC(year, month - 1, day, hour, minutes));

        // Format the output
        const formattedDay = String(date.getDate()).padStart(2, '0');
        const formattedMonth = String(date.getMonth() + 1).padStart(2, '0');
        const formattedYear = date.getFullYear();
        const formattedHour = String(date.getHours()).padStart(2, '0');
        const formattedMinutes = String(date.getMinutes()).padStart(2, '0');

        const formattedDate = `${formattedDay}-${formattedMonth}-${formattedYear} ${formattedHour}:${formattedMinutes}`;
        return formattedDate;
    } catch (err) {
        console.log(err);
        return dateStr;
    }
}


function getRelatedUserName(id) {
    const userData = relatedUsers.find(user => user.user__id === id);
    if (userData)
        return `${userData.user__first_name} ${userData.user__last_name}`;
    else
        return null;
}


// function populateActivityUserDropdown(relatedUsers) {
//     console.log(relatedUsers)
//     relatedUsers.forEach((user) => {
//         user.user__full_name = `${user.user__first_name} ${user.user__last_name}`;
//         activityUserListWrapper.innerHTML += `<div class="activity-user-list-item" data-id="${user.user__id}">
//                                                     <label class="cursor-pointer" for="activity-user-${user.user__id}">
//                                                         <span>${user.user__full_name}</span>
//                                                     </label>
//                                                     <div class="cursor-pointer">
//                                                         <input onchange="selectActivityUser(this);" ${user.user__id == current_user_id ? 'checked' : ''} type="checkbox" value="${user.user__id}" data-name="${user.user__full_name}" id="activity-user-${user.user__id}" data-id="${user.user__id}" name="activity_user" />
//                                                     </div>
//                                                 </div>`;
//     })
// }

function populateActivityUserDropdown(relatedUsers) {
    // Clear the wrapper before populating
    activityUserListWrapper.innerHTML = '';

    // Use a Set to track unique user IDs
    const uniqueUserIds = new Set();

    relatedUsers.forEach((user) => {
        // Check if the user ID is already in the Set
        if (!uniqueUserIds.has(user.id)) {
            uniqueUserIds.add(user.id); // Add the user ID to the Set

            // Generate the full name dynamically
            user.user__full_name = `${user.first_name} ${user.last_name}`;

            // Determine if the user should be checked by default
            const isChecked = user.id === current_user_id || selectedActivityUserIds.includes(user.id);

            // Append the new HTML structure for each unique user
            activityUserListWrapper.innerHTML += `
                <div class="activity-user-list-item" data-id="${user.id}">
                    <label class="cursor-pointer" for="activity-user-${user.id}">
                        <span>${user.user__full_name}</span>
                    </label>
                    <div class="cursor-pointer">
                        <input 
                            onchange="selectActivityUser(this);" 
                            type="checkbox" 
                            value="${user.id}" 
                            data-name="${user.user__full_name}" 
                            id="activity-user-${user.id}" 
                            data-id="${user.id}" 
                            name="activity_user" 
                            ${isChecked ? 'checked' : ''}
                        />
                    </div>
                </div>`;
            
            // Ensure the current user is selected by default in the arrays
            if (isChecked && !selectedActivityUserIds.includes(user.id)) {
                selectedActivityUserIds.push(user.id);
                selectedActivityUserNames.push(user.user__full_name);
            }
        }
    });
}



function searchUsersByName(query) {
    return relatedUsers
        .filter(user => user.user__full_name.toLowerCase().includes(query.toLowerCase()) && user.user__id != current_user_id)
        .map(user => user.user__id);
}