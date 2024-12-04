let myNeedsTableContainer = document.querySelector('#my-needs-table-container-div');
let myNeedsTable = document.querySelector('#my-needs-list-table');
let myNeedsTablePagination = document.querySelector('#my-needs-pagination-container');

let newNeedPaginationContainer = document.querySelector('#needs-search-pagination-container');

let selectedTableListType = 'new-need';
let tableLoader = document.querySelector('#table-loader');

let myNeedsDataObject = {"page": 1, "q": ''};
let pageNumber = 1;
let pageFromUrl = false;

let needInput = document.querySelector('input[name="need"]');

let locationInput = document.querySelector('input[name="location"]');
let locationDropdown = document.querySelector('#location-dropdown');
let locationTagContainer = document.querySelector('#location-tag-container');
let locationSelectionContainer = document.querySelector('#location-selection-container');

let jobTitleInput = document.querySelector('input[name="job_title"]');
let jobTitleDropdown = document.querySelector('#job-title-dropdown');
let jobTitleTagContainer = document.querySelector('#job-title-tag-container');
let jobTitleSelectionContainer = document.querySelector('#job-title-selection-container');

let skillsInput = document.querySelector('input[name="skills"]');
let skillsDropdown = document.querySelector('#skills-dropdown');
let skillsTagContainer = document.querySelector('#skills-tag-container');
let skillsSelectionContainer = document.querySelector('#skills-selection-container');

let companyInput = document.querySelector('input[name="company"]');
let companyDropdown = document.querySelector('#company-dropdown');
let companyTagContainer = document.querySelector('#company-tag-container');
let companySelectionContainer = document.querySelector('#company-selection-container');

let companyHeadcountInputs = document.querySelectorAll('input[name="company_size_filter"]');
let companyHeadcountDropdown = document.querySelector('#company-headcount-dropdown');
let companyHeadcountTagContainer = document.querySelector('#company-headcount-tag-container');
let companyHeadcountSelectionContainer = document.querySelector('#company-headcount-selection-container');

let seniorityLevelInputs = document.querySelectorAll('input[name="seniority_level"]');
let seniorityLevelDropdown = document.querySelector('#seniority-level-dropdown');
let seniorityLevelTagContainer = document.querySelector('#seniority-level-tag-container');
let seniorityLevelSelectionContainer = document.querySelector('#seniority-level-selection-container');

let errorMsg = document.querySelector('.search-error-msg');
let searchBtn = document.querySelector('#search-save-need-btn');
let headerRecordCountText = document.getElementById('header-record-text');
let detailsContainer = document.querySelector('.result-list');

let cityListContainer = document.getElementById('city-list');
let stateListContainer = document.getElementById('state-list');
let regionListContainer = document.getElementById('region-list');
let countryListContainer = document.getElementById('country-list');

let cityList = [];
let stateList = [];
let regionList = [];
let countryList = [];
let selectedLocations = [];
let currentFilter = '';

let selectedCityList = [];
let selectedStateList = [];
let selectedRegionList = [];
let selectedCountryList = [];
let selectedJobTitles = [];
let selectedSkills = [];
let selectedCompany = [];
let selectedCompanyHeadcount = [];
let selectedSeniorityLevels = [];

let locationTags = [];
let jobTitleTags = [];
let skillsTags = [];
let companyTags = [];
let companyHeadcountTags = [];
let seniorityLevelTags = [];

let requiredSearchDataURL = '/candidate/profiles?perPage=20&ordering=-percentage,-id';
let requiredNeedDataURL = '/needs?perPage=20';

let selectedStartDate = null;
let selectedEndDate = null;

let searchId = null;
let searchKeywords = {
    "name": '', "city": [], "state": [], "region": [], "country": [], "job_title": [], 
    "skills": [], "company": [], "head_count": [], "start_date": null, "end_date": null,
    "contact": '', "full_name": '', 'seniorities': [], "percentage": 0,
};
let relatedUsers = [];
let myNeedsRecords = {};


let startDate = flatpickr('#start-date-field', {
    dateFormat: "Z",
    altInput: true,
    altFormat: "d-m-Y",
    // maxDate: "today",
    onChange: function(selectedDates, dateStr, instance) {
        selectedStartDate = selectedDates[0] ? selectedDates[0] : null;
    },
});

document.getElementById('start-date-field').addEventListener('click', function(event) {
    event.preventDefault();
});


let endDate = flatpickr('#end-date-field', {
    dateFormat: "Z",
    altInput: true,
    altFormat: "d-m-Y",
    // maxDate: "today",
    onChange: function(selectedDates, dateStr, instance) {
        selectedEndDate = selectedDates[0] ? selectedDates[0] : null;
    },
});

document.getElementById('end-date-field').addEventListener('click', function(event) {
    event.preventDefault();
});


async function getSharedUserList() {
    let token = getCookie('user_access');
    let headers = { "Authorization": `Bearer ${token}` };
    let response = await requestAPI(`${apiURL}/user/team`, null, headers, 'GET');
    response.json().then(function(res) {
        relatedUsers = [...res];
        relatedUsers.forEach((user) => {
            if (user.id != userData.user.id) {
                document.querySelector('#related-user-list').innerHTML += `<div class="my-list-item">
                                                                                <input type="radio" id="related-user-${user.id}" value="${user.id}" name="related_user" />
                                                                                <label for="related-user-${user.id}">${user.first_name} ${user.last_name}</label>
                                                                            </div>`;
            }
        })
    })
}

window.addEventListener('load', getSharedUserList);


function initializeSearchFromURL() {
    const queryString = window.location.search;
    if (queryString != '') {
        const urlParams = new URLSearchParams(queryString);

        needInput.value = urlParams.get('name') || '';

        let jobList = urlParams.get('job_title').split(',') || [];
        let skillList = urlParams.get('skills').split(',') || [];
        let companies = urlParams.get('company').split(',') || [];

        selectedJobTitles.length = 0;
        jobTitleTags = jobTitleTags.filter(tag => tag.remove());
        jobList.forEach((job) => {
            if (!selectedJobTitles.includes(job)) {
                const newTag = createTag(job, jobTitleTags, selectedJobTitles, jobTitleTagContainer, jobTitleInput);
                selectedJobTitles.push(job);
                jobTitleTags.push(newTag);
            }
        })

        selectedSkills.length = 0;
        skillsTags = skillsTags.filter(tag => tag.remove());
        skillList.forEach((skill) => {
            if (!selectedSkills.includes(skill)) {
                const newTag = createTag(skill, skillsTags, selectedSkills, skillsTagContainer, skillsInput);
                selectedSkills.push(skill);
                skillsTags.push(newTag);
            }
        })

        locationTags = locationTags.filter(tag => tag.remove());

        let needCity = (urlParams.get('city') || '').split(',').filter(Boolean);
        selectedCityList.length = 0;
        needCity.forEach((loc) => {
            if (!selectedCityList.includes(loc)) {
                selectedCityList.push(loc);
                const newTag = createLocationTag(loc, 'city');
                locationTags.push(newTag);
            }
        })

        let needState = (urlParams.get('state') || '').split(',').filter(Boolean);
        selectedStateList.length = 0;
        needState.forEach((loc) => {
            if (!selectedStateList.includes(loc)) {
                selectedStateList.push(loc);
                const newTag = createLocationTag(loc, 'city');
                locationTags.push(newTag);
            }
        })

        let needRegion = (urlParams.get('region') || '').split(',').filter(Boolean);
        selectedRegionList.length = 0;
        needRegion.forEach((loc) => {
            if (!selectedRegionList.includes(loc)) {
                selectedRegionList.push(loc);
                const newTag = createLocationTag(loc, 'city');
                locationTags.push(newTag);
            }
        })

        let needCountry = (urlParams.get('country') || '').split(',').filter(Boolean);
        selectedCountryList.length = 0;
        needCountry.forEach((loc) => {
            if (!selectedCountryList.includes(loc)) {
                selectedCountryList.push(loc);
                const newTag = createLocationTag(loc, 'city');
                locationTags.push(newTag);
            }
        })

        selectedCompany.length = 0;
        companyTags = companyTags.filter(tag => tag.remove());
        companies.forEach((company) => {
            if (!selectedCompany.includes(company) && company != '') {
                const newTag = createTag(company, companyTags, selectedCompany, companyTagContainer, companyInput);
                selectedCompany.push(company);
                companyTags.push(newTag);
            }
        })

        let companySizeRange = urlParams.get('head_count').split(',') || [];
        selectedCompanyHeadcount.length = 0;
        companyHeadcountTags = companyHeadcountTags.filter(tag => tag.remove());
        companyHeadcountInputs.forEach(input => input.checked = false);
        companySizeRange.forEach((range) => {
            if (!selectedCompanyHeadcount.includes(range) && range != '') {
                document.querySelector(`input[name="company_size_filter"][value='${range}']`).click();
            }
        })

        const percentageInput = document.querySelector(`input[name="percentage_filter"][value="${urlParams.get('percentage') ? urlParams.get('percentage') : 0}"]`);
        if (percentageInput)
            percentageInput.checked = true;

        const contactInput = document.querySelector(`input[name="contact_details"][value="${urlParams.get('contact')}"]`);
        if (contactInput)
            contactInput.checked = true;

        startDate.setDate(urlParams.get('start_date'), true);
        if (urlParams.get('end_date')) {
            endDate.setDate(urlParams.get('end_date'), true);
        }
        else
            endDate.clear();

        let seniorityLevelFromURL = urlParams.get('seniorities').split(',') || [];
        selectedSeniorityLevels.length = 0;
        seniorityLevelTags = seniorityLevelTags.filter(tag => tag.remove());
        seniorityLevelInputs.forEach(input => input.checked = false);
        seniorityLevelFromURL.forEach((range) => {
            if (!selectedSeniorityLevels.includes(range) && range != '') {
                document.querySelector(`input[name="seniority_level"][value='${range}']`).click();
            }
        })
        
        changeNeedSection('new-need');
        document.querySelector('input[name="list_type_radio"][value="new_need"]').checked = true;

        pageNumber = parseInt(urlParams.get('page')) || 1;
        if ((pageNumber && pageNumber <= 0) || (pageNumber && pageNumber == NaN))
            pageNumber = 1;
        pageFromUrl = true;
        
        searchBtn.click();
    }
}

window.addEventListener('load', initializeSearchFromURL);


function populateLocationDropdown() {
    cityList = locationData['Unique Cities'];
    stateList = locationData['Unique States'];
    regionList = locationData['Unique Regions'];
    countryList = ['France'];
    
    loadMoreCities();
    renderList(stateListContainer, stateList, 'state');
    renderList(regionListContainer, regionList, 'region');
    renderList(countryListContainer, countryList, 'country');
}

window.addEventListener('load', populateLocationDropdown);


function selectLocation(event, element, type) {
    event.stopPropagation();
    let locationList = type == 'city' ? selectedCityList : type == 'state' ? selectedStateList : type == 'region' ? selectedRegionList : selectedCountryList;
    if (!locationList.includes(element.textContent)) {
        locationList.push(element.textContent);
        const newTag = createLocationTag(element.textContent, type);
        locationTags.push(newTag);   
    }
    locationInput.value = '';
    searchInLocationList();
    locationInput.focus();
}


function createLocationTag(text, type) {
    const tag = document.createElement("div");
    tag.classList.add("tag");
    let tagText = document.createElement("span");
    tagText.innerText = text;
    tag.appendChild(tagText);

    const removeBtn = document.createElement("span");
    removeBtn.classList.add("remove-tag");
    removeBtn.textContent = "x";
    removeBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        const index = locationTags.indexOf(tag);
        locationTags.splice(index, 1);
        if (type == 'city')
            selectedCityList = selectedCityList.filter((loc) => loc != removeBtn.previousElementSibling.innerText);
        else if (type == 'state')
            selectedStateList = selectedStateList.filter((loc) => loc != removeBtn.previousElementSibling.innerText);
        else if (type == 'region')
            selectedRegionList = selectedRegionList.filter((loc) => loc != removeBtn.previousElementSibling.innerText);
        else
            selectedCountryList = selectedCountryList.filter((loc) => loc != removeBtn.previousElementSibling.innerText);
        tag.remove();
        locationInput.focus();
    });

    tag.appendChild(removeBtn);
    locationTagContainer.appendChild(tag);

    return tag;
}


locationSelectionContainer.addEventListener('click', function() {
    locationDropdown.classList.remove('hide');
    locationInput.focus();
    // locationTagContainer.classList.remove('hide');
})

locationInput.addEventListener('keypress', function(event) {
    if (event.key == 'Enter')
        event.preventDefault();
});


function normalizeText(text) {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}


function debounce(func, wait) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

const debouncedSearch = debounce(searchInLocationList, 300);
locationInput.addEventListener('input', debouncedSearch);

function filterList(inputText, list) {
    let hyphenatedText = inputText.replace(' ', '-');
    let unhyphenatedText = inputText.replace('-', ' ');

    return list.filter(item => {
        let normalizedItem = normalizeText(item.toLowerCase());
        return normalizedItem.includes(inputText) || normalizedItem.includes(hyphenatedText) || normalizedItem.includes(unhyphenatedText);
    });
}

function searchInLocationList() {
    currentFilter = normalizeText(locationInput.value.toLowerCase());
    if (currentFilter === '') {
        cityListContainer.innerHTML = '';
        stateListContainer.innerHTML = '';
        regionListContainer.innerHTML = '';
        countryListContainer.innerHTML = '';
        cityStartIndex = 0;
        loadMoreCities();
        renderList(stateListContainer, stateList, 'state');
        renderList(regionListContainer, regionList, 'region');
        renderList(countryListContainer, countryList, 'country');
    } else {
        renderFilteredLists();
    }
}

function renderFilteredLists() {
    let filteredCityList = filterList(currentFilter, cityList);
    let filteredStateList = filterList(currentFilter, stateList);
    let filteredRegionList = filterList(currentFilter, regionList);
    let filteredCountryList = filterList(currentFilter, countryList);

    renderList(cityListContainer, filteredCityList, 'city');
    renderList(stateListContainer, filteredStateList, 'state');
    renderList(regionListContainer, filteredRegionList, 'region');
    renderList(countryListContainer, filteredCountryList, 'country');
}

function renderList(container, list, type) {
    container.innerHTML = '';
    list.forEach(item => {
        const span = document.createElement('span');
        span.setAttribute('onclick', `selectLocation(event, this, '${type}')`);
        span.setAttribute('data-type', type);
        span.textContent = item;
        container.appendChild(span);
    });
}


let cityStartIndex = 0;
const batchSize = 20;

function loadMoreItems(container, list, start, end) {
    for (let i = start; i < end; i++) {
        if (i >= list.length) break;
        const span = document.createElement('span');
        span.setAttribute('onclick', "selectLocation(event, this, 'city')");
        span.textContent = list[i];
        container.appendChild(span);
    }
}

function loadMoreCities() {
    let listToLoad = currentFilter ? filterList(currentFilter, cityList) : cityList;
    loadMoreItems(cityListContainer, listToLoad, cityStartIndex, cityStartIndex + batchSize);
    cityStartIndex += batchSize;
}

cityListContainer.addEventListener('scroll', () => {
    if (cityListContainer.scrollTop + cityListContainer.clientHeight >= cityListContainer.scrollHeight) {
        loadMoreCities();
    }
});


jobTitleSelectionContainer.addEventListener('click', function() {
    jobTitleDropdown.classList.remove('hide');
    jobTitleInput.focus();
})

jobTitleInput.addEventListener('keypress', function(event) {
    if (event.key == 'Enter')
        event.preventDefault();
});


function createTag(text, tagsList, selectedList, container, inputField, type = null) {
    const tag = document.createElement("div");
    tag.classList.add("tag");

    // Add the text span
    const tagText = document.createElement("span");
    tagText.classList.add("text");
    tagText.innerText = text;
    tag.appendChild(tagText);

    // Add the remove button (SVG version)
    const removeBtn = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    removeBtn.classList.add("remove");
    removeBtn.setAttribute("width", "10");
    removeBtn.setAttribute("height", "10");
    removeBtn.setAttribute("viewBox", "0 0 10 10");
    removeBtn.setAttribute("fill", "none");
    removeBtn.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    // Add the path element to the SVG
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M7.5 2.5L2.5 7.5M2.5 2.5L7.5 7.5");
    path.setAttribute("stroke", "#392680");
    path.setAttribute("stroke-width", "1.2");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");

    // Append the path to the SVG
    removeBtn.appendChild(path);

    // Add the remove button functionality
    removeBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        const index = tagsList.indexOf(tag);
        tagsList.splice(index, 1);
        selectedList.splice(index, 1);
        tag.remove();
        if (type) inputField.checked = false;
        inputField.focus();
    });

    // Append the remove button to the tag
    tag.appendChild(removeBtn);

    // Append the tag to the container
    container.appendChild(tag);

    return tag;
}


jobTitleInput.addEventListener('keypress', function(event) {
    if (event.key == 'Enter' && this.value.trim().length > 0 && !selectedJobTitles.includes(this.value)) {
        const newTag = createTag(this.value, jobTitleTags, selectedJobTitles, jobTitleTagContainer, this);
        selectedJobTitles.push(this.value);
        jobTitleTags.push(newTag);

        this.value = '';
        this.focus();
    }
});


skillsInput.addEventListener('keypress', function(event) {
    if (event.key == 'Enter' && this.value.trim().length > 0 && !selectedSkills.includes(this.value)) {
        const newTag = createTag(this.value, skillsTags, selectedSkills, skillsTagContainer, this);
        selectedSkills.push(this.value);
        skillsTags.push(newTag);

        this.value = '';
        this.focus();
    }
});

skillsSelectionContainer.addEventListener('click', function() {
    skillsDropdown.classList.remove('hide');
    skillsInput.focus();
})

skillsInput.addEventListener('keypress', function(event) {
    if (event.key == 'Enter')
        event.preventDefault();
});


companyInput.addEventListener('keypress', function(event) {
    if (event.key == 'Enter' && this.value.trim().length > 0 && !selectedCompany.includes(this.value)) {
        const newTag = createTag(this.value, companyTags, selectedCompany, companyTagContainer, this);
        selectedCompany.push(this.value);
        companyTags.push(newTag);

        this.value = '';
        this.focus();
    }
});

companySelectionContainer.addEventListener('click', function() {
    companyDropdown.classList.remove('hide');
    companyInput.focus();
})

companyInput.addEventListener('keypress', function(event) {
    if (event.key == 'Enter')
        event.preventDefault();
});


companyHeadcountInputs.forEach((input) => {
    input.addEventListener('change', function() {
        if (input.checked) {
            const newTag = createTag(input.value, companyHeadcountTags, selectedCompanyHeadcount, companyHeadcountTagContainer, input, 'checkbox');
            selectedCompanyHeadcount.push(this.value);
            companyHeadcountTags.push(newTag);
        }
        else {
            const index = selectedCompanyHeadcount.indexOf(input.value);
            selectedCompanyHeadcount.splice(index, 1);
            let temp = companyHeadcountTags.splice(index, 1);
            temp[0].remove();
        }
    })
})

companyHeadcountSelectionContainer.addEventListener('click', function() {
    companyHeadcountDropdown.classList.remove('hide');
})


seniorityLevelInputs.forEach((input) => {
    input.addEventListener('change', function() {
        if (input.checked) {
            const newTag = createTag(captalizeFirstLetter(input.value), seniorityLevelTags, selectedSeniorityLevels, seniorityLevelTagContainer, input, 'checkbox');
            selectedSeniorityLevels.push(this.value);
            seniorityLevelTags.push(newTag);
        }
        else {
            const index = selectedSeniorityLevels.indexOf(input.value);
            selectedSeniorityLevels.splice(index, 1);
            let temp = seniorityLevelTags.splice(index, 1);
            temp[0].remove();
        }
    })
})

seniorityLevelSelectionContainer.addEventListener('click', function() {
    seniorityLevelDropdown.classList.remove('hide');
})


function closeContainers(event) {
    if (!(locationInput.contains(event.target)) && !(locationDropdown.contains(event.target)) && !(locationTagContainer.contains(event.target)) && !(locationSelectionContainer.contains(event.target)) && !(locationDropdown.classList.contains('hide'))) {
        locationDropdown.classList.add('hide');
    }
    if (!(jobTitleInput.contains(event.target)) && !(jobTitleDropdown.contains(event.target)) && !(jobTitleTagContainer.contains(event.target)) && !(jobTitleSelectionContainer.contains(event.target)) && !(jobTitleDropdown.classList.contains('hide'))) {
        jobTitleDropdown.classList.add('hide');
    }
    if (!(skillsInput.contains(event.target)) && !(skillsDropdown.contains(event.target)) && !(skillsTagContainer.contains(event.target)) && !(skillsSelectionContainer.contains(event.target)) && !(skillsDropdown.classList.contains('hide'))) {
        skillsDropdown.classList.add('hide');
    }
    if (!(companyInput.contains(event.target)) && !(companyDropdown.contains(event.target)) && !(companyTagContainer.contains(event.target)) && !(companySelectionContainer.contains(event.target)) && !(companyDropdown.classList.contains('hide'))) {
        companyDropdown.classList.add('hide');
    }
    if (!(companyHeadcountDropdown.contains(event.target)) && !(companyHeadcountTagContainer.contains(event.target)) && !(companyHeadcountSelectionContainer.contains(event.target)) && !(companyHeadcountDropdown.classList.contains('hide'))) {
        companyHeadcountDropdown.classList.add('hide');
    }
    if (!(seniorityLevelDropdown.contains(event.target)) && !(seniorityLevelTagContainer.contains(event.target)) && !(seniorityLevelSelectionContainer.contains(event.target)) && !(seniorityLevelDropdown.classList.contains('hide'))) {
        seniorityLevelDropdown.classList.add('hide');
    }
}

document.body.addEventListener('click', closeContainers);


function changeNeedSection(listType) {
    if (listType == 'new-need') {
        selectedTableListType = 'new-need';
        document.querySelector('.new-need-content-container').classList.remove('hide');
        myNeedsTableContainer.classList.add('hide');
        myNeedsTablePagination.classList.add('hide');
    }
    else if (listType == 'my-needs') {
        selectedTableListType = 'my-needs';
        document.querySelector('.new-need-content-container').classList.add('hide');
        myNeedsTableContainer.classList.remove('hide');
        myNeedsTablePagination.classList.remove('hide');
    }
}


function convertDateFormat(dateStr) {
    try {
        const date = new Date(dateStr);

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        const formattedDate = `${day}/${month}/${year}`;
        return formattedDate;
    }
    catch (err) {
        console.log(err);
        return dateStr;
    }
}


function showProgress() {
    searchBtn.disabled = true;
    searchBtn.classList.add('opacity-point-2');
    document.getElementById('no-results').classList.add('hide');
    document.getElementById('result-found-container').classList.add('hide');
    document.getElementById('search-progress-container').classList.remove('hide');
}

function hideProgress(){
    searchBtn.disabled = false;
    searchBtn.classList.remove('opacity-point-2');
    document.getElementById('search-progress-container').classList.add('hide');
    document.getElementById('result-found-container').classList.remove('hide');
}


function toggleSkillVisibility(event, isShow=true) {
    let skillListContainer = event.target.closest('.skill-list');
    if (isShow) {
        skillListContainer.querySelectorAll('.skill.hide').forEach(element => {
            element.classList.remove('hide');
        });
        event.target.classList.add('hide');
        event.target.nextElementSibling.classList.remove('hide');
    }
    else {
        skillListContainer.querySelectorAll('.skill[data-status="hide"]').forEach(element => {
            element.classList.add('hide');
        });
        event.target.classList.add('hide');
        event.target.previousElementSibling.classList.remove('hide');
    }
}


async function needForm(event) {
    event.preventDefault();
    let form = event.currentTarget;
    let formData = new FormData(form);
    let data = formDataToObject(formData);
    formData.append('search_id', searchId);

    if (userData.user.sub == null) {
        errorMsg.innerText = 'Please select your plan to proceed.';
        errorMsg.classList.add('active');
        return false;
    }
    // if (data.need.trim().length == 0) {
    //     errorMsg.innerText = 'Please specify the need name.';
    //     errorMsg.classList.add('active');
    //     return false;
    // }
    if (selectedJobTitles.length == 0) {
        errorMsg.innerText = 'Please select atleast one job title.';
        errorMsg.classList.add('active');
        return false;
    }
    if (selectedSkills.length == 0) {
        errorMsg.innerText = 'Please select atleast one skill.';
        errorMsg.classList.add('active');
        return false;
    }
    if (selectedCityList.length == 0 && selectedStateList.length == 0 && selectedRegionList.length == 0 && selectedCountryList.length == 0) {
        errorMsg.innerText = 'Please select atleast one location.';
        errorMsg.classList.add('active');
        return false;
    }
    if (selectedStartDate == null) {
        errorMsg.innerText = 'Please select the start date.';
        errorMsg.classList.add('active');
        return false;
    }
    if (selectedEndDate != null && selectedStartDate >= selectedEndDate) {
        errorMsg.innerText = 'End date cannot be on or before start date.';
        errorMsg.classList.add('active');
        return false;
    }

    const percentageCheckedInput = document.querySelector('input[name="percentage_filter"]:checked');
    let percentageCheckedInputValue = parseInt(percentageCheckedInput ? percentageCheckedInput.value : 0);

    const contactCheckedInput = document.querySelector('input[name="contact_details"]:checked');
    let contactCheckedInputValue = contactCheckedInput ? contactCheckedInput.value : '';

    if (searchKeywords['name'] !== data.need || !arraysEqualIgnoreOrder(searchKeywords['city'], [...selectedCityList]) || !arraysEqualIgnoreOrder(searchKeywords['state'], [...selectedStateList]) || !arraysEqualIgnoreOrder(searchKeywords['region'], [...selectedRegionList]) || !arraysEqualIgnoreOrder(searchKeywords['country'], [...selectedCountryList]) || !arraysEqualIgnoreOrder(searchKeywords['job_title'], [...selectedJobTitles]) || !arraysEqualIgnoreOrder(searchKeywords['skills'], [...selectedSkills]) || !arraysEqualIgnoreOrder(searchKeywords['company'], [...selectedCompany]) || !arraysEqualIgnoreOrder(searchKeywords['head_count'], [...selectedCompanyHeadcount]) || !arraysEqualIgnoreOrder(searchKeywords['contact'], contactCheckedInputValue) || !arraysEqualIgnoreOrder(searchKeywords['seniorities'], [...selectedSeniorityLevels]) || searchKeywords['percentage'] != percentageCheckedInputValue || selectedStartDate.getTime() != searchKeywords['start_date'].getTime() || ((selectedEndDate != null || searchKeywords['end_date'] != null) && !(selectedEndDate != null && searchKeywords['end_date'] != null && selectedEndDate.getTime() == searchKeywords['end_date'].getTime()))) {
        searchKeywords = {
            "name": data.need, "city": [...selectedCityList], "state": [...selectedStateList], "region": [...selectedRegionList], 
            "country": [...selectedCountryList], "job_title": [...selectedJobTitles], "skills": [...selectedSkills], 
            "company": [...selectedCompany], "head_count": [...selectedCompanyHeadcount], "contact": contactCheckedInputValue, 
            "seniorities": [...selectedSeniorityLevels], "percentage": percentageCheckedInputValue, 
            "start_date": selectedStartDate, "end_date": selectedEndDate
        };
        searchId = null;
    }

    requiredSearchDataURL = setParams(requiredSearchDataURL, 'city', selectedCityList.join(',') || '');
    requiredSearchDataURL = setParams(requiredSearchDataURL, 'state', selectedStateList.join(',') || '');
    requiredSearchDataURL = setParams(requiredSearchDataURL, 'region', selectedRegionList.join(',') || '');
    requiredSearchDataURL = setParams(requiredSearchDataURL, 'country', selectedCountryList.join(',') || '');
    requiredSearchDataURL = setParams(requiredSearchDataURL, 'current_position', searchKeywords.job_title.join(',') || '');
    requiredSearchDataURL = setParams(requiredSearchDataURL, 'person_skills', searchKeywords.skills.join(',') || '');
    requiredSearchDataURL = setParams(requiredSearchDataURL, 'company_name', searchKeywords.company.join(',') || '');
    requiredSearchDataURL = setParams(requiredSearchDataURL, 'employee_headcount', searchKeywords.head_count.join(',') || '');
    requiredSearchDataURL = setParams(requiredSearchDataURL, 'seniority', searchKeywords.seniorities.join(',') || '');
    requiredSearchDataURL = setParams(requiredSearchDataURL, 'percentage', searchKeywords.percentage || '');
    requiredSearchDataURL = setParams(requiredSearchDataURL, 'contact', searchKeywords.contact || '');
    
    if (pageFromUrl) {
        searchKeywords.page = pageNumber;
        pageFromUrl = false;
        requiredSearchDataURL = setParams(requiredSearchDataURL, 'page', pageNumber);
    }
    else {
        searchKeywords.page = 1;
        requiredSearchDataURL = setParams(requiredSearchDataURL, 'page', 1);
    }

    errorMsg.innerText = '';
    errorMsg.classList.remove('active');
    getRecords(requiredSearchDataURL);
}


async function getRecords(url) {
    searchKeywords.page = pageNumber;
    try {
        let temp = url.split(`api`);
        url = temp.length > 1 ? temp[1] : temp[0];

        let token = getCookie('user_access');
        let headers = { "Authorization": `Bearer ${token}` };
        showProgress();
        let response = await requestAPI(`${apiURL}${url}`, null, headers, "GET");
        if (response.headers.get('content-type').includes('application/json')) {
            let res = await response.json();
            if (response.status == 200) {
                hideProgress();
                // if (searchId == null) {
                //     createNeedSearch(searchKeywords);
                // }
                search_data = res.data;

                let pageStartEndRecords = getPageRecords(res.pagination);
                headerRecordCountText.innerText = res.pagination.count || 0;

                detailsContainer.innerHTML = ''; 
                search_data.forEach((obj, index)=> {
                    let itemDiv = document.createElement('div');
                    let skillsHTML = '';
                    if (obj.person_skills == null) {
                        skillsHTML = '<span style="font-size: .75rem">No skills available</span>';
                    }
                    else {
                        skillsHTML = obj.person_skills.map((skill, index) => {
                            return `
                                <span class="skill ${index >= 4 ? 'hide' : ''}" >${skill.trim()}</span>
                            `;
                        }).join('');
                    }

                    if (obj.actions.length == 0) {
                        actionListHTML = '<tr class="no-actions" ><td colspan="3" class="no-actions-found">No Actions Found</td></tr>';
                    }
                    else {
                        actionListHTML = createActionsHtml(obj.actions, obj.id);
                    }
                    
                    itemDiv.innerHTML = `
                    <section class="profile-card">
                        <div class="header">
                            <div class="info">
                                <div class="profile-img">
                                    <img src="${obj.person_image_url ? obj.person_image_url : '/media/default-profile.png'}">
                                    <div class="matching-percentage">${obj.percentage < 60 ? '<60' : roundDecimalPlaces(obj.percentage, 0)}%</div>
                                </div>
                                <div class="about-headline">
                                    <div class="about">
                                        <span class="name">${obj.full_name}</span>
                                         <a class="text-decoration-none link-btn linkedin ${obj.person_linkedin_url == null || obj.person_linkedin_url.trim().length == 0 ? 'opacity-point-3': ''}" ${obj.person_linkedin_url == null || obj.person_linkedin_url.trim().length == 0 ? 'href="javascript:void(0);" ': `href="${obj.person_linkedin_url}" referrerpolicy="no-referrer" target="_blank"`}>
                                            <svg width="14" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <g clip-path="url(#clip0_4194_1573)">
                                                    <path d="M12.9637 0.5H1.03359C0.462109 0.5 0 0.951172 0 1.50898V13.4883C0 14.0461 0.462109 14.5 1.03359 14.5H12.9637C13.5352 14.5 14 14.0461 14 13.491V1.50898C14 0.951172 13.5352 0.5 12.9637 0.5ZM4.15352 12.4301H2.07539V5.74726H4.15352V12.4301ZM3.11445 4.83672C2.44727 4.83672 1.90859 4.29805 1.90859 3.63359C1.90859 2.96914 2.44727 2.43047 3.11445 2.43047C3.77891 2.43047 4.31758 2.96914 4.31758 3.63359C4.31758 4.29531 3.77891 4.83672 3.11445 4.83672ZM11.9301 12.4301H9.85469V9.18164C9.85469 8.40781 9.84101 7.40977 8.77461 7.40977C7.69453 7.40977 7.53047 8.25469 7.53047 9.12695V12.4301H5.45781V5.74726H7.44844V6.66055H7.47578C7.75195 6.13555 8.43008 5.58047 9.43906 5.58047C11.5418 5.58047 11.9301 6.96406 11.9301 8.76328V12.4301Z" fill="#0063BF"/>
                                                </g>
                                                <defs>
                                                    <clipPath id="clip0_4194_1573">
                                                        <rect width="14" height="14" fill="white" transform="translate(0 0.5)"/>
                                                    </clipPath>
                                                </defs>
                                            </svg>
                                        </a>
                                         <a class="text-decoration-none link-btn linkedin ${obj.person_facebook_url == null || obj.person_facebook_url.trim().length == 0 ? 'opacity-point-3': ''}" ${obj.person_facebook_url == null || obj.person_facebook_url.trim().length == 0 ? 'href="javascript:void(0);" ': `href="${obj.person_facebook_url}" referrerpolicy="no-referrer" target="_blank"`}>
                                            <svg width="14" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <g clip-path="url(#clip0_4194_1574)">
                                                    <path d="M7 0.5C10.866 0.5 14 3.63401 14 7.49999C14 11.0789 11.3141 14.0301 7.84806 14.4487V9.63908L9.7417 9.63908L10.1345 7.5H7.84806V6.74346C7.84806 6.17827 7.95892 5.78698 8.21325 5.53699C8.4676 5.28699 8.86543 5.17829 9.43933 5.17829C9.58458 5.17829 9.71828 5.17974 9.83691 5.18263C10.0095 5.18683 10.1501 5.19408 10.248 5.20439V3.26528C10.2089 3.25441 10.1627 3.24354 10.1109 3.23284C9.9937 3.20859 9.84796 3.18522 9.69128 3.1647C9.36387 3.12181 8.98875 3.09134 8.72631 3.09134C7.6664 3.09134 6.86537 3.3181 6.30624 3.78778C5.63143 4.35461 5.30896 5.27529 5.30896 6.57826V7.49999H3.86551V9.63908H5.30896V14.2939C2.26002 13.5374 0 10.7829 0 7.49999C0 3.63401 3.13401 0.5 7 0.5Z" fill="#0B66FF"/>
                                                </g>
                                                <defs>
                                                    <clipPath id="clip0_4194_1574">
                                                        <rect width="14" height="14" fill="white" transform="translate(0 0.5)"/>
                                                    </clipPath>
                                                </defs>
                                            </svg>
                                        </a>
                                        <a href="javascript:void(0);" class="link-btn opacity-point-3">
                                            <svg width="14" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <g clip-path="url(#clip0_4194_1575)">
                                                    <path d="M4.68266 11.7728C4.68266 11.8307 4.61774 11.877 4.53589 11.877C4.44274 11.8857 4.37782 11.8394 4.37782 11.7728C4.37782 11.7149 4.44274 11.6686 4.5246 11.6686C4.60927 11.6599 4.68266 11.7062 4.68266 11.7728ZM3.80484 11.6425C3.78508 11.7004 3.84153 11.767 3.92621 11.7844C3.9996 11.8133 4.08427 11.7844 4.10121 11.7265C4.11814 11.6686 4.06452 11.602 3.97984 11.5759C3.90645 11.5557 3.8246 11.5846 3.80484 11.6425ZM5.05242 11.5933C4.97056 11.6136 4.91411 11.6686 4.92258 11.7351C4.93105 11.793 5.00444 11.8307 5.08911 11.8104C5.17097 11.7901 5.22742 11.7351 5.21895 11.6772C5.21048 11.6222 5.13427 11.5846 5.05242 11.5933ZM6.90968 0.5C2.99476 0.5 0 3.54834 0 7.56358C0 10.774 1.97016 13.5213 4.78427 14.4882C5.14556 14.5548 5.27258 14.3261 5.27258 14.1379C5.27258 13.9584 5.26411 12.9684 5.26411 12.3604C5.26411 12.3604 3.28831 12.7947 2.87339 11.4978C2.87339 11.4978 2.55161 10.6553 2.08871 10.4382C2.08871 10.4382 1.44234 9.98372 2.13387 9.99241C2.13387 9.99241 2.83669 10.0503 3.22339 10.7393C3.84153 11.8567 4.87742 11.5354 5.28105 11.3443C5.34597 10.8811 5.52944 10.5598 5.73266 10.3687C4.15484 10.1893 2.5629 9.95478 2.5629 7.16987C2.5629 6.37377 2.77742 5.97427 3.22903 5.46477C3.15565 5.2766 2.91573 4.50077 3.30242 3.49913C3.89234 3.31096 5.25 4.28075 5.25 4.28075C5.81452 4.11864 6.42137 4.03468 7.02258 4.03468C7.62379 4.03468 8.23065 4.11864 8.79516 4.28075C8.79516 4.28075 10.1528 3.30806 10.7427 3.49913C11.1294 4.50366 10.8895 5.2766 10.8161 5.46477C11.2677 5.97717 11.5444 6.37667 11.5444 7.16987C11.5444 9.96346 9.88186 10.1864 8.30403 10.3687C8.56371 10.5974 8.78387 11.0317 8.78387 11.712C8.78387 12.6876 8.7754 13.8947 8.7754 14.1321C8.7754 14.3203 8.90524 14.549 9.26371 14.4824C12.0863 13.5213 14 10.774 14 7.56358C14 3.54834 10.8246 0.5 6.90968 0.5ZM2.74355 10.4845C2.70685 10.5135 2.71532 10.5801 2.76331 10.6351C2.80847 10.6814 2.87339 10.7017 2.91008 10.664C2.94677 10.6351 2.93831 10.5685 2.89032 10.5135C2.84516 10.4672 2.78024 10.4469 2.74355 10.4845ZM2.43871 10.2501C2.41895 10.2877 2.44718 10.334 2.50363 10.363C2.54879 10.3919 2.60524 10.3832 2.625 10.3427C2.64476 10.3051 2.61653 10.2587 2.56008 10.2298C2.50363 10.2124 2.45847 10.2211 2.43871 10.2501ZM3.35323 11.2806C3.30806 11.3183 3.325 11.4051 3.38992 11.4601C3.45484 11.5267 3.53669 11.5354 3.57339 11.4891C3.61008 11.4514 3.59315 11.3646 3.53669 11.3096C3.4746 11.243 3.38992 11.2343 3.35323 11.2806ZM3.03145 10.8551C2.98629 10.884 2.98629 10.9593 3.03145 11.0259C3.07661 11.0925 3.15282 11.1214 3.18952 11.0925C3.23468 11.0548 3.23468 10.9796 3.18952 10.913C3.15 10.8464 3.07661 10.8175 3.03145 10.8551Z" fill="#212328"/>
                                                </g>
                                                <defs>
                                                    <clipPath id="clip0_4194_1575">
                                                        <rect width="14" height="14" fill="white" transform="translate(0 0.5)"/>
                                                    </clipPath>
                                                </defs>
                                            </svg>
                                        </a>
                                        <a href="javascript:void(0);" class="link-btn opacity-point-3">
                                            <svg width="14" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M10.7305 4.59624C10.2669 4.59715 9.89001 4.22179 9.88911 3.7582C9.8882 3.29461 10.2636 2.91767 10.7274 2.91676C11.1912 2.91585 11.5681 3.29143 11.569 3.75502C11.5697 4.21861 11.1943 4.59533 10.7305 4.59624Z" fill="black"/>
                                                <path fill-rule="evenodd" clip-rule="evenodd" d="M7.00669 11.0939C5.02197 11.0978 3.40964 9.49201 3.40579 7.5068C3.40193 5.52205 5.00812 3.90947 6.99286 3.90562C8.97805 3.90176 10.5906 5.50844 10.5945 7.49297C10.5983 9.47818 8.99165 11.0901 7.00669 11.0939ZM6.99536 5.16687C5.70713 5.16914 4.6643 6.21584 4.66657 7.50431C4.66906 8.79301 5.71598 9.83562 7.0042 9.83313C8.29288 9.83063 9.33572 8.78416 9.33321 7.49546C9.33072 6.20676 8.28382 5.16438 6.99536 5.16687Z" fill="black"/>
                                                <path fill-rule="evenodd" clip-rule="evenodd" d="M2.40287 0.877113C2.8474 0.702928 3.35611 0.583628 4.10092 0.548474C4.84756 0.512642 5.08592 0.504475 6.98651 0.500847C8.88756 0.49722 9.12591 0.504473 9.87254 0.537586C10.6176 0.569792 11.1265 0.687278 11.572 0.859651C12.0328 1.03723 12.4238 1.27629 12.8135 1.66435C13.2031 2.05286 13.4431 2.44251 13.6229 2.90269C13.7969 3.34768 13.9162 3.85595 13.9516 4.60123C13.9869 5.34763 13.9955 5.58577 13.9992 7.48662C14.0028 9.38723 13.9951 9.62583 13.9624 10.3729C13.93 11.1175 13.8128 11.6267 13.6404 12.0719C13.4623 12.5328 13.2237 12.9238 12.8357 13.3134C12.4476 13.7033 12.0575 13.943 11.5974 14.1231C11.1524 14.2968 10.6441 14.4161 9.89931 14.4517C9.15269 14.4871 8.91431 14.4955 7.01305 14.4992C5.11268 14.5028 4.87432 14.4955 4.1277 14.4626C3.38265 14.43 2.87348 14.3127 2.42827 14.1406C1.96742 13.9623 1.57641 13.7239 1.18677 13.3356C0.796898 12.9474 0.556725 12.5575 0.377101 12.0973C0.202917 11.6525 0.0840625 11.144 0.0484591 10.3994C0.0128543 9.65259 0.00446545 9.414 0.000839454 7.51338C-0.00280055 5.61254 0.00468806 5.3744 0.0373431 4.62776C0.0702333 3.88249 0.187038 3.37353 0.359409 2.92787C0.537441 2.46723 0.776035 2.07645 1.16455 1.68657C1.5526 1.29693 1.94269 1.05651 2.40287 0.877113ZM2.88256 12.9646C3.12955 13.0596 3.50013 13.173 4.18258 13.2027C4.92104 13.2347 5.14216 13.2418 7.01078 13.2381C8.88006 13.2347 9.1012 13.2268 9.83943 13.1921C10.5212 13.1596 10.8918 13.0449 11.1381 12.9487C11.4649 12.821 11.6976 12.6684 11.9421 12.4237C12.1866 12.178 12.3379 11.9447 12.4644 11.6178C12.5597 11.3706 12.6729 10.9998 12.7026 10.3173C12.735 9.57933 12.7418 9.35797 12.7382 7.48888C12.7348 5.62025 12.7268 5.39889 12.6917 4.66065C12.6595 3.97865 12.5449 3.60805 12.4485 3.36197C12.3209 3.03469 12.1687 2.80245 11.9233 2.55773C11.6779 2.313 11.4445 2.16218 11.1172 2.03562C10.8707 1.94014 10.4996 1.82719 9.81766 1.79748C9.07919 1.76505 8.85783 1.75847 6.98878 1.7621C5.12017 1.76573 4.89904 1.77321 4.16081 1.80814C3.47859 1.84057 3.10845 1.95511 2.86169 2.0515C2.53509 2.17919 2.3024 2.33092 2.05768 2.57655C1.81341 2.82217 1.66214 3.0551 1.53559 3.38261C1.44079 3.62937 1.3267 4.00042 1.29745 4.68242C1.26524 5.42089 1.25844 5.64225 1.26207 7.51088C1.26547 9.37997 1.27341 9.60133 1.30811 10.3391C1.34009 11.0216 1.45552 11.3917 1.55147 11.6387C1.67915 11.9651 1.83134 12.1978 2.07651 12.4425C2.32214 12.6863 2.55551 12.838 2.88256 12.9646Z" fill="black"/>
                                            </svg>                                      
                                        </a>
                                    </div>
                                    <div class="headline">
                                        <span>${obj.headline}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="action-btns">
                                <div class="favorite">
                                    <svg onclick="toggleFavourite(this, ${obj.id})" class="cursor-pointer" width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        
                                        ${obj.is_saved 
                                            ?  `<rect width="36" height="36" rx="18" fill="#EAE6FF"/>
                                                <g clip-path="url(#clip0_6625_9286)">
                                                    <path d="M17.9993 25.7917L16.791 24.6917C12.4993 20.8 9.66602 18.2333 9.66602 15.0833C9.66602 12.5167 11.6827 10.5 14.2493 10.5C15.6993 10.5 17.091 11.175 17.9993 12.2417C18.9077 11.175 20.2993 10.5 21.7493 10.5C24.316 10.5 26.3327 12.5167 26.3327 15.0833C26.3327 18.2333 23.4993 20.8 19.2077 24.7L17.9993 25.7917Z" fill="#6E62E5"/>
                                                </g>
                                                <defs>
                                                    <clipPath id="clip0_6625_9286">
                                                        <rect width="20" height="20" fill="white" transform="translate(8 8)"/>
                                                    </clipPath>
                                                </defs>`
                                            : `
                                                <rect width="36" height="36" rx="18" fill="#F8F9FD"/>
                                                <g clip-path="url(#clip0_6518_3324)">
                                                    <path d="M21.7493 10.5C20.2993 10.5 18.9077 11.175 17.9993 12.2417C17.091 11.175 15.6993 10.5 14.2493 10.5C11.6827 10.5 9.66602 12.5167 9.66602 15.0833C9.66602 18.2333 12.4993 20.8 16.791 24.7L17.9993 25.7917L19.2077 24.6917C23.4993 20.8 26.3327 18.2333 26.3327 15.0833C26.3327 12.5167 24.316 10.5 21.7493 10.5ZM18.0827 23.4583L17.9993 23.5417L17.916 23.4583C13.9493 19.8667 11.3327 17.4917 11.3327 15.0833C11.3327 13.4167 12.5827 12.1667 14.2493 12.1667C15.5327 12.1667 16.7827 12.9917 17.2243 14.1333H18.7827C19.216 12.9917 20.466 12.1667 21.7493 12.1667C23.416 12.1667 24.666 13.4167 24.666 15.0833C24.666 17.4917 22.0493 19.8667 18.0827 23.4583Z" fill="#68759A"/>
                                                </g>
                                                <defs>
                                                    <clipPath id="clip0_6518_3324">
                                                        <rect width="20" height="20" fill="white" transform="translate(8 8)"/>
                                                    </clipPath>
                                                </defs>`
                                        }
                                    </svg>
                                </div>
                                <div class="actions dropdown">
                                    <svg class=" dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M10 12C10 13.1046 10.8954 14 12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12Z" fill="black"/>
                                        <path d="M17 12C17 13.1046 17.8954 14 19 14C20.1046 14 21 13.1046 21 12C21 10.8954 20.1046 10 19 10C17.8954 10 17 10.8954 17 12Z" fill="black"/>
                                        <path d="M3 12C3 13.1046 3.89543 14 5 14C6.10457 14 7 13.1046 7 12C7 10.8954 6.10457 10 5 10C3.89543 10 3 10.8954 3 12Z" fill="black"/>
                                    </svg> 
                                    <ul class="dropdown-menu">
                                       
                                        <!-- Save/Remove from List -->
                                        <li>
                                            ${obj.is_list
                                                ?
                                                `<a class="dropdown-item remove-from-saved" href="#" data-id="save-list-btn-${obj.id}"  onclick="removeProfileFromList(${obj.id});">
                                                    Remove from List
                                                </a>`
                                                :
                                                `<a class="dropdown-item" href="#" data-id="save-list-btn-${obj.id}"  onclick="openSaveProfileInListModal('saveListModal', ${obj.id});">
                                                    Save on List
                                                </a>`
                                            }
                                        </li>

                                        <!-- Share Profile -->
                                        <li>
                                            <a class="dropdown-item" href="#" 
                                            onclick="openShareProfileModal('shareProfileModal', ${obj.id}); return false;">
                                                Share Profile
                                            </a>
                                        </li>

                                        <!-- Report -->
                                        <li>
                                            <a class="dropdown-item" href="#" 
                                            onclick="openReportCandidateModal('reportCandidateModal', ${obj.id}); return false;">
                                                Report
                                            </a>
                                        </li>
                                    </ul>

                                </div>
                            </div>
                        </div>
                        <div class="body">
                            <div class="information">
                                <span>Information</span>
                                <div class="info-card">
                                    <div class="">
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <g clip-path="url(#clip0_6513_24742)">
                                                <path d="M10 3H8V2C8 1.445 7.555 1 7 1H5C4.445 1 4 1.445 4 2V3H2C1.445 3 1.005 3.445 1.005 4L1 9.5C1 10.055 1.445 10.5 2 10.5H10C10.555 10.5 11 10.055 11 9.5V4C11 3.445 10.555 3 10 3ZM7 3H5V2H7V3Z" fill="#3D496B"/>
                                            </g>
                                            <defs>
                                                <clipPath id="clip0_6513_24742">
                                                    <rect width="12" height="12" fill="white"/>
                                                </clipPath>
                                            </defs>
                                        </svg>
                                        <span>${obj.current_position == null ? 'No information' : obj.current_position}</span>
                                    </div>
                                    <div class="">
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M6.00071 0.200012L3.9898 4.22535H8.01162L6.00071 0.200012ZM3.79019 4.62535L3.10582 5.99486L1.86756 8.47413H10.1339L8.89559 5.99486L8.21123 4.62535H3.79019ZM1.66756 8.87451L0.210938 11.7897H6.00071H11.7905L10.3339 8.87451H1.66756Z" fill="#3D496B"/>
                                        </svg>                            
                                        <span class="experience-lelve">${obj.seniority}</span>
                                    </div>
                                    <div class="">
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M6 11C5.88333 11 5.78333 10.9667 5.7 10.9C5.61667 10.8333 5.55417 10.7458 5.5125 10.6375C5.35417 10.1708 5.15417 9.73333 4.9125 9.325C4.67917 8.91667 4.35 8.4375 3.925 7.8875C3.5 7.3375 3.15417 6.8125 2.8875 6.3125C2.62917 5.8125 2.5 5.20833 2.5 4.5C2.5 3.525 2.8375 2.7 3.5125 2.025C4.19583 1.34167 5.025 1 6 1C6.975 1 7.8 1.34167 8.475 2.025C9.15833 2.7 9.5 3.525 9.5 4.5C9.5 5.25833 9.35417 5.89167 9.0625 6.4C8.77917 6.9 8.45 7.39583 8.075 7.8875C7.625 8.4875 7.28333 8.9875 7.05 9.3875C6.825 9.77917 6.6375 10.1958 6.4875 10.6375C6.44583 10.7542 6.37917 10.8458 6.2875 10.9125C6.20417 10.9708 6.10833 11 6 11ZM6 5.75C6.35 5.75 6.64583 5.62917 6.8875 5.3875C7.12917 5.14583 7.25 4.85 7.25 4.5C7.25 4.15 7.12917 3.85417 6.8875 3.6125C6.64583 3.37083 6.35 3.25 6 3.25C5.65 3.25 5.35417 3.37083 5.1125 3.6125C4.87083 3.85417 4.75 4.15 4.75 4.5C4.75 4.85 4.87083 5.14583 5.1125 5.3875C5.35417 5.62917 5.65 5.75 6 5.75Z" fill="#3D496B"/>
                                        </svg>
                                        <span class="location">${obj.person_city}, ${obj.person_country}</span>                            
                                    </div>
                                </div>
                                <div class="info-card">
                                    <div ${obj.company_name != null ? `onclick="searchCompanyRecords('${obj.company_name.replace(/'/g, "\\'")}')" class="cursor-pointer"` : ''}>
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M10.3195 10.08H9.59945V3.6C9.60301 3.54751 9.58887 3.49534 9.55929 3.45183C9.5297 3.40832 9.48638 3.37599 9.43625 3.36L7.67945 2.6256V10.08H7.19945V1.68C7.19945 1.61635 7.17417 1.55531 7.12916 1.5103C7.08415 1.46529 7.02311 1.44 6.95945 1.44H2.63945C2.5758 1.44 2.51476 1.46529 2.46975 1.5103C2.42474 1.55531 2.39945 1.61635 2.39945 1.68V10.08H1.67945C1.6158 10.08 1.55476 10.1053 1.50975 10.1503C1.46474 10.1953 1.43945 10.2564 1.43945 10.32C1.43945 10.3837 1.46474 10.4447 1.50975 10.4897C1.55476 10.5347 1.6158 10.56 1.67945 10.56H10.3195C10.3831 10.56 10.4441 10.5347 10.4892 10.4897C10.5342 10.4447 10.5595 10.3837 10.5595 10.32C10.5595 10.2564 10.5342 10.1953 10.4892 10.1503C10.4441 10.1053 10.3831 10.08 10.3195 10.08ZM8.39945 4.32H8.87945C8.9431 4.32 9.00415 4.34529 9.04916 4.3903C9.09417 4.43531 9.11945 4.49635 9.11945 4.56C9.11822 4.62327 9.09254 4.6836 9.0478 4.72835C9.00305 4.77309 8.94272 4.79877 8.87945 4.8H8.39945C8.33619 4.79877 8.27585 4.77309 8.23111 4.72835C8.18636 4.6836 8.16068 4.62327 8.15945 4.56C8.15945 4.49635 8.18474 4.43531 8.22975 4.3903C8.27476 4.34529 8.3358 4.32 8.39945 4.32ZM8.39945 5.76H8.87945C8.9431 5.76 9.00415 5.78529 9.04916 5.8303C9.09417 5.87531 9.11945 5.93635 9.11945 6C9.11945 6.06365 9.09417 6.1247 9.04916 6.16971C9.00415 6.21472 8.9431 6.24 8.87945 6.24H8.39945C8.3358 6.24 8.27476 6.21472 8.22975 6.16971C8.18474 6.1247 8.15945 6.06365 8.15945 6C8.15945 5.93635 8.18474 5.87531 8.22975 5.8303C8.27476 5.78529 8.3358 5.76 8.39945 5.76ZM8.39945 7.2H8.87945C8.94272 7.20123 9.00305 7.22691 9.0478 7.27166C9.09254 7.3164 9.11822 7.37674 9.11945 7.44C9.11945 7.50365 9.09417 7.5647 9.04916 7.60971C9.00415 7.65472 8.9431 7.68 8.87945 7.68H8.39945C8.3358 7.68 8.27476 7.65472 8.22975 7.60971C8.18474 7.5647 8.15945 7.50365 8.15945 7.44C8.16068 7.37674 8.18636 7.3164 8.23111 7.27166C8.27585 7.22691 8.33619 7.20123 8.39945 7.2ZM8.39945 8.64H8.87945C8.9431 8.64 9.00415 8.66529 9.04916 8.7103C9.09417 8.75531 9.11945 8.81635 9.11945 8.88C9.11945 8.94365 9.09417 9.0047 9.04916 9.04971C9.00415 9.09472 8.9431 9.12 8.87945 9.12H8.39945C8.3358 9.12 8.27476 9.09472 8.22975 9.04971C8.18474 9.0047 8.15945 8.94365 8.15945 8.88C8.15945 8.81635 8.18474 8.75531 8.22975 8.7103C8.27476 8.66529 8.3358 8.64 8.39945 8.64ZM5.27945 2.88H5.75945C5.8231 2.88 5.88415 2.90529 5.92916 2.9503C5.97417 2.99531 5.99945 3.05635 5.99945 3.12C5.99945 3.18365 5.97417 3.2447 5.92916 3.28971C5.88415 3.33472 5.8231 3.36 5.75945 3.36H5.27945C5.2158 3.36 5.15476 3.33472 5.10975 3.28971C5.06474 3.2447 5.03945 3.18365 5.03945 3.12C5.03945 3.05635 5.06474 2.99531 5.10975 2.9503C5.15476 2.90529 5.2158 2.88 5.27945 2.88ZM5.27945 4.32H5.75945C5.8231 4.32 5.88415 4.34529 5.92916 4.3903C5.97417 4.43531 5.99945 4.49635 5.99945 4.56C5.99945 4.62365 5.97417 4.6847 5.92916 4.72971C5.88415 4.77472 5.8231 4.8 5.75945 4.8H5.27945C5.2158 4.8 5.15476 4.77472 5.10975 4.72971C5.06474 4.6847 5.03945 4.62365 5.03945 4.56C5.03945 4.49635 5.06474 4.43531 5.10975 4.3903C5.15476 4.34529 5.2158 4.32 5.27945 4.32ZM5.27945 5.76H5.75945C5.8231 5.76 5.88415 5.78529 5.92916 5.8303C5.97417 5.87531 5.99945 5.93635 5.99945 6C5.99945 6.06365 5.97417 6.1247 5.92916 6.16971C5.88415 6.21472 5.8231 6.24 5.75945 6.24H5.27945C5.2158 6.24 5.15476 6.21472 5.10975 6.16971C5.06474 6.1247 5.03945 6.06365 5.03945 6C5.03945 5.93635 5.06474 5.87531 5.10975 5.8303C5.15476 5.78529 5.2158 5.76 5.27945 5.76ZM5.27945 7.2H5.75945C5.8231 7.2 5.88415 7.22529 5.92916 7.2703C5.97417 7.31531 5.99945 7.37635 5.99945 7.44C5.99945 7.50365 5.97417 7.5647 5.92916 7.60971C5.88415 7.65472 5.8231 7.68 5.75945 7.68H5.27945C5.2158 7.68 5.15476 7.65472 5.10975 7.60971C5.06474 7.5647 5.03945 7.50365 5.03945 7.44C5.03945 7.37635 5.06474 7.31531 5.10975 7.2703C5.15476 7.22529 5.2158 7.2 5.27945 7.2ZM3.81065 2.88H4.31945C4.38311 2.88 4.44415 2.90529 4.48916 2.9503C4.53417 2.99531 4.55945 3.05635 4.55945 3.12C4.55945 3.18365 4.53417 3.2447 4.48916 3.28971C4.44415 3.33472 4.38311 3.36 4.31945 3.36H3.83945C3.7758 3.36 3.71476 3.33472 3.66975 3.28971C3.62474 3.2447 3.59945 3.18365 3.59945 3.12C3.59945 3.05635 3.62474 2.99531 3.66975 2.9503C3.71476 2.90529 3.7758 2.88 3.83945 2.88H3.81065ZM3.81065 4.32H4.31945C4.38311 4.32 4.44415 4.34529 4.48916 4.3903C4.53417 4.43531 4.55945 4.49635 4.55945 4.56C4.55945 4.62365 4.53417 4.6847 4.48916 4.72971C4.44415 4.77472 4.38311 4.8 4.31945 4.8H3.83945C3.7758 4.8 3.71476 4.77472 3.66975 4.72971C3.62474 4.6847 3.59945 4.62365 3.59945 4.56C3.59945 4.49635 3.62474 4.43531 3.66975 4.3903C3.71476 4.34529 3.7758 4.32 3.83945 4.32H3.81065ZM3.81065 5.76H4.31945C4.38311 5.76 4.44415 5.78529 4.48916 5.8303C4.53417 5.87531 4.55945 5.93635 4.55945 6C4.55945 6.06365 4.53417 6.1247 4.48916 6.16971C4.44415 6.21472 4.38311 6.24 4.31945 6.24H3.83945C3.7758 6.24 3.71476 6.21472 3.66975 6.16971C3.62474 6.1247 3.59945 6.06365 3.59945 6C3.59945 5.93635 3.62474 5.87531 3.66975 5.8303C3.71476 5.78529 3.7758 5.76 3.83945 5.76H3.81065ZM3.81065 7.2H4.31945C4.38311 7.2 4.44415 7.22529 4.48916 7.2703C4.53417 7.31531 4.55945 7.37635 4.55945 7.44C4.55945 7.50365 4.53417 7.5647 4.48916 7.60971C4.44415 7.65472 4.38311 7.68 4.31945 7.68H3.83945C3.7758 7.68 3.71476 7.65472 3.66975 7.60971C3.62474 7.5647 3.59945 7.50365 3.59945 7.44C3.59945 7.37635 3.62474 7.31531 3.66975 7.2703C3.71476 7.22529 3.7758 7.2 3.83945 7.2H3.81065ZM5.03945 10.08V9.12H4.55945V10.08H4.07945V8.8656C4.08313 8.80448 4.11003 8.74707 4.15464 8.70513C4.19926 8.66319 4.25822 8.63989 4.31945 8.64H5.27945C5.34311 8.64 5.40415 8.66529 5.44916 8.7103C5.49417 8.75531 5.51945 8.81635 5.51945 8.88V10.08H5.03945Z" fill="#3D496B"/>
                                        </svg>
                                        <span>${obj.company_name == null ? 'No information' : obj.company_name}</span>                            
                                    </div>
                                    <div class="">
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <g clip-path="url(#clip0_6497_4616)">
                                                <path d="M8 5.5C8.83 5.5 9.495 4.83 9.495 4C9.495 3.17 8.83 2.5 8 2.5C7.17 2.5 6.5 3.17 6.5 4C6.5 4.83 7.17 5.5 8 5.5ZM4 5.5C4.83 5.5 5.495 4.83 5.495 4C5.495 3.17 4.83 2.5 4 2.5C3.17 2.5 2.5 3.17 2.5 4C2.5 4.83 3.17 5.5 4 5.5ZM4 6.5C2.835 6.5 0.5 7.085 0.5 8.25V9C0.5 9.275 0.725 9.5 1 9.5H7C7.275 9.5 7.5 9.275 7.5 9V8.25C7.5 7.085 5.165 6.5 4 6.5ZM8 6.5C7.855 6.5 7.69 6.51 7.515 6.525C7.525 6.53 7.53 6.54 7.535 6.545C8.105 6.96 8.5 7.515 8.5 8.25V9C8.5 9.175 8.465 9.345 8.41 9.5H11C11.275 9.5 11.5 9.275 11.5 9V8.25C11.5 7.085 9.165 6.5 8 6.5Z" fill="#3D496B"/>
                                            </g>
                                            <defs>
                                                <clipPath id="clip0_6497_4616">
                                                    <rect width="12" height="12" fill="white"/>
                                                </clipPath>
                                            </defs>
                                        </svg>
                                        <span class="company-size">${obj.company_size_from} - ${obj.company_size_to}</span>                            
                                    </div>
                                </div>
                            </div>
                            <div class="contact">
                                <span>Contact</span>
                                <div class="mails-phone">
                                    <!-- Check for email information and apply corresponding logic -->
                                    ${obj.personal_email == false ? 
                                        '<div class="no-information p-2"><span>No Information Available</span></div>' :
                                        `<button 
                                            ${ obj.personal_email == true ? `onclick="showData(this, 'email1', ${obj.id});"` : ''} 
                                            data-name="personal-email">
                                            ${ obj.personal_email != true && obj.personal_email != false ? obj.personal_email :
                                                `<svg width="13" height="12" viewBox="0 0 13 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <g clip-path="url(#clip0_7008_1925)">
                                                        <path d="M9.5 4H9V3C9 1.62 7.88 0.5 6.5 0.5C5.12 0.5 4 1.62 4 3V4H3.5C2.95 4 2.5 4.45 2.5 5V10C2.5 10.55 2.95 11 3.5 11H9.5C10.05 11 10.5 10.55 10.5 10V5C10.5 4.45 10.05 4 9.5 4ZM6.5 8.5C5.95 8.5 5.5 8.05 5.5 7.5C5.5 6.95 5.95 6.5 6.5 6.5C7.05 6.5 7.5 6.95 7.5 7.5C7.5 8.05 7.05 8.5 6.5 8.5ZM5 4V3C5 2.17 5.67 1.5 6.5 1.5C7.33 1.5 8 2.17 8 3V4H5Z" fill="#68759A"/>
                                                    </g>
                                                    <defs>
                                                        <clipPath id="clip0_7008_1925">
                                                            <rect width="12" height="12" fill="white" transform="translate(0.5)"/>
                                                        </clipPath>
                                                    </defs>
                                                </svg>
                                                <span>Personal Email</span>`}
                                        </button>`
                                    }

                                    <!-- Check for mobile phone information and apply corresponding logic -->
                                    ${obj.mobile_phone == false ? 
                                        '<div class="no-information p-2"><span>No Information Available</span></div>' :
                                        `<button 
                                            ${ obj.mobile_phone == true ? `onclick="showData(this, 'phone2', ${obj.id});"` : ''} 
                                            data-name="cell-phone">
                                            ${ obj.mobile_phone != true && obj.mobile_phone != false ? obj.mobile_phone :
                                                `<svg width="13" height="12" viewBox="0 0 13 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <g clip-path="url(#clip0_7008_1925)">
                                                        <path d="M9.5 4H9V3C9 1.62 7.88 0.5 6.5 0.5C5.12 0.5 4 1.62 4 3V4H3.5C2.95 4 2.5 4.45 2.5 5V10C2.5 10.55 2.95 11 3.5 11H9.5C10.05 11 10.5 10.55 10.5 10V5C10.5 4.45 10.05 4 9.5 4ZM6.5 8.5C5.95 8.5 5.5 8.05 5.5 7.5C5.5 6.95 5.95 6.5 6.5 6.5C7.05 6.5 7.5 6.95 7.5 7.5C7.5 8.05 7.05 8.5 6.5 8.5ZM5 4V3C5 2.17 5.67 1.5 6.5 1.5C7.33 1.5 8 2.17 8 3V4H5Z" fill="#68759A"/>
                                                    </g>
                                                    <defs>
                                                        <clipPath id="clip0_7008_1925">
                                                            <rect width="12" height="12" fill="white" transform="translate(0.5)"/>
                                                        </clipPath>
                                                    </defs>
                                                </svg>
                                                <span>Mobile Phone</span>`}
                                        </button>`
                                    }

                                    <!-- Check for Pro Email information and apply corresponding logic -->
                                    ${obj.pro_email == false ? 
                                        '<div class="no-information p-2"><span>No Information Available</span></div>' :
                                        `<button 
                                            ${ obj.pro_email == true ? `onclick="showData(this, 'email2', ${obj.id});"` : ''} 
                                            data-name="pro-email">
                                            ${ obj.pro_email != true && obj.pro_email != false ? obj.pro_email :
                                                `<svg width="13" height="12" viewBox="0 0 13 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <g clip-path="url(#clip0_7008_1925)">
                                                        <path d="M9.5 4H9V3C9 1.62 7.88 0.5 6.5 0.5C5.12 0.5 4 1.62 4 3V4H3.5C2.95 4 2.5 4.45 2.5 5V10C2.5 10.55 2.95 11 3.5 11H9.5C10.05 11 10.5 10.55 10.5 10V5C10.5 4.45 10.05 4 9.5 4ZM6.5 8.5C5.95 8.5 5.5 8.05 5.5 7.5C5.5 6.95 5.95 6.5 6.5 6.5C7.05 6.5 7.5 6.95 7.5 7.5C7.5 8.05 7.05 8.5 6.5 8.5ZM5 4V3C5 2.17 5.67 1.5 6.5 1.5C7.33 1.5 8 2.17 8 3V4H5Z" fill="#68759A"/>
                                                    </g>
                                                    <defs>
                                                        <clipPath id="clip0_7008_1925">
                                                            <rect width="12" height="12" fill="white" transform="translate(0.5)"/>
                                                        </clipPath>
                                                    </defs>
                                                </svg>
                                                <span>Pro Email</span>`}
                                        </button>`
                                    }

                                    ${obj.landline == false ? 
                                        '<div class="no-information p-2"><span>No Information Available</span></div>' :
                                        `<button 
                                            ${ obj.landline == true ? `onclick="showData(this, 'phone1', ${obj.id});"` : ''} 
                                            data-name="pro-personal_email">
                                            ${ obj.landline != true && obj.landline != false ? obj.landline :
                                                `<svg width="13" height="12" viewBox="0 0 13 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <g clip-path="url(#clip0_7008_1925)">
                                                        <path d="M9.5 4H9V3C9 1.62 7.88 0.5 6.5 0.5C5.12 0.5 4 1.62 4 3V4H3.5C2.95 4 2.5 4.45 2.5 5V10C2.5 10.55 2.95 11 3.5 11H9.5C10.05 11 10.5 10.55 10.5 10V5C10.5 4.45 10.05 4 9.5 4ZM6.5 8.5C5.95 8.5 5.5 8.05 5.5 7.5C5.5 6.95 5.95 6.5 6.5 6.5C7.05 6.5 7.5 6.95 7.5 7.5C7.5 8.05 7.05 8.5 6.5 8.5ZM5 4V3C5 2.17 5.67 1.5 6.5 1.5C7.33 1.5 8 2.17 8 3V4H5Z" fill="#68759A"/>
                                                    </g>
                                                    <defs>
                                                        <clipPath id="clip0_7008_1925">
                                                            <rect width="12" height="12" fill="white" transform="translate(0.5)"/>
                                                        </clipPath>
                                                    </defs>
                                                </svg>
                                                <span>Landline</span>`}
                                        </button>`
                                    }
                                </div>
                            </div>

                            <div class="skills">
                                <span>Skills</span>
                                <div class="skills-container">
                                    ${skillsHTML}
                                    <span onclick="toggleSeeMore(this)">
                                        <span>See More</span>
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M4 6L8 10L12 6" stroke="#68759A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>                            
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="actions-container">
                            <button class="header" onclick="toggleActions(this)">
                                <span>View more actions</span>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M4 6L8 10L12 6" stroke="#68759A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>                    
                            </button>
                            <div class="body">
                                <div class="title">
                                    <span>Actions(<span id="action-count-${obj.id}">${obj.actions.length}</span>)</span>
                                    <div class="dropdown">
                                        <button class="" type="button" data-bs-toggle="dropdown" aria-expanded="false" >
                                            <span>Filter</span>
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <g clip-path="url(#clip0_6856_1994)">
                                                    <path d="M6.66667 12H9.33333V10.6667H6.66667V12ZM2 4V5.33333H14V4H2ZM4 8.66667H12V7.33333H4V8.66667Z" fill="#68759A"/>
                                                </g>
                                                <defs>
                                                    <clipPath id="clip0_6856_1994">
                                                        <rect width="16" height="16" fill="white"/>
                                                    </clipPath>
                                                </defs>
                                            </svg>
                                        </button>
                                        <ul class="dropdown-menu action-type-dropdown-menu" id="action-filter-container-${obj.id}">
                                            <li><a class="dropdown-item" href="#" data-value="all" onclick="filterProfileActionType(this, ${obj.id})">All</a></li>
                                            <li><a class="dropdown-item" href="#" data-value="call" onclick="filterProfileActionType(this, ${obj.id})">Call</a></li>
                                            <li><a class="dropdown-item" href="#" data-value="text_message" onclick="filterProfileActionType(this, ${obj.id})">Text Messages</a></li>
                                            <li><a class="dropdown-item" href="#" data-value="voice_email" onclick="filterProfileActionType(this, ${obj.id})">Voice Mail</a></li>
                                            <li><a class="dropdown-item" href="#" data-value="email" onclick="filterProfileActionType(this, ${obj.id})">Email</a></li>
                                            <li><a class="dropdown-item" href="#" data-value="note" onclick="filterProfileActionType(this, ${obj.id})">Note</a></li>
                                            <li><a class="dropdown-item" href="#" data-value="convert" onclick="filterProfileActionType(this, ${obj.id})">Convert</a></li>
                                            <li><a class="dropdown-item" href="#" data-value="opened_profile" onclick="filterProfileActionType(this, ${obj.id})">Opened Profiles</a></li>
                                        </ul>

                                        <button onclick="openAddActionModal('addActionModal', ${obj.id});">
                                            <span>Add Action</span>
                                        </button>
                                    </div>
                                </div>
                                <div class="table-container">
                                    <table class="actions-details-table">
                                        <thead>
                                            <tr>
                                                <th>
                                                    <div>
                                                        <span>Actions</span>
                                                    </div>
                                                </th>
                                                <th>
                                                    <div>
                                                        <span>Name</span>
                                                        <svg width="21" height="20" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M6.87511 1.9565L4.55011 4.2815C4.28344 4.54817 4.46677 4.99817 4.84177 4.99817L6.33344 4.99817L6.33344 16.6648C6.33344 17.1232 6.70844 17.4982 7.16677 17.4982C7.62511 17.4982 8.00011 17.1232 8.00011 16.6648L8.00011 4.99817L9.49177 4.99817C9.86677 4.99817 10.0501 4.54817 9.78344 4.28983L7.45844 1.96484C7.30011 1.79817 7.03344 1.79817 6.87511 1.9565Z" fill="#68759A"/>
                                                            <path d="M14.1245 18.0398L16.4495 15.7148C16.7161 15.4482 16.5328 14.9982 16.1578 14.9982L14.6661 14.9982L14.6661 3.3315C14.6661 2.87317 14.2911 2.49817 13.8328 2.49817C13.3745 2.49817 12.9995 2.87317 12.9995 3.3315L12.9995 14.9982L11.5078 14.9982C11.1328 14.9982 10.9495 15.4482 11.2161 15.7065L13.5411 18.0315C13.6995 18.1982 13.9661 18.1982 14.1245 18.0398Z" fill="#68759A"/>
                                                        </svg>
                                                    </div>
                                                </th>
                                                <th>
                                                    <div>
                                                        <span>Date/Time</span>
                                                        <svg width="21" height="20" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M6.87511 1.9565L4.55011 4.2815C4.28344 4.54817 4.46677 4.99817 4.84177 4.99817L6.33344 4.99817L6.33344 16.6648C6.33344 17.1232 6.70844 17.4982 7.16677 17.4982C7.62511 17.4982 8.00011 17.1232 8.00011 16.6648L8.00011 4.99817L9.49177 4.99817C9.86677 4.99817 10.0501 4.54817 9.78344 4.28983L7.45844 1.96484C7.30011 1.79817 7.03344 1.79817 6.87511 1.9565Z" fill="#68759A"/>
                                                            <path d="M14.1245 18.0398L16.4495 15.7148C16.7161 15.4482 16.5328 14.9982 16.1578 14.9982L14.6661 14.9982L14.6661 3.3315C14.6661 2.87317 14.2911 2.49817 13.8328 2.49817C13.3745 2.49817 12.9995 2.87317 12.9995 3.3315L12.9995 14.9982L11.5078 14.9982C11.1328 14.9982 10.9495 15.4482 11.2161 15.7065L13.5411 18.0315C13.6995 18.1982 13.9661 18.1982 14.1245 18.0398Z" fill="#68759A"/>
                                                        </svg>
                                                    </div>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody id="action-list-container-${obj.id}">
                                            ${actionListHTML}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </section>`;
                    detailsContainer.appendChild(itemDiv);
                });
                generatePages(res.pagination.currentPage, res.pagination.total, res.pagination.links.previous, res.pagination.links.next, res.pagination.count || 0, pageStartEndRecords.start || 0, pageStartEndRecords.end || 0, 'needs-search');
                scrollToTop();
                const currentState = {
                    profileCardHTML: detailsContainer.innerHTML,
                    paginationContainerHTML: newNeedPaginationContainer.innerHTML,
                    recordCount: res.pagination.count || 0,
                    searchId: searchId,
                    searchData: searchKeywords
                };
                const queryString = buildQueryString(searchKeywords, excludeKeys);
                const newUrl = `${window.location.pathname}?${queryString}`;
                history.pushState(currentState, '', newUrl);
            } else {
                errorMsg.innerText = res.message;
                errorMsg.classList.add('active');
                hideProgress();
                console.log('error', res);
            }
        } else {
            let text = await response.text();
            console.log('Received non-JSON response:', text);
        }
    } catch (err) {
        console.log('Error:', err);
    }
}


function initializeState() {
    const currentState = {
        profileCardHTML: detailsContainer.innerHTML,
        paginationContainerHTML: newNeedPaginationContainer.innerHTML,
        recordCount: 0,
        searchId: null,
        searchData: {
            "name": '', "city": [], "state": [], "region": [], "country": [], "job_title": [], 
            "skills": [], "company": [], "head_count": [], "start_date": null, "end_date": null,
            "contact": '', "full_name": '', 'seniorities': [], "percentage": 0,
        }
    };
    history.replaceState(currentState, '', window.location.href);
}

window.addEventListener('load', initializeState);


window.addEventListener('popstate', function(event) {
    if (event.state) {
        detailsContainer.innerHTML = event.state.profileCardHTML;
        newNeedPaginationContainer.innerHTML = event.state.paginationContainerHTML;
        headerRecordCountText.innerText = event.state.recordCount || 0;

        needInput.value = event.state.searchData.name || '';

        locationTagContainer.innerHTML = '';
        locationTags = [];

        selectedCityList.length = 0;
        let needCities = event.state.searchData.city || [];
        needCities.forEach((loc) => {
            if (!selectedCityList.includes(loc)) {
                selectedCityList.push(loc);
                const newTag = createLocationTag(loc, 'city');
                locationTags.push(newTag);
            }
        })

        selectedStateList.length = 0;
        let needStates = event.state.searchData.state || [];
        needStates.forEach((loc) => {
            if (!selectedStateList.includes(loc)) {
                selectedStateList.push(loc);
                const newTag = createLocationTag(loc, 'state');
                locationTags.push(newTag);
            }
        })

        selectedRegionList.length = 0;
        let needRegions = event.state.searchData.region || [];
        needRegions.forEach((loc) => {
            if (!selectedRegionList.includes(loc)) {
                selectedRegionList.push(loc);
                const newTag = createLocationTag(loc, 'region');
                locationTags.push(newTag);
            }
        })

        selectedCountryList.length = 0;
        let needCountry = event.state.searchData.country || [];
        needCountry.forEach((loc) => {
            if (!selectedCountryList.includes(loc)) {
                selectedCountryList.push(loc);
                const newTag = createLocationTag(loc, 'country');
                locationTags.push(newTag);
            }
        })


        let jobList = event.state.searchData.job_title || [];
        let skillList = event.state.searchData.skills || [];
        let companies = event.state.searchData.company || [];

        selectedJobTitles.length = 0;
        jobTitleTags = jobTitleTags.filter(tag => tag.remove());
        jobList.forEach((job) => {
            if (!selectedJobTitles.includes(job)) {
                const newTag = createTag(job, jobTitleTags, selectedJobTitles, jobTitleTagContainer, jobTitleInput);
                selectedJobTitles.push(job);
                jobTitleTags.push(newTag);
            }
        })

        selectedSkills.length = 0;
        skillsTags = skillsTags.filter(tag => tag.remove());
        skillList.forEach((skill) => {
            if (!selectedSkills.includes(skill)) {
                const newTag = createTag(skill, skillsTags, selectedSkills, skillsTagContainer, skillsInput);
                selectedSkills.push(skill);
                skillsTags.push(newTag);
            }
        })

        selectedCompany.length = 0;
        companyTags = companyTags.filter(tag => tag.remove());
        companies.forEach((company) => {
            if (!selectedCompany.includes(company) && company != '') {
                const newTag = createTag(company, companyTags, selectedCompany, companyTagContainer, companyInput);
                selectedCompany.push(company);
                companyTags.push(newTag);
            }
        })

        selectedCompanyHeadcount.length = 0;
        companyHeadcountTags = companyHeadcountTags.filter(tag => tag.remove());
        companyHeadcountInputs.forEach(input => input.checked = false);
        let companySizeRange = event.state.searchData.head_count || [];
        companySizeRange.forEach((range) => {
            if (!selectedCompanyHeadcount.includes(range) && range != '') {
                document.querySelector(`input[name="company_size_filter"][value='${range}']`).click();
            }
        })
        companyHeadcountDropdown.classList.add('hide');
        
        startDate.setDate(event.state.searchData.start_date, true);
        if (event.state.searchData.end_date) {
            endDate.setDate(event.state.searchData.end_date, true);
        }
        else
            endDate.clear();

        const contactDetailsCheckboxes = document.querySelectorAll('input[name="contact_details"]');
        contactDetailsCheckboxes.forEach(checkbox => {
            checkbox.checked = event.state.searchData.contact.includes(checkbox.value);
        });

        selectedSeniorityLevels.length = 0;
        seniorityLevelTags = seniorityLevelTags.filter(tag => tag.remove());
        seniorityLevelInputs.forEach(input => input.checked = false);
        let seniorityLevelOptions = event.state.searchData.seniorities || [];
        seniorityLevelOptions.forEach((range) => {
            if (!selectedSeniorityLevels.includes(range) && range != '') {
                document.querySelector(`input[name="seniority_level"][value='${range}']`).click();
            }
        })
        seniorityLevelDropdown.classList.add('hide');

        document.querySelector(`input[name="percentage_filter"][value="${event.state.searchData.percentage || 0}"]`).checked = true;
        searchKeywords = event.state.searchData;
    }
});


const excludeKeys = [];

const buildQueryString = (params, excludeKeys=[]) => {
    const queryParams = new URLSearchParams();

    for (const key in params) {
        if (excludeKeys.includes(key)) {
            continue;
        }
        
        if (Array.isArray(params[key])) {
            queryParams.append(key, params[key].join(","));

        } else if (params[key] !== "" && params[key] !== null) {
            queryParams.append(key, params[key]);
        }
    }

    return queryParams.toString();
};

function scrollToTop() {
    document.querySelector('.new-need-filter-container').scrollIntoView();
}


async function createNeedSearch(data) {
    try {
        let searchFilterData = JSON.parse(JSON.stringify(data));
        console.log(data);

        // Format start_date if it exists
        if (searchFilterData.start_date) {
            let startDate = new Date(searchFilterData.start_date);
            if (!isNaN(startDate)) {
                searchFilterData.start_date = `${startDate.getDate().toString().padStart(2, '0')}-${(startDate.getMonth() + 1).toString().padStart(2, '0')}-${startDate.getFullYear()}`;
            } else {
                searchFilterData.start_date = null; // Handle invalid start_date
            }
        }

        // Format end_date if it exists
        if (searchFilterData.end_date) {
            let endDate = new Date(searchFilterData.end_date);
            if (!isNaN(endDate)) {
                searchFilterData.end_date = `${endDate.getDate().toString().padStart(2, '0')}-${(endDate.getMonth() + 1).toString().padStart(2, '0')}-${endDate.getFullYear()}`;
            } else {
                searchFilterData.end_date = null; // Handle invalid end_date
            }
        } else {
            searchFilterData.end_date = null; // Ensure null if not provided
        }

        // Add Authorization headers
        let token = getCookie('user_access');
        let headers = { 
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        };

        console.log(searchFilterData);

        // Make the API request
        let response = await requestAPI(`${apiURL}/needs`, JSON.stringify(searchFilterData), headers, "POST");
        response.json().then(function(res) {
            if (response.status == 201) {
                searchId = res.data.id;
                getMyNeedsList(requiredNeedDataURL);
            }
        });
    } catch (err) {
        console.log(err);
    }
}

function searchCompanyRecords(companyName) {
    return false;
    locationTagContainer.innerHTML = '';
    locationTags = [];
    triggerEvent(contact_details_clear_btn, 'click');
    triggerEvent(headcount_clear_btn, 'click');
    triggerEvent(document.getElementById('clear-skills-tags-button'), 'click');
    triggerEvent(document.getElementById('clear-jobs-tags-button'), 'click');
    triggerEvent(document.getElementById('clear-company-tags-button'), 'click');
    // document.getElementById('clear-jobs-tags-button').click();
    // document.getElementById('clear-company-tags-button').click();
    document.getElementById('company-tag-input').value = companyName;

    const event = new KeyboardEvent('keypress', {
        key: 'Enter',
        code: 'Enter',
        which: 13,
        keyCode: 13,
    });
    document.getElementById('company-tag-input').dispatchEvent(event);
    
    const newTag = createLocationTag('France');
    locationTags.push(newTag);
    keywordInput.value = null;
    locationInput.value = null;


    searchObject = {};
    searchObject.page = 1;
    searchObject.company_name_list = [companyName];
    searchObject.location = ['France'];
    searchObject.keywords = removeExtraSpaces(keywordInput.value);
    getRecords(searchObject);
    console.log(searchObject);
}


async function getMyNeedsList(url) {
    let temp = url.split(`api`);
    url = temp.length > 1 ? temp[1] : temp[0];

    tableLoader.classList.remove('hide');
    myNeedsTableContainer.classList.add('hide');
    
    let token = getCookie('user_access');
    let headers = { "Authorization": `Bearer ${token}` };

    let response = await requestAPI(`${apiURL}${requiredNeedDataURL}`, null, headers, "GET");
    response.json().then(function(res) {
        if (response.status == 200) {
            tableLoader.classList.add('hide');
            let tableBody = myNeedsTable.querySelector('tbody');
            tableBody.innerHTML = '';
            myNeedsRecords = res.data;
            if (res.data.length > 0) {
                res.data.forEach((rec) => {
                    let location = [
                        ...(rec.city || []),
                        ...(rec.state || []),
                        ...(rec.region || []),
                        ...(rec.country || [])
                    ];                  
                    tableBody.innerHTML += `<tr class="cursor-pointer" onclick="searchNeed(${rec.id});">
                                                <td>
                                                    <div><span class="table-text-overflow" title="${rec.name}">${rec.name}</span></div>
                                                </td>
                                                <td>
                                                    <div><span class="table-text-overflow" title="${rec.job_title.join(', ') || ''}">${rec.job_title.join(', ') || ''}</span></div>
                                                </td>
                                                <td>
                                                    <div><span class="table-text-overflow" title="${location.join(', ') || '--'}">${location.join(', ') || '--'}</span></div>
                                                </td>
                                                <td>
                                                    <div><span class="table-text-overflow" title="${rec.skills.join(', ') || '--'}">${rec.skills.join(', ') || '--'}</span></div>
                                                </td>
                                                <td>
                                                    <div>
                                                        <span class="table-text-overflow" title="${(rec.company || []).join(', ')}">
                                                            ${(rec.company || []).join(', ')  || '--'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div><span class="table-text-overflow" title="${rec.head_count.join(', ') || '--'}">${rec.head_count.join(', ') || '--'}</span></div>
                                                </td>
                                                <td>
                                                    <div><span>${convertDateFormat(rec.start_date)}</span></div>
                                                </td>
                                                <td>
                                                    <div><span>${rec.end_date ? convertDateFormat(rec.end_date) : '--'}</span></div>
                                                </td>
                                                <td>
                                                    <div class="actions">
                                                        <svg onclick="openDeleteNeedModal(event, 'delModal', ${rec.id})" width="23" height="22" viewBox="0 0 23 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M7.19531 19.25C6.69115 19.25 6.25955 19.0705 5.90052 18.7115C5.54149 18.3524 5.36198 17.9208 5.36198 17.4167V5.5H4.44531V3.66667H9.02865V2.75H14.5286V3.66667H19.112V5.5H18.1953V17.4167C18.1953 17.9208 18.0158 18.3524 17.6568 18.7115C17.2977 19.0705 16.8661 19.25 16.362 19.25H7.19531ZM16.362 5.5H7.19531V17.4167H16.362V5.5ZM9.02865 15.5833H10.862V7.33333H9.02865V15.5833ZM12.6953 15.5833H14.5286V7.33333H12.6953V15.5833Z" fill="#68759A"/>
                                                        </svg>

                                                    </div>
                                                </td>
                                            </tr>`
                })
            }
            else {
                tableBody.innerHTML = `<tr>
                                            <td colspan="8" class="no-record-row" style="height: 35px; background: #FFFFFF">No Record Available</td>
                                        </tr>`
            }
            if (selectedTableListType == 'my-needs') {
                tableLoader.classList.add('hide');
                myNeedsTableContainer.classList.remove('hide');
                myNeedsTablePagination.classList.remove('hide');
            }
            let pageStartEndRecords = getPageRecords(res.pagination);
            generatePages(res.pagination.currentPage, res.pagination.total, res.pagination.links.previous, res.pagination.links.next, res.pagination.count || 0, pageStartEndRecords.start || 0, pageStartEndRecords.end || 0, 'my-needs');
        }
    })
}

window.addEventListener('load', getMyNeedsList(requiredNeedDataURL));


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


async function toggleFavourite(element, id) {
    try {
        let token = getCookie('user_access');
        let headers = {
            "Authorization": `Bearer ${token}`,
            "Content-Type": 'application/json'
        };

        let response = await requestAPI(
            `${apiURL}/save/candidate`,
            JSON.stringify({ "candidate_profile": id }),
            headers,
            'POST'
        );

        const res = await response.json();
        
        if (response.status === 200) {
            if (element.classList.contains('saved')) {
                // Update to initial state (unsaved)
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
                // Update to saved state
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

function createActionsHtml(actions, id) {
    // Create an array to hold the HTML strings for each action
    const htmlArray = actions.map(action => {

        // Format the action_datetime to "dd/mm/yyyy - hh:mm"
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
    // Log the clicked element and ID for debugging
    console.log(element, id);

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
    console.log(filterValue)

    // Filter the rows within the action list
    actionListContainer.querySelectorAll('tr').forEach((row) => {
        let rowValue = row.getAttribute('data-value').toLowerCase();
        console.log(rowValue)

        // Show or hide the row based on the filter value
        if (filterValue === 'all' || rowValue === filterValue) {
            row.classList.remove('hide');
        } else {
            row.classList.add('hide');
        }
    });
}

function insertNewAction(id, res) {
    console.log(res);

    // Parse the custom date string using the parseCustomDate function
    const actionDate = parseCustomDate(res.action.action_datetime);
    console.log(actionDate)

    if (!actionDate) {
        console.error("Failed to parse action_datetime:", res.action.action_datetime);
        return;
    }

    // Format the parsed date
    const formattedDate = `${actionDate.getDate().toString().padStart(2, '0')}/${(actionDate.getMonth() + 1).toString().padStart(2, '0')}/${actionDate.getFullYear()} - ${actionDate.getHours().toString().padStart(2, '0')}:${actionDate.getMinutes().toString().padStart(2, '0')}`;

    // Update the action list and UI
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

    actionParentDiv.insertAdjacentHTML('afterbegin', newAction);
    document.getElementById(`action-filter-container-${id}`).querySelector('a[data-value="all"]').click();
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


// Example usage with your object
const action = {
    id: 315,
    created_by: {
        id: 78,
        first_name: "saad",
        last_name: "ind"
    },
    action_type: "opened_profile",
    comment: "Opened email1 by saad ind",
    action_datetime: "29-11-2024 11:47 AMZ",
    is_mine: true
};

const actionDate = parseCustomDate(action.action_datetime);

if (actionDate) {
    const formattedDate = `${actionDate.getDate().toString().padStart(2, '0')}/${(actionDate.getMonth() + 1).toString().padStart(2, '0')}/${actionDate.getFullYear()} - ${actionDate.getHours().toString().padStart(2, '0')}:${actionDate.getMinutes().toString().padStart(2, '0')}`;
    console.log("Formatted Date:", formattedDate);
} else {
    console.error("Failed to parse action_datetime.");
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

function searchNeed(id) {
    try {
        let recordData = myNeedsRecords.find((item) => item.id === id);
        if (!recordData) throw new Error(`Record with ID ${id} not found`);

        needInput.value = recordData.name;

        // Handle job titles
        selectedJobTitles.length = 0;
        jobTitleTags = jobTitleTags.filter(tag => tag.remove());
        let jobList = Array.isArray(recordData.job_title)
            ? recordData.job_title
            : (recordData.job_title || '').split(',').map(job => job.trim());

        jobList.forEach((job) => {
            if (!selectedJobTitles.includes(job)) {
                const newTag = createTag(job, jobTitleTags, selectedJobTitles, jobTitleTagContainer, jobTitleInput);
                selectedJobTitles.push(job);
                jobTitleTags.push(newTag);
            }
        });

        // Handle skills
        selectedSkills.length = 0;
        skillsTags = skillsTags.filter(tag => tag.remove());
        let skillList = Array.isArray(recordData.skills)
            ? recordData.skills
            : (recordData.skills || '').split(',').map(skill => skill.trim());

        skillList.forEach((skill) => {
            if (!selectedSkills.includes(skill)) {
                const newTag = createTag(skill, skillsTags, selectedSkills, skillsTagContainer, skillsInput);
                selectedSkills.push(skill);
                skillsTags.push(newTag);
            }
        });

        // Handle locations (or alternatives like country, region, state, city)
        selectedLocations.length = 0;
        locationTags = locationTags.filter(tag => tag.remove());

        // Combine all location sources
        let locationSources = [
            ...(Array.isArray(recordData.location) ? recordData.location : []),
            ...(Array.isArray(recordData.country) ? recordData.country : []),
            ...(Array.isArray(recordData.region) ? recordData.region : []),
            ...(Array.isArray(recordData.state) ? recordData.state : []),
            ...(Array.isArray(recordData.city) ? recordData.city : [])
        ];

        // Ensure unique locations
        let uniqueLocations = [...new Set(locationSources.map(loc => loc.trim()))];

        uniqueLocations.forEach((loc) => {
            if (loc && !selectedLocations.includes(loc)) {
                selectedLocations.push(loc);

                // Determine the type and call `createLocationTag`
                if (recordData.city.includes(loc)) {
                    selectedCityList.push(loc);
                    locationTags.push(createLocationTag(loc, 'city'));
                } else if (recordData.state.includes(loc)) {
                    selectedStateList.push(loc);
                    locationTags.push(createLocationTag(loc, 'state'));
                } else if (recordData.region.includes(loc)) {
                    selectedRegionList.push(loc);
                    locationTags.push(createLocationTag(loc, 'region'));
                } else if (recordData.country.includes(loc)) {
                    selectedCountryList.push(loc);
                    locationTags.push(createLocationTag(loc, 'country'));
                } else {
                    locationTags.push(createLocationTag(loc, 'location')); // Default type
                }
            }
        });

        // Handle company
        selectedCompany.length = 0;
        companyTags = companyTags.filter(tag => tag.remove());
        let companies = Array.isArray(recordData.company)
            ? recordData.company
            : (recordData.company || '').split(',').map(company => company.trim());

        companies.forEach((company) => {
            if (company && !selectedCompany.includes(company)) {
                const newTag = createTag(company, companyTags, selectedCompany, companyTagContainer, companyInput);
                selectedCompany.push(company);
                companyTags.push(newTag);
            }
        });

        // Other fields (e.g., head_count, seniorities, etc.)
        // Example handling for other fields can follow a similar pattern as above

        startDate.setDate(recordData.start_date, true);
        if (recordData.end_date) {
            endDate.setDate(recordData.end_date, true);
        } else {
            endDate.clear();
        }

        const percentageInput = document.querySelector(`input[name="percentage_filter"][value="${recordData.percentage || 0}"]`);
        if (percentageInput) percentageInput.checked = true;

        const contactInput = document.querySelector(`input[name="contact_details"][value="${recordData.contact || ''}"]`);
        if (contactInput) contactInput.checked = true;

        changeNeedSection('new-need');
        document.querySelector('input[name="list_type_radio"][value="new_need"]').checked = true;
        searchId = id;

        // Search filters
        searchObject = {
            "need": recordData.name,
            "locations": uniqueLocations,
            "job_titles": jobList,
            "skills": skillList,
            "company_names": companies,
            "start_date": recordData.start_date,
            "end_date": recordData.end_date,
            "min_score": recordData.percentage || 0,
            "contact_details": recordData.contact || '',
            "seniority_levels": [] // Add additional logic if needed
        };

        console.log(searchObject)

        searchBtn.click();

    } catch (error) {
        console.error(`Error in searchNeed: ${error.message}`);
    }
}

function openDeleteNeedModal(element, modalId, id){
    element.stopPropagation();
    let modal = document.querySelector(`#${modalId}`);
    let form = modal.querySelector('form');
    form.setAttribute("onsubmit", `deleteNeedForm(event, ${id})`);
    modal.querySelector('#del-modal-header').innerText = 'Delete Need';
    modal.querySelector('#warning-statement').innerText = 'Are you sure you want to delete this need?';
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

async function deleteNeedForm(event, id){
    event.preventDefault();
    let form = event.currentTarget;
    let button = form.querySelector('button[type="submit"]');
    let buttonText = button.innerText;
    let errorMsg = form.querySelector('.delete-error-msg');
    try {
        errorMsg.innerText = '';
        errorMsg.classList.remove('active');

        let token = getCookie('user_access');
        let headers = { "Authorization": `Bearer ${token}` };

        beforeLoad(button);
        let response = await requestAPI(`${apiURL}/needs/${id}`, null, headers, "DELETE");
        if (response.status == 204) {
            afterLoad(button, 'Deleted');
            button.disabled = true;
            getMyNeedsList(requiredNeedDataURL);
            setTimeout(() => {
                document.querySelector(`.delModal`).click();
                button.disabled = false;
                afterLoad(button, 'Delete');
            }, 1200)
        }   
        else{
            afterLoad(button, buttonText);
            response.json().then(function(res) {
                displayMessages(res, errorMsg);
                errorMsg.classList.add('active');
            })
        }
    }
    catch (err) {
        console.log(err);
        afterLoad(button, 'Error');
    }
}


function generatePages(currentPage, totalPages, has_previous, has_next, recordCount, startRecord, endRecord, type='needs-search') {
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
            if (type == "needs-search")
                pagesContainer.innerHTML +=`<input type="number" oninput="validatePageNumber(this);" onkeypress="openSpecificPage(event, this);" min="1" max="${totalPages}" placeholder="..." class="page-number-input" />`;
            else
                pagesContainer.innerHTML += '<span class="ellipsis-container">...</span>';
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        pagesContainer.innerHTML += `<span${i === currentPage ? ' class="active"' : ' class="cursor-pointer"'}>${i}</span>`;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            if (type == "needs-search")
                pagesContainer.innerHTML +=`<input type="number" oninput="validatePageNumber(this);" onkeypress="openSpecificPage(event, this);" min="1" max="${totalPages}" placeholder="..." class="page-number-input" />`;
            else
                pagesContainer.innerHTML += '<span class="ellipsis-container">...</span>';
        }
        pagesContainer.innerHTML += `<span class="cursor-pointer">${totalPages}</span>`;
    }
    pagesContainer.querySelectorAll('span').forEach((span) => {
        if ((!span.classList.contains('active'))  && (!span.classList.contains('ellipsis-container'))) {
            let page = span.innerText;
            span.setAttribute("onclick", `getPage(${parseInt(page)}, '${type}')`);
        }
    })
    if (has_previous) {
        getFirstPageBtn.setAttribute('onclick', `getPage(1, '${type}')`);
        getFirstPageBtn.classList.remove('opacity-point-3-5');
        getPreviousPageBtn.setAttribute('onclick', `getPage(${currentPage - 1}, '${type}')`);
        getPreviousPageBtn.classList.remove('opacity-point-3-5');
    }
    else {
        getFirstPageBtn.removeAttribute('onclick');
        getFirstPageBtn.classList.add('opacity-point-3-5');
        getPreviousPageBtn.removeAttribute('onclick');
        getPreviousPageBtn.classList.add('opacity-point-3-5');
    }

    if (has_next) {
        getLastPageBtn.setAttribute('onclick', `getPage(${totalPages}, '${type}')`);
        getLastPageBtn.classList.remove('opacity-point-3-5');
        getNextPageBtn.setAttribute('onclick', `getPage(${currentPage + 1}, '${type}')`);
        getNextPageBtn.classList.remove('opacity-point-3-5');
    }
    else {
        getLastPageBtn.removeAttribute('onclick');
        getLastPageBtn.classList.add('opacity-point-3-5');
        getNextPageBtn.removeAttribute('onclick');
        getNextPageBtn.classList.add('opacity-point-3-5');
    }
}


function getPage(page, type='needs-search') {
    if (type == 'needs-search') {
        pageNumber = page;
        requiredSearchDataURL = setParams(requiredSearchDataURL, 'page', page);
        getRecords(requiredSearchDataURL);
    }
    else {
        requiredNeedDataURL = setParams(requiredNeedDataURL, 'page', page);
        getMyNeedsList(requiredNeedDataURL);
    }
}


function setPage(pageNum) {
    pageNumber = parseInt(pageNum) || 1;
}


function validatePageNumber(inputField) {
    let currentValue = parseInt(inputField.value);
    let maxValue = parseInt(inputField.max);
    let minValue = parseInt(inputField.min);
    
    if(currentValue > maxValue) {
        inputField.value = maxValue;
    }
    else if(currentValue < 1) {
        inputField.value = minValue;
    }
}


function openSpecificPage(event, inputField) {
    if (event.key === 'Enter') {
        getPage(parseInt(inputField.value));
    }
}

// save need modal

function openSaveNeedModal(event, modalId) {
    event.stopPropagation();
    let modal = document.querySelector(`#${modalId}`);
    let form = modal.querySelector("form");
    form.setAttribute("onsubmit", `SaveNeedForm(event);`);
    modal.addEventListener('hidden.bs.modal', event => {
        form.reset();
        form.removeAttribute("onsubmit");
        form.querySelector('.btn-text').innerText = 'Save';
        let errorMsg = form.querySelector('.input-error-msg');
        errorMsg.innerText = '';
        errorMsg.classList.remove('active');
    })
    document.querySelector(`.${modalId}`).click();
}

function SaveNeedForm(event){
    event.preventDefault();
    let form = event.target;
    let button = form.querySelector("button[type='submit']");
    let buttonText = button.querySelector(".btn-text");
    let formData = new FormData(form);
    let data = formDataToObject(formData);
    let errorMsg = form.querySelector('.input-error-msg');

    errorMsg.innerText = '';
    errorMsg.classList.remove('active');

    if (userData.user.sub == null) {
        errorMsg.innerText = 'Please select your plan to proceed.';
        errorMsg.classList.add('active');
        return false;
    }
    // if (data.need.trim().length == 0) {
    //     errorMsg.innerText = 'Please specify the need name.';
    //     errorMsg.classList.add('active');
    //     return false;
    // }
    if (selectedJobTitles.length == 0) {
        errorMsg.innerText = 'Please select atleast one job title.';
        errorMsg.classList.add('active');
        return false;
    }
    if (selectedSkills.length == 0) {
        errorMsg.innerText = 'Please select atleast one skill.';
        errorMsg.classList.add('active');
        return false;
    }
    if (selectedCityList.length == 0 && selectedStateList.length == 0 && selectedRegionList.length == 0 && selectedCountryList.length == 0) {
        errorMsg.innerText = 'Please select atleast one location.';
        errorMsg.classList.add('active');
        return false;
    }
    if (selectedStartDate == null) {
        errorMsg.innerText = 'Please select the start date.';
        errorMsg.classList.add('active');
        return false;
    }
    if (selectedEndDate != null && selectedStartDate >= selectedEndDate) {
        errorMsg.innerText = 'End date cannot be on or before start date.';
        errorMsg.classList.add('active');
        return false;
    }


    if (data.name == ''){
        errorMsg.innerText = 'Please enter a need name';
        errorMsg.classList.add('active');
        return false;
    }

    errorMsg.innerText = '';
    errorMsg.classList.remove('active');

    searchKeywords['name'] = data.name;
    beforeLoad(button);
    console.log(searchKeywords)
    createNeedSearch(searchKeywords);
    afterLoad(button, 'Saved');
    button.disabled = true;
    setTimeout(() => {
        button.disabled = false;
        afterLoad(button, buttonText);
        closeCurrentModal()
    }, 1500);
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
            if (index >= 9) { // Adjust to the number of initially visible skills
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
