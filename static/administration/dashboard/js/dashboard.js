// Search_labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
// Search_data1 = [5000, 7500, 8000, 6000, 9000,5000, 7500, 8000, 6000, 9000, 6000, 9000]
// Search_data2 = [5000, 7500, 8000, 6000, 9000,5000, 7500, 8000, 6000, 9000, 6000, 9000]
// Result_data_1 = [5000, 6000, 6500, 6000, 7500, 6500, 7500, 8000, 6000, 7000, 6000, 5000] 
// Result_data_2 = [5000, 6000, 6500, 6000, 7500, 6500, 7500, 8000, 6000, 7000, 6000, 5000] 
// active_subscriber_chart_data = [5000, 6000, 6500, 6000, 7500, 6500, 7500, 8000, 6000, 7000, 6000, 5000]
// revenue_data = [5000, 6000, 6500, 6000, 7500, 6500, 7500, 8000, 6000, 7000, 6000, 5000]

//Actual data
Search_labels = searchLabels ;
Search_data1 = number_of_searches;
Search_data2 = number_of_searches_without_results
Result_data_1 = average_results_per_search
Result_data_2 = total_results_per_month
Active_Companies = active_companies
Inactive_Comapnies = inactive_comapnies
Idividual_Free_Subscribers = idividual_free_subscribers
Idividual_Other_Subscribers = idividual_other_subscribers
Free_Subscriptions = free_subscriptions
Other_Subscriptions = other_subscriptions
active_subscriber_chart_data = active_subscriptions
// revenue_data = get_monthly_revenue

companies_data = [Active_Companies, Inactive_Comapnies]
contacts_data = [inactive_contacts, active_contacts]
subscibers_data = [Idividual_Other_Subscribers, Idividual_Free_Subscribers]
active_subscribers_data = [Other_Subscriptions, Free_Subscriptions]

doughnut_labels = ["Inactive","Active"]

var ctx =  document.getElementById ('areaChart1').getContext('2d'); 
var number_of_searcher_chart = new Chart(ctx, { 
    type: 'line', 
    data: { 
        labels: Search_labels,
        datasets: [{ 
            data: Search_data1,

            backgroundColor: (context) =>{
                const bgcolor =[
                'rgba(124, 0, 244, 0.19)',
                'rgba(255, 255, 255, 1)'
                ];
                if (!context.chart.chartArea){
                    return;
                }
                const { ctx, data, chartArea:{top, bottom} } =context.chart;
                const gradientbg =ctx.createLinearGradient(0,top, 0,bottom);
                const colorTranches = 1/ (bgcolor.length -1);
                for (let i=0; i < bgcolor.length; i++){
                    gradientbg.addColorStop(0 + i * colorTranches, bgcolor[i])
                }
                return gradientbg;
            }, 
            borderColor: 'rgba(75, 192, 192, 1)', 
            borderWidth: 0, 
            fill: 'start' 
        }] 
    }, 
    options: {
        tension: 0.4,
        responsive: true,
        maintainAspectRatio : true,
        scales: { 
            y: { 
                border: {
                    display: false,
                },
                beginAtZero: true,
                ticks:{
                    font: {
                        family: 'Poppins', // Your font family
                        size: 12,
                        weight: 600,
                    },
                    padding:10,
                    callback: function(value) {
                        var ranges = [
                           { divider: 1e6, suffix: 'M' },
                           { divider: 1e3, suffix: 'k' }
                        ];
                        function formatNumber(n) {
                           for (var i = 0; i < ranges.length; i++) {
                              if (n >= ranges[i].divider) {
                                 return (n / ranges[i].divider).toString() + ranges[i].suffix;
                              }
                           }
                           return n;
                        }
                        return formatNumber(value);
                     }
                }, 
                grid:{
                    display: false,
                    drawTicks: false,
                },
            },
            x:{
                border: {
                    display: false,
                },
                grid:{
                    display: false,
                    drawTicks: false,
                },
                ticks:{
                    font: {
                        family: 'Poppins', // Your font family
                        size: 12,
                        weight: 600,
                    },
                },
            }
        }, 
        plugins: {
            legend: {
                display: false,
            }
        }
    } 
}); 

var ctx = document.getElementById ('areaChart2').getContext('2d'); 
var searches_without_results_chart = new Chart(ctx, { 
    type: 'line', 
    data: { 
        labels:  Search_labels,
        datasets: [{ 
            data: Search_data2, 
            backgroundColor: (context) =>{
                const bgcolor =[
                'rgba(124, 0, 244, 0.19)',
                'rgba(255, 255, 255, 1)'
                ];
                if (!context.chart.chartArea){
                    return;
                }
                const { ctx, data, chartArea:{top, bottom} } =context.chart;
                const gradientbg =ctx.createLinearGradient(0,top, 0,bottom);
                const colorTranches = 1/ (bgcolor.length -1);
                for (let i=0; i < bgcolor.length; i++){
                    gradientbg.addColorStop(0 + i * colorTranches, bgcolor[i])
                }
                return gradientbg;
            },
            borderColor: 'rgba(75, 192, 192, 1)', 
            borderWidth: 0, 
            fill: 'start' 
        }] 
    }, 
    options: {
        tension: 0.4,
        responsive: true,
        maintainAspectRatio : true,
        scales: { 
            y: { 
                border: {
                    display: false,
                },
                beginAtZero: true,
                ticks:{
                    font: {
                        family: 'Poppins', // Your font family
                        size: 12,
                        weight: 600,
                    },
                    padding:10,
                    callback: function(value) {
                        var ranges = [
                           { divider: 1e6, suffix: 'M' },
                           { divider: 1e3, suffix: 'k' }
                        ];
                        function formatNumber(n) {
                           for (var i = 0; i < ranges.length; i++) {
                              if (n >= ranges[i].divider) {
                                 return (n / ranges[i].divider).toString() + ranges[i].suffix;
                              }
                           }
                           return n;
                        }
                        return formatNumber(value);
                     }
                }, 
                grid:{
                    display: false,
                    drawTicks: false,
                },
            },
            x:{
                border: {
                    display: false,
                },
                grid:{
                    display: false,
                    drawTicks: false,
                },
                ticks:{
                    font: {
                        family: 'Poppins', // Your font family
                        size: 12,
                        weight: 600,
                    },
                },
            }
        }, 
        plugins: {
            legend: {
                display: false,
            }
        }
    } 
}); 

var ctx = document.getElementById ('resultChart1').getContext('2d'); 
var myChart = new Chart(ctx, { 
        type: 'line', 
        data: { 
            labels: Search_labels, 
            datasets: [{ 
                data: Result_data_1, 
                backgroundColor: (context) =>{
                    const bgcolor =[
                    'rgba(124, 0, 244, 0.19)',
                    'rgba(255, 255, 255, 1)'
                    ];
                    if (!context.chart.chartArea){
                        return;
                    }
                    const { ctx, data, chartArea:{top, bottom} } =context.chart;
                    const gradientbg =ctx.createLinearGradient(0,top, 0,bottom);
                    const colorTranches = 1/ (bgcolor.length -1);
                    for (let i=0; i < bgcolor.length; i++){
                        gradientbg.addColorStop(0 + i * colorTranches, bgcolor[i])
                    }
                    return gradientbg;
                }, 
                borderColor: 'rgba(7, 12, 41, 1)', 
                borderWidth: 3, 
                fill: 'start' 
            }] 
        }, 
        options: {
            tension: 0.4,
            responsive: true,
            maintainAspectRatio : true,
            scales: { 
                y: {
                    border: {
                        display: false,
                    }, 
                    beginAtZero: true,
                    ticks:{
                        font: {
                            family: 'Poppins', // Your font family
                            size: 12,
                            weight: 600,
                        },
                        padding:10,
                        callback: function(value) {
                            var ranges = [
                               { divider: 1e6, suffix: 'M' },
                               { divider: 1e3, suffix: 'k' }
                            ];
                            function formatNumber(n) {
                               for (var i = 0; i < ranges.length; i++) {
                                  if (n >= ranges[i].divider) {
                                     return (n / ranges[i].divider).toString() + ranges[i].suffix;
                                  }
                               }
                               return n;
                            }
                            return formatNumber(value);
                         }
                    }, 
                    grid:{
                        display: false,
                        drawTicks: false,
                    },
                },
                x:{
                    display: false,
                    grid:{
                        display: false,
                        drawTicks: false,
                    },
                    ticks:{
                        font: {
                            family: 'Poppins', // Your font family
                            size: 12,
                            weight: 600,
                        },
                    },
                }
            }, 
            plugins: {
                legend: {
                    display: false,
                }
            }
        } 
}); 

var ctx = document.getElementById ('resultChart2').getContext('2d'); 
var myChart = new Chart(ctx, { 
    type: 'line', 
    data: { 
        labels: Search_labels, 
        datasets: [{ 
            data: Result_data_2, 
            backgroundColor: (context) =>{
                const bgcolor =[
                'rgba(124, 0, 244, 0.19)',
                'rgba(255, 255, 255, 1)'
                ];
                if (!context.chart.chartArea){
                    return;
                }
                const { ctx, data, chartArea:{top, bottom} } =context.chart;
                const gradientbg =ctx.createLinearGradient(0,top, 0,bottom);
                const colorTranches = 1/ (bgcolor.length -1);
                for (let i=0; i < bgcolor.length; i++){
                    gradientbg.addColorStop(0 + i * colorTranches, bgcolor[i])
                }
                return gradientbg;
            },
            borderColor: 'rgba(7, 12, 41, 1)', 
            borderWidth: 3, 
            fill: 'start' 
        }] 
    }, 
    options: {
        tension: 0.4,
        responsive: true,
        maintainAspectRatio : true,
        scales: { 
            y: { 
                border: {
                    display: false,
                },
                beginAtZero: true,
                ticks:{
                    font: {
                        family: 'Poppins', // Your font family
                        size: 12,
                        weight: 600,
                    },
                    padding:10,

                    callback: function(value) {
                        var ranges = [
                           { divider: 1e6, suffix: 'M' },
                           { divider: 1e3, suffix: 'k' }
                        ];
                        function formatNumber(n) {
                           for (var i = 0; i < ranges.length; i++) {
                              if (n >= ranges[i].divider) {
                                 return (n / ranges[i].divider).toString() + ranges[i].suffix;
                              }
                           }
                           return n;
                        }
                        return formatNumber(value);
                     }
                }, 
                grid:{
                    display: false,
                    drawTicks: false,
                },
                
            },
            x:{
                display: false,
                grid:{
                    display: false,
                    drawTicks: false,
                },
                ticks:{
                    font: {
                        family: 'Poppins', // Your font family
                        size: 12,
                        weight: 600,
                    },
                },
            }
        }, 
        plugins: {
            legend: {
                display: false,
            }
        }
    } 
}); 

var ctx = document.getElementById("companies-chart").getContext('2d');
var myChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
        labels: doughnut_labels,
        datasets: [{    
            data: companies_data, // Specify the data values array
            borderColor: ['#2196f38c', '#f443368c'], // Add custom color border 
            backgroundColor: ['#7C00F4', '#000000' ], // Add custom color background (Points and Fill)
            borderWidth: .2, // Specify bar border width
            
        }]},         
    options: {
        cutout:90,
        responsive: true, // Instruct chart js to respond nicely.
        maintainAspectRatio: false, // Add to prevent default behaviour of full-width/height 
        plugins:{
            legend:{
                position: 'bottom',
                labels:{
                    font: {
                        family: 'Poppins', // Your font family
                        size: 12,
                        weight: 600,
                    },
                },
            },
            
        }
    }
});

var ctx = document.getElementById("contacts-chart").getContext('2d');
var myChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
        labels: doughnut_labels,
        datasets: [{    
            data: contacts_data, // Specify the data values array
            borderColor: ['#2196f38c', '#f443368c'], // Add custom color border 
            backgroundColor: ['#7C00F4', '#000000' ], // Add custom color background (Points and Fill)
            borderWidth: .2, // Specify bar border width
            
        }]},         
    options: {
        cutout:90,
        responsive: true, // Instruct chart js to respond nicely.
        maintainAspectRatio: false, // Add to prevent default behaviour of full-width/height 
        plugins:{
            legend:{
                position: 'bottom',
                labels:{
                    font: {
                        family: 'Poppins', // Your font family
                        size: 12,
                        weight: 600,
                    },
                },
            },
            
        }
    }
});

var ctx = document.getElementById("subscribers-chart").getContext('2d');
var myChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
        labels: doughnut_labels,
        datasets: [{    
            data: subscibers_data, // Specify the data values array
            borderColor: ['#2196f38c', '#f443368c'], // Add custom color border 
            backgroundColor: ['#7C00F4', '#000000' ], // Add custom color background (Points and Fill)
            borderWidth: .2, // Specify bar border width
            
        }]},         
    options: {
        cutout:90,
        responsive: true, // Instruct chart js to respond nicely.
        maintainAspectRatio: false, // Add to prevent default behaviour of full-width/height 
        plugins:{
            legend:{
                position: 'bottom',
                labels:{
                    font: {
                        family: 'Poppins', // Your font family
                        size: 12,
                        weight: 600,
                    },
                },
            },
            
        }
    }
});

var ctx = document.getElementById("active-subscribers-chart").getContext('2d');
var myChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
        labels: doughnut_labels,
        datasets: [{    
            data: active_subscribers_data, // Specify the data values array
            borderColor: ['#2196f38c', '#f443368c'], // Add custom color border 
            backgroundColor: ['#7C00F4', '#000000' ], // Add custom color background (Points and Fill)
            borderWidth: .2, // Specify bar border width
            
        }]},         
    options: {
        cutout:90,
        responsive: true, // Instruct chart js to respond nicely.
        maintainAspectRatio: false, // Add to prevent default behaviour of full-width/height 
        plugins:{
            legend:{
                position: 'bottom',
                labels:{
                    font: {
                        family: 'Poppins', // Your font family
                        size: 12,
                        weight: 600,
                    },
                },
            },
            
        }
    }
});

var ctx = document.getElementById ('active-subscriber-chart').getContext('2d'); 
var active_subscriber_chart = new Chart(ctx, { 
        type: 'bar', 
        data: { 
            labels: Search_labels, 
            datasets: [
            {
                label: 'Silver',
                data: active_subscriptions_silver,
                backgroundColor: 'rgba(192,192,192,1)', // Silver color
                borderColor: 'rgba(192,192,192,1)',
                borderRadius: 25,
                borderSkipped: false,
                barThickness: 9,
            },
            {
                label: 'Gold',
                data: active_subscriptions_gold,
                backgroundColor: 'rgba(255,215,0,1)', // Gold color
                borderColor: 'rgba(255,215,0,1)',
                borderRadius: 25,
                borderSkipped: false,
                barThickness: 9,
            },
            {
                label: 'Platinum',
                data: active_subscriptions_platinum,
                backgroundColor: 'rgba(229,228,226,1)', // Platinum color
                borderColor: 'rgba(229,228,226,1)',
                borderRadius: 25,
                borderSkipped: false,
                barThickness: 9,
            },
            {
                label: 'Enterprise',
                data: active_subscriptions_enterprise,
                backgroundColor: 'rgba(0,0,0,1)', // Enterprise color (Black)
                borderColor: 'rgba(0,0,0,1)',
                borderRadius: 25,
                borderSkipped: false,
                barThickness: 9,
            }
        ] 
        }, 
        options: {
            responsive: true,
            maintainAspectRatio : true,
            scales: { 
                y: { 
                    display: false,
                    beginAtZero: true,
                    ticks:{
                        font: {
                            family: 'Poppins', // Your font family
                            size: 12,
                            weight: 600,
                        },
                    }, 
                    grid:{
                        display: false,
                        drawTicks: false,
                    },
                },
                x:{
                    border: {
                        display: false,
                    },             
                    grid:{
                        display: false,
                        drawTicks: false,
                    },
                    ticks:{
                        font: {
                            family: 'Poppins', // Your font family
                            size: 12,
                            weight: 600,
                        },
                    },
                }
            }, 
            plugins: {
                legend: {
                    display: false,
                    position: 'bottom',
                    align: 'center',
                    labels:{
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: {
                            family: 'Poppins', // Your font family
                            size: 12,
                            weight: 600,
                        },
                    },
                }
            }
        } 
}); 

var ctx = document.getElementById ('revenue-chart').getContext('2d'); 
var revenue_chart = new Chart(ctx, { 
    type: 'bar', 
    data: { 
        labels: Search_labels, 
        datasets: [{ 
            data: [], 
            backgroundColor: 'rgba(7, 12, 41, 1)', 
            borderColor: 'rgba(7, 12, 41, 1)', 
            borderRadius: 25,
            // borderRadius: Number.MAX_VALUE,
            borderSkipped: false,
            barThickness: 18,
            barPercentage: .5,
        }] 
    }, 
    options: {
        responsive: true,
        maintainAspectRatio : true,
        scales: {
            y: { 
                display: false,
                beginAtZero: true,
                ticks:{
                    font: {
                        family: 'Poppins', // Your font family
                        size: 12,
                        weight: 600,
                    },
                    callback: function(value) {
                        var ranges = [
                           { divider: 1e6, suffix: 'M' },
                           { divider: 1e3, suffix: 'k' }
                        ];
                        function formatNumber(n) {
                           for (var i = 0; i < ranges.length; i++) {
                              if (n >= ranges[i].divider) {
                                 return (n / ranges[i].divider).toString() + ranges[i].suffix;
                              }
                           }
                           return n;
                        }
                        return formatNumber(value);
                     }
                }, 
                grid:{
                    display: false,
                    drawTicks: false,
                },
            },
            x:{
                border: {
                    display: false,
                    },           
                grid:{
                    display: false,
                    drawTicks: false,
                },
                ticks:{
                    font: {
                        family: 'Poppins', // Your font family
                        size: 12,
                        weight: 600,
                    },
                },
            }
        }, 
        plugins: {
            legend: {
                display: false,
            }
        },
    } 
}); 

function selectFilter(filterType) {
    document.getElementById('selected-filter-text').innerText = filterType;
    // document.getElementById('search-result-btn').classList.remove('opacity-point-2');
    // document.getElementById('search-result-btn').disabled = false;
}

function selectFilterCategory(filterType){
    document.getElementById('selected-filter-text-category').innerText = filterType;
}

function getLastNYears(n=0) {
    const currentYear = new Date().getFullYear();
    let lastNYears = [];
    for (let i = currentYear; i >= currentYear - n; i--) {
        lastNYears.push(i);
    }
    return lastNYears;
}

window.addEventListener('load', function() {
    const yearList = getLastNYears(3);
    const currentYear = new Date().getFullYear();
    document.getElementById('selected-filter-text-category').innerText = currentYear;

    const dropdown_list_container = document.querySelector('.dropdown-list');
    dropdown_list_container.innerHTML = '';

    yearList.forEach((year) => {
        let label = document.createElement('label');
        label.setAttribute('for', year);
        label.classList.add('dropdown-item', 'cursor-pointer');
        label.setAttribute('onclick', `selectFilterCategory('${year}');`);
        label.setAttribute('onchange', `submitForm('activesubscriptionchartcontainer');`);

        label.innerHTML = `<input type="radio" name="selected_year" value="${year}" id="${year}" ${year == currentYear ? 'checked' : '' } class="form-check-input cursor-pointer" />
                           <span class="terms-checkbox-label cursor-pointer">${year}</span>`;

        dropdown_list_container.appendChild(label);
    });
});

function selectDate(id, show_date) {
    var datePicker = document.getElementById(id);
    datePicker.previousElementSibling.classList.add('hide');

    document.getElementById(show_date).textContent = '';
    datePicker.style.display = 'block';
    datePicker.style.border = 'none'
    datePicker.style.fontSize = '9px'

    datePicker.addEventListener('change', function() {       
        datePicker.style.border = 'none'
        document.getElementById(show_date).textContent = datePicker.value;
        datePicker.style.display = 'none';
        datePicker.value = datePicker.value;
        datePicker.previousElementSibling.classList.remove('hide');
    });
    datePicker.click();
}

function AddUnits(value) {
    var ranges = [
       { divider: 1e6, suffix: 'M' },
       { divider: 1e3, suffix: 'k' }
    ];
    function formatNumber(n) {
       for (var i = 0; i < ranges.length; i++) {
          if (n >= ranges[i].divider) {
             return (n / ranges[i].divider).toFixed(1) + ranges[i].suffix; // Added toFixed(1) for better formatting
          }
       }
       return n.toString(); // Ensure the return value is a string
    }
    return formatNumber(value);
}

async function submitForm(conatainerId) {
    container = document.getElementById(`${conatainerId}`)
    console.log(container)
    form = container.querySelector(`form`)
    chart = container.querySelector(`canvas`).getAttribute("name")
    local_tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (chart == 'number_of_searches_chart'){
        chart = number_of_searcher_chart
    }
    else if(chart == 'searches_without_results_chart'){
        chart = searches_without_results_chart
    }
    else if(chart == 'active_subscriber_chart'){
        chart = active_subscriber_chart
    }
    else if(chart == 'revenue_chart'){
        chart = revenue_chart
    }

    let formData = new FormData(form);
    let data = formDataToObject(formData);
    formData.append('local_tz', local_tz);
    console.log('form ', data)
    let headers = { "X-CSRFToken": data.csrfmiddlewaretoken };
    let response = await requestAPI("/administration/dashboard-data/", formData, headers, "POST");
    response.json().then(function (res) {
        if (res.success){
            console.log('response ',res)
            chart_name = container.querySelector(`canvas`).getAttribute("name")
            if (chart_name == 'number_of_searches_chart'){
                chart.data.labels = res.search_labels;
                chart.data.datasets[0].data = res.number_of_searches;
                chart.update();
            }
            else if(chart_name == 'searches_without_results_chart'){
                chart.data.labels = res.search_labels;
                chart.data.datasets[0].data = res.number_of_searches_without_results;
                chart.update();
            }
            else if(chart_name == 'active_subscriber_chart'){
                chart.data.labels = res.search_labels;
                chart.data.datasets[0].data = res.active_subscriptions_silver;
                chart.data.datasets[1].data = res.active_subscriptions_gold;
                chart.data.datasets[2].data = res.active_subscriptions_platinum;
                chart.data.datasets[3].data = res.active_subscriptions_enterprise;
                chart.update();
            }
            else if(chart_name == 'revenue_chart'){
                chart.data.labels = res.search_labels;
                chart.data.datasets[0].data = res.monthly_revenue;
                chart.update();
                var total_revenue = AddUnits(res.total_revenue);
                container.querySelector("#total_revenue").innerText = total_revenue;
                container.querySelector(".growth").innerText = `${res.revenue_percentage_change.toFixed(2)}%`;
                if (res.revenue_percentage_change > 0) {
                    container.querySelector(".growth").innerText = `+${res.revenue_percentage_change.toFixed(2)}%`;  
                } 
            }
        }
        else{
            console.log('error')
        }
    })    
}

window.addEventListener("load", async function() {
    let response = await requestAPI("/administration/get-yearly-revenue/", null, {}, "POST");
    response.json().then(function (res) {
        if (res.success){
            console.log('resp', res)
            chart_name = document.querySelector("#revenue-chart").getAttribute("name")
            if(chart_name == 'revenue_chart'){
                document.querySelector('.revenue-loader').classList.add("hide");
                chart_name = document.querySelector("#revenue-chart").classList.remove("hide");
                chart = revenue_chart;
                chart.data.labels = res.search_labels;
                chart.data.datasets[0].data = res.get_monthly_revenue;
                chart.update();
                var total_revenue = AddUnits(res.total_revenue);
                document.querySelector("#total_revenue").innerText = total_revenue;
                document.querySelector("#revenue_percentage_change").innerText = `${res.revenue_percentage_change.toFixed(2)}%`;
                if (res.revenue_percentage_change > 0) {
                    document.querySelector(".growth").innerText = `+${res.revenue_percentage_change.toFixed(2)}%`;  
                } 
            }
        }
        else{
            console.log("error")
        }
    })
});

// air date pciker 
const localeEn = {
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    daysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    daysMin: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    today: 'Today',
    clear: 'Clear',
    dateFormat: 'yyyy-MM-dd',
    timeFormat: 'hh:ii',
    firstDay: 1
}

let sdp = new AirDatepicker('#start_date_picker', {
    autoClose: true,
    locale: localeEn,
    onSelect: () => {
        submitForm('NumberOfSearcheContainer');
    }
});

let edp = new AirDatepicker('#end_date_picker', {
    autoClose: true,
    locale: localeEn,
    onSelect: () => {
        submitForm('NumberOfSearcheContainer');
    }
});

let new_sdp = new AirDatepicker('#result_date_picker', {
    autoClose: true,
    locale: localeEn,
    position({ $datepicker, $target, $pointer }) {
        let coords = $target.getBoundingClientRect(),
            dpHeight = $datepicker.clientHeight,
            dpWidth = $datepicker.clientWidth;
    
        // Set the top position to be the bottom of the target element plus some offset (e.g., 10px)
        let top = coords.bottom + window.scrollY + 15;
        // Center the date picker horizontally with respect to the target element
        let left = coords.left + window.scrollX + (coords.width / 2) - (dpWidth / 2);
    
        $datepicker.style.left = `${left}px`;
        $datepicker.style.top = `${top}px`;
    
        $pointer.style.display = 'none';
    },            
    onSelect: () => {
        submitForm('SearchedWithoutResultContainer');
    }
});

let new_edp = new AirDatepicker('#result_end_date_picker', {
    autoClose: true,
    locale: localeEn,
    position({ $datepicker, $target, $pointer }) {
        let coords = $target.getBoundingClientRect(),
            dpHeight = $datepicker.clientHeight,
            dpWidth = $datepicker.clientWidth;
    
        // Set the top position to be the bottom of the target element plus some offset (e.g., 10px)
        let top = coords.bottom + window.scrollY + 15;
        
        // Set the initial left position to align the date picker with the right edge of the target element
        let left = coords.left + window.scrollX + coords.width - dpWidth;
    
        // Ensure the date picker does not go outside the left edge of the screen
        if (left < 0) {
            left = 0;
        }
    
        // Ensure the date picker does not go outside the right edge of the screen
        let maxLeft = window.innerWidth - dpWidth;
        if (left > maxLeft) {
            left = maxLeft;
        }
    
        $datepicker.style.left = `${left}px`;
        $datepicker.style.top = `${top}px`;
    
        $pointer.style.display = 'none';
    },            
    onSelect: () => {
        submitForm('SearchedWithoutResultContainer');
    }
});

let new_rev_sdp = new AirDatepicker('#revenue_start_date_picker', {
    autoClose: true,
    locale: localeEn,
    position({ $datepicker, $target, $pointer }) {
        let coords = $target.getBoundingClientRect(),
            dpHeight = $datepicker.clientHeight,
            dpWidth = $datepicker.clientWidth;
    
        // Set the top position to be the bottom of the target element plus some offset (e.g., 10px)
        let top = coords.bottom + window.scrollY + 15;
        
        // Set the initial left position to align the date picker with the right edge of the target element
        let left = coords.left + window.scrollX + coords.width - dpWidth;
    
        // Ensure the date picker does not go outside the left edge of the screen
        if (left < 0) {
            left = 0;
        }
    
        // Ensure the date picker does not go outside the right edge of the screen
        let maxLeft = window.innerWidth - dpWidth;
        if (left > maxLeft) {
            left = maxLeft;
        }
    
        $datepicker.style.left = `${left}px`;
        $datepicker.style.top = `${top}px`;
    
        $pointer.style.display = 'none';
    },            
    onSelect: () => {
        submitForm('revenuecontainer');
    }
});

let new_rev_edp = new AirDatepicker('#revenue_end_date_picker', {
    autoClose: true,
    locale: localeEn,
    position({ $datepicker, $target, $pointer }) {
        let coords = $target.getBoundingClientRect(),
            dpHeight = $datepicker.clientHeight,
            dpWidth = $datepicker.clientWidth;
    
        // Set the top position to be the bottom of the target element plus some offset (e.g., 10px)
        let top = coords.bottom + window.scrollY + 15;
        
        // Set the initial left position to align the date picker with the right edge of the target element
        let left = coords.left + window.scrollX + coords.width - dpWidth;
    
        // Ensure the date picker does not go outside the left edge of the screen
        if (left < 0) {
            left = 0;
        }
    
        // Ensure the date picker does not go outside the right edge of the screen
        let maxLeft = window.innerWidth - dpWidth;
        if (left > maxLeft) {
            left = maxLeft;
        }
    
        $datepicker.style.left = `${left}px`;
        $datepicker.style.top = `${top}px`;
    
        $pointer.style.display = 'none';
    },            
    onSelect: () => {
        submitForm('revenuecontainer');
    }
});
