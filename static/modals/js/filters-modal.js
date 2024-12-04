// Initialize tagging for different categories
const skillsTags = setupTagging('tag-container', 'tag-input', 'clear-skills-tags-button');
const jobTags = setupTagging('job-tag-container', 'job-tag-input', 'clear-jobs-tags-button');
const companyTags = setupTagging('company-tag-container', 'company-tag-input', 'clear-company-tags-button');

let mobileFilterInput = document.getElementById('Mobile');
let directFilterInput = document.getElementById('Direct');
let personalEmailFilterInput = document.getElementById('Personal-Email');
let workEmailFilterInput = document.getElementById('Work-Email');


function openFilterModal(modalId) {
    let modal = document.querySelector(`#${modalId}`);
    // let form = modal.querySelector("form");
    // form.setAttribute("onsubmit", `getFilterData(event);`);
    modal.addEventListener('hidden.bs.modal', event => {
        // form.reset();
        // form.removeAttribute("onsubmit");
        modal.querySelector('.btn-text').innerText = 'Apply Changes';
        document.querySelector('.create-error-msg').classList.remove('active');
        document.querySelector('.create-error-msg').innerText = "";
    })
    document.querySelector(`.${modalId}`).click();
}

function getFilterData() {
    // event.preventDefault();
    let form = filtersForm;
    let formData = new FormData(form);

    let skills_list = skillsTags.getTags();
    let jobs_title_list = jobTags.getTags();
    let company_name_list = companyTags.getTags();

    let contactDetails = [];
    const checkedContactDetails = document.querySelectorAll('input[name="contact_details"]:checked');
    checkedContactDetails.forEach((checkbox) => {
        contactDetails.push(checkbox.value);
    });

    let companySizeRanges = [];
    const checkedCompanySizeRanges = document.querySelectorAll('input[name="company_size_filter"]:checked');
    checkedCompanySizeRanges.forEach((checkbox) => companySizeRanges.push(checkbox.value));

    let seniorityLevelRanges = [];
    const checkedSeniorityLevels = document.querySelectorAll('input[name="seniority_level"]:checked');
    checkedSeniorityLevels.forEach((checkbox) => seniorityLevelRanges.push(checkbox.value));

    const contactOptionsCheckboxes = {
        is_phone1: mobileFilterInput,
        is_phone2: directFilterInput,
        is_email1: personalEmailFilterInput,
        is_email2: workEmailFilterInput
    };

    let data = Object.fromEntries(formData.entries());
    data.skills_list = skills_list || [];
    data.jobs_title_list = jobs_title_list || [];
    data.company_name_list = company_name_list || [];
    data.contact_details = contactDetails;
    data.company_size_ranges = companySizeRanges || [];
    data.seniority_level_ranges = seniorityLevelRanges || [];
    data.contact_options = contactOptionsCheckboxes;
    return data;
}


// -----------tags--------------------------
function setupTagging(tagContainerId, tagInputId, clearTagsButtonId) {
    const tagContainer = document.getElementById(tagContainerId);
    const tagInput = document.getElementById(tagInputId);
    const clearTagsButton = document.getElementById(clearTagsButtonId);

    let tags = [];

    tagInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const tagText = tagInput.value.trim();
            if (tagText !== '') {
                addTag(tagText);
                tagInput.value = '';
            }
        }
    });

    tagContainer.addEventListener('click', (e) => {
        let removeBtn = e.target.closest('.remove-tag');
        if (removeBtn && removeBtn.classList.contains('remove-tag')) {
            const tagValue = removeBtn.getAttribute('data-tag');
            removeTag(tagValue);
        }
    });

    clearTagsButton.addEventListener('click', (e) => {
        clearTags();
    });

    function addTag(tagText) {
        if (!tags.includes(tagText)) {
            tags.push(tagText);
            renderTags();
        }
    }

    function removeTag(tagText) {
        tags = tags.filter(tag => tag !== tagText);
        renderTags();
    }

    function clearTags() {
        tags = [];
        renderTags();
    }

    function renderTags() {
        tagContainer.innerHTML = '';
        tags.forEach(tag => {
            const tagElement = document.createElement('div');
            tagElement.classList.add('tag');
            tagElement.innerHTML = `<span>${tag}</span>
                                    <span class="remove-tag" data-tag="${tag}">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 4L4 12M4 4L12 12" stroke="#392680" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                    </span>`;
            tagContainer.appendChild(tagElement);
        });
        tagContainer.appendChild(tagInput);
        tagInput.focus();
    }

    return {
        getTags: () => tags
    };
}
// -----------tags--------------------------


const headcount_clear_btn =document.getElementById('clear-headcount-checkbox-button');
const contact_details_clear_btn = document.getElementById('clear-contact-details-button');
const seniority_clear_btn =document.getElementById('clear-seniority-level-button');

headcount_clear_btn.addEventListener("click", function(){
    var checkboxes = document.querySelectorAll('input[name=company_size_filter]');
    checkboxes.forEach(function(checkbox) {
        checkbox.checked = false;
    });
})

contact_details_clear_btn.addEventListener("click", function() {
    var checkboxes = document.querySelectorAll('input[name=contact_details]');
    checkboxes.forEach(function(checkbox) {
        checkbox.checked = false;
    });
    
    document.querySelector('input[name=contact_details_radio][value="or"]').checked = true;
})

seniority_clear_btn.addEventListener("click", function(){
    var checkboxes = document.querySelectorAll('input[name=seniority_level]');
    checkboxes.forEach(function(checkbox) {
        checkbox.checked = false;
    });
})

document.querySelector('#contact-name').addEventListener('keypress', function(event) {
    if (event.key == 'Enter')
        event.preventDefault();
})

function applySearch() {
    document.getElementById('search-result-btn').click();
}