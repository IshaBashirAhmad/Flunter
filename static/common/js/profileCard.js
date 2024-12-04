async function toggleFavourite(element, id) {
    try {
        let token = getCookie('user_access');
        let headers = {
            "Authorization": `Bearer ${token}`,
            "Content-Type": 'application/json'
        };

        let response = await requestAPI(`${apiURL}/save/candidate`, JSON.stringify({ "candidate_profile": id }), headers, 'POST');
        const res = await response.json();
        
        if (response.status === 200) {
            if (location.pathname.includes('/saved-profiles')) {
                getSavedProfilesList(savedProfilesUrl);
                return;
            }
            if (element.classList.contains('saved')) {
                element.classList.remove("saved");
                element.setAttribute("onclick", `toggleFavourite(this, ${id})`);
                element.innerHTML = `
                    <rect width="36" height="36" rx="18" fill="#F8F9FD"/>
                    <g clip-path="url(#clip0_6518_3324)">
                        <path d="M21.7493 10.5C20.2993 10.5 18.9077 11.175 17.9993 12.2417C17.091 11.175 15.6993 10.5 14.2493 10.5C11.6827 10.5 9.66602 12.5167 9.66602 15.0833C9.66602 18.2333 12.4993 20.8 16.791 24.7L17.9993 25.7917L19.2077 24.6917C23.4993 20.8 26.3327 18.2333 26.3327 15.0833C26.3327 12.5167 24.316 10.5 21.7493 10.5ZM18.0827 23.4583L17.9993 23.5417L17.916 23.4583C13.9493 19.8667 11.3327 17.4917 11.3327 15.0833C11.3327 13.4167 12.5827 12.1667 14.2493 12.1667C15.5327 12.1667 16.7827 12.9917 17.2243 14.1333H18.7827C19.216 12.9917 20.466 12.1667 21.7493 12.1667C23.416 12.1667 24.666 13.4167 24.666 15.0833C24.666 17.4917 22.0493 19.8667 18.0827 23.4583Z" fill="#68759A"/>
                    </g>
                    <defs>
                        <clipPath id="clip0_6518_3324">
                            <rect width="20" height="20" fill="white" transform="translate(8 8)"/>
                        </clipPath>
                    </defs>
                `;
            } else {
                element.classList.add("saved");
                element.setAttribute("onclick", `toggleFavourite(this, ${id})`);
                element.innerHTML = `
                    <rect width="36" height="36" rx="18" fill="#EAE6FF"/>
                    <g clip-path="url(#clip0_6625_9286)">
                        <path d="M17.9993 25.7917L16.791 24.6917C12.4993 20.8 9.66602 18.2333 9.66602 15.0833C9.66602 12.5167 11.6827 10.5 14.2493 10.5C15.6993 10.5 17.091 11.175 17.9993 12.2417C18.9077 11.175 20.2993 10.5 21.7493 10.5C24.316 10.5 26.3327 12.5167 26.3327 15.0833C26.3327 18.2333 23.4993 20.8 19.2077 24.7L17.9993 25.7917Z" fill="#6E62E5"/>
                    </g>
                    <defs>
                        <clipPath id="clip0_6625_9286">
                            <rect width="20" height="20" fill="white" transform="translate(8 8)"/>
                        </clipPath>
                    </defs>
                `;
            }
        } else {
            console.log(res);
        }
    } catch (err) {
        console.log(err);
    }
}


async function showData(element, type, id) {
    try {
        let token = getCookie('user_access');
        let headers = {
            "Authorization": `Bearer ${token}`,
            "Content-Type": 'application/json'
        };

        let response = await requestAPI(`${apiURL}/contact/candidate/`, JSON.stringify({"field": type, "candidate_profile": id}), headers, 'POST');
        response.json().then(function(res) {
            if (response.status == 200) {
                element.classList.add("show-details");
                element.classList.remove('locked-details');
                element.removeAttribute('onclick');
                element.innerText = res.data[type];
                if ('action' in res.data);
                    insertNewAction(id, res.data);
            }
            else {
                console.log(res);
                showToast('', res.credits[0], 'danger-toast');
            }
        })
    }
    catch (err) {
        console.log(err);
    }
}


function createActionsHtml(actions, id) {
    // Create an array to hold the HTML strings for each action
    const htmlArray = actions.map(action => {
        const actionDate = getActionDateInLocalTimezone(action.action_datetime);
        const formattedDate = `${actionDate.getDate().toString().padStart(2, '0')}/${(actionDate.getMonth() + 1).toString().padStart(2, '0')}/${actionDate.getFullYear()} - ${actionDate.getHours().toString().padStart(2, '0')}:${actionDate.getMinutes().toString().padStart(2, '0')}`;

        // Return the HTML string for the action in the new table row format
        return `
            <tr class="cursor-pointer" data-action-id="${action.id}" data-value="${action.action_type}" onclick='openEditActionModal("addActionModal", ${action.id}, ${id}, "${action.created_by.first_name} ${action.created_by.last_name}")'>
                <td class="action-type-text">${captalizeFirstLetter(action.action_type)}</td>
                <td>${action.created_by.first_name} ${action.created_by.last_name}</td>
                <td class="action-type-date">${formattedDate}</td>
            </tr>
        `;
    });

    // Filter out any null values and join the remaining HTML strings
    const html = htmlArray.filter(htmlString => htmlString !== null).join('');

    return html;
}


function filterProfileActionType(element, id) {
    // Find the dropdown menu containing the clicked element
    let dropdown = element.closest('.action-type-dropdown-menu');
    if (!dropdown) {
        console.error("Dropdown menu not found");
        return;
    }

    // Remove the 'active' class from the previously active item
    let activeItem = dropdown.querySelector('.active');
    if (activeItem) {
        activeItem.classList.remove('active');
    }

    // Add the 'active' class to the clicked item
    element.classList.add('active');

    // Find the corresponding action list container
    let actionListContainer = document.querySelector(`#action-list-container-${id}`);
    if (!actionListContainer) {
        console.error("Action list container not found");
        return;
    }

    // Get the filter value from the clicked element
    let filterValue = element.getAttribute('data-value').toLowerCase();

    // Filter the rows within the action list
    actionListContainer.querySelectorAll('tr').forEach((row) => {
        let rowValue = row.getAttribute('data-value').toLowerCase();

        // Show or hide the row based on the filter value
        if (filterValue === 'all' || rowValue === filterValue) {
            row.classList.remove('hide');
        } else {
            row.classList.add('hide');
        }
    });
}

function insertNewAction(id, res) {
    const actionDate = getActionDateInLocalTimezone(res.action.action_datetime);

    if (!actionDate) {
        console.error("Failed to parse action_datetime:", res.action.action_datetime);
        return;
    }

    const formattedDate = `${actionDate.getDate().toString().padStart(2, '0')}/${(actionDate.getMonth() + 1).toString().padStart(2, '0')}/${actionDate.getFullYear()} - ${actionDate.getHours().toString().padStart(2, '0')}:${actionDate.getMinutes().toString().padStart(2, '0')}`;
    search_data.find(record => record.id == id).actions.splice(0, 0, res.action);
    
    let newAction = `
        <tr class="cursor-pointer" data-action-id="${res.action.id}" data-value="${res.action.action_type}" onclick='openEditActionModal("addActionModal", ${res.action.id}, ${id}, "${res.action.created_by.first_name} ${res.action.created_by.last_name}")'>
            <td class="action-type-text">${captalizeFirstLetter(res.action.action_type)}</td>
            <td>${res.action.created_by.first_name} ${res.action.created_by.last_name}</td>
            <td class="action-type-date">${formattedDate}</td>
        </tr>
    `;

    let actionCountDiv = document.querySelector(`#action-count-${id}`);
    actionCountDiv.innerText = parseInt(actionCountDiv.innerText) + 1;

    let actionParentDiv = document.querySelector(`#action-list-container-${id}`);
    let noActionDiv = actionParentDiv.querySelector('.no-actions');
    if (noActionDiv) noActionDiv.remove();

    actionParentDiv.insertAdjacentHTML('beforeend', newAction);
    document.getElementById(`action-filter-container-${id}`).querySelector('a[data-value="all"]').click();
}


function getActionDateInLocalTimezone(dateString) {
    const [datePart, timePart] = dateString.split(' ');

    // Extract day, month, year
    const [day, month, year] = datePart.split('-').map(Number);

    // Extract hours, minutes, and period (AM/PM)
    let [time, period] = timePart.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    // Convert hours to 24-hour format
    if (period === 'PM' && hours !== 12) {
        hours += 12;
    } else if (period === 'AM' && hours === 12) {
        hours = 0;
    }
    const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));
    return new Date(utcDate)
}


function parseCustomDate(dateString) {
    // Updated regex to handle optional Z at the end
    const regex = /^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2}) (\w{2})(Z)?$/;
    const match = dateString.match(regex);

    if (!match) {
        console.error("Invalid date format:", dateString);
        return null;
    }

    // Extract date and time components
    const [, day, month, year, hours, minutes, meridian] = match;

    // Convert to 24-hour format if needed
    let hour24 = parseInt(hours, 10);
    if (meridian === 'PM' && hour24 < 12) {
        hour24 += 12;
    } else if (meridian === 'AM' && hour24 === 12) {
        hour24 = 0;
    }

    // Create an ISO 8601 date string
    const isoString = `${year}-${month}-${day}T${hour24.toString().padStart(2, '0')}:${minutes}:00Z`;

    // Return a JavaScript Date object
    return new Date(isoString);
}


function closeCurrentModal() {
    let currentModal = document.querySelector('.modal.show'); // Get the currently open modal
    if (currentModal) {
        let bootstrapModal = bootstrap.Modal.getInstance(currentModal); // Get the Bootstrap modal instance
        bootstrapModal.hide(); // Hide the current modal
    }
}


function toggleSeeMore(button) {
    let container = button.closest(".skills-container");
    let hiddenSkills = container.querySelectorAll("span.hide");

    if (hiddenSkills.length > 0) {
        // Show hidden skills
        hiddenSkills.forEach(skill => {
            skill.classList.remove("hide");
        });
        button.querySelector("span").textContent = "See Less";
    } else {
        // Hide additional skills, excluding the action button
        let allSkills = container.querySelectorAll(".skills-container > span:not(:last-child)"); // Exclude the last span (action button)
        allSkills.forEach((skill, index) => {
            if (index >= 5) { // Adjust to the number of initially visible skills
                skill.classList.add("hide");
            }
        });
        button.querySelector("span").textContent = "See More";
    }
}


function toggleActions(button) {
    const container = button.closest(".actions-container");
    const actionBody = container.querySelector(".body");

    if (!actionBody) {
        console.error("No element with the class 'body' found inside '.actions-container'.");
        return;
    }

    // Toggle the 'open' class
    actionBody.classList.toggle("open");

    // Update button text based on the 'open' state
    const isOpen = actionBody.classList.contains("open");
    button.querySelector("span").textContent = isOpen ? "View fewer actions" : "View more actions";

    // Optionally, update the SVG icon orientation
    const svgIcon = button.querySelector("svg");
    if (svgIcon) {
        svgIcon.style.transform = isOpen ? "rotate(180deg)" : "rotate(0deg)";
        svgIcon.style.transition = "transform 0.3s ease";
    }
}