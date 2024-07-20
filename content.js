// Function to apply custom styles based on the selected theme
function applyCustomStyles() {
  chrome.storage.local.get(['selectedTheme'], function(result) {
    const url = window.location.href;
    let cssFileBaseName = '';

    if (url.includes('/News')) {
      cssFileBaseName = 'newsStyles';
    } else if (url.includes('/Classification/')) {
      cssFileBaseName = 'classificationStyles';
    } else if (url.includes('/Absent/')) {
      cssFileBaseName = 'absenceStyles';
    } else if (url.includes('/Attendance')) {
      cssFileBaseName = 'attendanceStyles';
    } else if (url.includes('/TimeTable/School')) {
      cssFileBaseName = 'timetableschoolStyles';
    } else if (url.includes('/TimeTable/PersonalNew')) {
      cssFileBaseName = 'timetablepersonalStyles';
    } else if (url.includes('/Finance/Info')) {
      cssFileBaseName = 'financeStyles';
    } else if (url.includes('/ResitExam/Index')) {
      cssFileBaseName = 'resitexamStyles';
    } else if (url.includes('/Document/List')) {
      cssFileBaseName = 'documentStyles';
    } else if (url.includes('/Election/Project')) {
      cssFileBaseName = 'projectelectionStyles';
    } else if (url.includes('/Election/Subject')) {
      cssFileBaseName = 'subjectelectionStyles';
    } else if (url.includes('/Account/UserProfile')) {
      cssFileBaseName = 'profileStyles';
    } else if (url.includes('/Account/ChangePassword')) {
      cssFileBaseName = 'changepasswordStyles';
    } else if (url.includes('/Account/Login')) {
      cssFileBaseName = 'loginStyles';
    } else if (url.includes('/Work/List/')) {
      cssFileBaseName = 'workStyles';
    }

    // Determine which CSS file to load based on the stored theme
    let themeSuffix = '';
    if (result.selectedTheme === 'theme2') {
      themeSuffix = '2';
    } else if (result.selectedTheme === 'theme3') {
      themeSuffix = '3';
    }

    const cssFileName = cssFileBaseName + themeSuffix + '.css';

    if (cssFileName) {
      const link = document.createElement('link');
      link.href = chrome.runtime.getURL(cssFileName);
      link.type = 'text/css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  });
}

applyCustomStyles();

// Update text color based on background color
function updateTextColorBasedOnBgColor() {
  const allElements = document.querySelectorAll('*');
  const colorMapping = {
    'rgba(255, 0, 0, 0.33)': '#FFFFFF',
    'rgb(32, 35, 42)': '#FFFFFF',
    'rgb(211, 211, 211)': '#000000',
    'rgb(249, 249, 249)': '#000000',
    'rgb(255, 255, 255)': '#000000',
  };

  allElements.forEach(element => {
    const style = window.getComputedStyle(element);
    Object.entries(colorMapping).forEach(([bgColor, textColor]) => {
      if (style.backgroundColor === bgColor) {
        element.style.color = textColor;
      }
    });
  });
}


// TIME LINE
function updateCurrentTimeLine() {

  if (window.location.href !== 'https://sis.ssakhk.cz/TimeTable/PersonalNew') {
    return;
  }

  const timetableDiv = document.querySelector('div.timetable');
  if (!timetableDiv) {
    console.log('[Kyberna MB] Timetable div not found');
    return;
  }

  let currentTimeLine = document.getElementById('current-time-line');
  if (!currentTimeLine) {
    console.log('[Kyberna MB] Current time line not found, creating a new one...');
    currentTimeLine = document.createElement('div');
    currentTimeLine.id = 'current-time-line';
    currentTimeLine.style.opacity = '0';
    timetableDiv.appendChild(currentTimeLine);

    setTimeout(() => {
      currentTimeLine.style.opacity = '1';
    }, 250);
  }

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  console.log(`[Kyberna MB] Current time: ${currentHour}:${currentMinute}`);

  const timeToPixel = {
    7: 285,
    8: 375,
    9: 469,
    10: 560,
    11: 652,
    12: 743,
    13: 835,
    14: 927,
    15: 1019,
    16: 1110,
    17: 1202,
    18: 1295,
    19: 1383
  };

  let previousHour = null;
  let nextHour = null;
  for (const hour of Object.keys(timeToPixel).map(Number).sort((a, b) => a - b)) {
    if (hour <= currentHour) {
      previousHour = hour;
    }
    if (hour > currentHour && nextHour === null) {
      nextHour = hour;
    }
  }

  if (currentHour >= 7 && currentHour < 19) {
    let topPosition;
    if (previousHour !== null && nextHour !== null) {
      const pixelDifference = timeToPixel[nextHour] - timeToPixel[previousHour];
      const hourDifference = nextHour - previousHour;
      const minutesSincePreviousHour = (currentHour - previousHour) * 60 + currentMinute;

      const percentageThroughPeriod = minutesSincePreviousHour / (hourDifference * 60);
      topPosition = timeToPixel[previousHour] + pixelDifference * percentageThroughPeriod;
      
    } else {
      topPosition = timeToPixel[currentHour] ?? timeToPixel[7];
    }

    currentTimeLine.style.top = `${topPosition}px`;

    const computedStyle = window.getComputedStyle(timetableDiv);
    const paddingAndBorderAdjustment = parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight) + parseFloat(computedStyle.borderLeftWidth) + parseFloat(computedStyle.borderRightWidth);
    const correctWidth = timetableDiv.clientWidth - paddingAndBorderAdjustment;
    currentTimeLine.style.width = `${correctWidth}px`;

    currentTimeLine.style.display = 'block';
  } else {
    console.log('[Kyberna MB] Current time is outside the display range');
    currentTimeLine.style.display = 'none';
  }
}







// Update colspan elements with month names
function updateColspanWithCzechMonths() {
  const czechMonths = {
    '1': 'Leden', '2': 'Únor', '3': 'Březen', '4': 'Duben',
    '5': 'Květen', '6': 'Červen', '7': 'Červenec', '8': 'Srpen',
    '9': 'Září', '10': 'Říjen', '11': 'Listopad', '12': 'Prosinec'
  };

  const colspanElements = document.querySelectorAll('td[colspan="13"]');
  colspanElements.forEach(element => {
    const matches = element.textContent.match(/Mesic (\d+)/);
    if (matches && matches[1]) {
      const monthNumber = matches[1];
      element.textContent = element.textContent.replace(matches[0], 'Měsíc ' + czechMonths[monthNumber]);
    }
  });
}

// Function to check for error and redirect
function checkForErrorAndRedirect() {
  const errorMessage = document.querySelector('h1');
  if (errorMessage && errorMessage.textContent.includes('Server Error in \'/\' Application.')) {
    console.log("No you can't go here silly x3");
    window.location.href = 'https://sis.ssakhk.cz/News';
    
  }
}
window.addEventListener('load', checkForErrorAndRedirect);


// Function to fetch the update from the server and update the #updateTab element
function fetchUpdate() {
  console.log('[Kyberna MB] Initiating AJAX request to fetch update from server...');
  $.ajax({
    url: 'https://109.80.40.13:7000/update', // Server URL (HTTPS)
    type: 'GET',
    success: function(response) {
      console.log('[Kyberna MB] Server response received.');
      if (response && response.updated_content && response.updated_date) {
        const dateSpan = document.querySelector('.dateSpan');
        const updateTab = document.getElementById('updateTab');
        dateSpan.innerText = response.updated_date;
        const formattedUpdates = response.updated_content
          .split('\n')
          .map(line => `• ${line}`)
          .join('<br>');
        updateTab.innerHTML = formattedUpdates;
        console.log('[Kyberna MB] Update content inserted into #updateTab.');

        // Save the data to Chrome local storage
        chrome.storage.local.set({
          updateData: {
            date: response.updated_date,
            content: response.updated_content
          }
        }, function() {
          if (chrome.runtime.lastError) {
            console.error('[Kyberna MB] Error saving data to Chrome local storage:', chrome.runtime.lastError);
          } else {
            console.log('[Kyberna MB] Update data saved to Chrome local storage.');
          }
        });
      } else {
        console.log('[Kyberna MB] Server response does not contain expected data.');
      }
    },
    error: function(jqXHR, textStatus, errorThrown) {
      console.error('[Kyberna MB] Error loading data:', textStatus, errorThrown);
      console.log('[Kyberna MB] Detailed error information:', jqXHR);

      // Load data from Chrome local storage if server is offline
      chrome.storage.local.get(['updateData'], function(result) {
        if (chrome.runtime.lastError) {
          console.error('[Kyberna MB] Error loading data from Chrome local storage:', chrome.runtime.lastError);
        } else if (result.updateData) {
          const dateSpan = document.querySelector('.dateSpan');
          const updateTab = document.getElementById('updateTab');
          dateSpan.innerText = result.updateData.date;
          const formattedUpdates = result.updateData.content
            .split('\n')
            .map(line => `• ${line}`)
            .join('<br>');
          updateTab.innerHTML = formattedUpdates;
          console.log('[Kyberna MB] Loaded update data from Chrome local storage.');
        } else {
          console.log('[Kyberna MB] No saved update data found in Chrome local storage. Setting to default values.');
          const dateSpan = document.querySelector('.dateSpan');
          const updateTab = document.getElementById('updateTab');
          dateSpan.innerText = 'NaN';
          updateTab.innerHTML = 'Unavailable';
        }
      });
    }
  });
}

// Function to insert update.html into news page and apply styles
function insertContentAndApplyStyles() {
  console.log('[Kyberna MB] Running insertContentAndApplyStyles.');

  if (window.location.href === 'https://sis.ssakhk.cz/News') {
    console.log('[Kyberna MB] Correct URL detected.');

    const h2Element = document.querySelector('h2.text-center');
    if (!h2Element) {
      console.error('[Kyberna MB] h2 element not found.');
      return;
    }

    console.log('[Kyberna MB] h2 element found.');
    
    const version = chrome.runtime.getManifest().version;
    console.log('[Kyberna MB] Extension version:', version);

    // Function to determine the CSS file name based on the selected theme
    function determineCssFileName(theme) {
      console.log('[Kyberna MB] Determining CSS file name for theme:', theme);
      switch (theme) {
        case 'theme2': return 'updateStyles2.css';
        case 'theme3': return 'updateStyles3.css';
        default: return 'updateStyles.css';
      }
    }

    chrome.storage.local.get(['selectedTheme'], function(result) {
      console.log('[Kyberna MB] Selected theme:', result.selectedTheme);
      
      const cssFile = determineCssFileName(result.selectedTheme);
      const updateHtmlUrl = chrome.runtime.getURL('update.html');
      const updateCssUrl = chrome.runtime.getURL(cssFile);

      console.log('[Kyberna MB] Fetching update.html from URL:', updateHtmlUrl);
      console.log('[Kyberna MB] Fetching CSS from URL:', updateCssUrl);

      Promise.all([
        fetch(updateHtmlUrl).then(response => {
          console.log('[Kyberna MB] Fetched update.html.');
          return response.text();
        }),
        fetch(updateCssUrl).then(response => {
          console.log('[Kyberna MB] Fetched CSS.');
          return response.text();
        })
      ])
      .then(([htmlContent, cssContent]) => {
        console.log('[Kyberna MB] Processing fetched content.');
        
        const updatedHtmlContent = htmlContent.replace(/\{\{version\}\}/g, version);

        const styleEl = document.createElement('style');
        styleEl.textContent = cssContent;
        document.head.appendChild(styleEl);

        console.log('[Kyberna MB] Inserted CSS into head.');

        // Check if the h2 element exists
        if (h2Element) {
          h2Element.insertAdjacentHTML('afterend', updatedHtmlContent);
          console.log('[Kyberna MB] Inserted update.html content after h2 element.');

          // Load saved data from Chrome local storage immediately
          chrome.storage.local.get(['updateData'], function(result) {
            if (chrome.runtime.lastError) {
              console.error('[Kyberna MB] Error loading data from Chrome local storage:', chrome.runtime.lastError);
            } else if (result.updateData) {
              const dateSpan = document.querySelector('.dateSpan');
              const updateTab = document.getElementById('updateTab');
              dateSpan.innerText = result.updateData.date;
              const formattedUpdates = result.updateData.content
                .split('\n')
                .map(line => `• ${line}`)
                .join('<br>');
              updateTab.innerHTML = formattedUpdates;
              console.log('[Kyberna MB] Loaded update data from Chrome local storage.');
            } else {
              console.log('[Kyberna MB] No saved update data found in Chrome local storage. Setting to default values.');
              const dateSpan = document.querySelector('.dateSpan');
              const updateTab = document.getElementById('updateTab');
              dateSpan.innerText = 'NaN';
              updateTab.innerHTML = 'Unavailable';
            }
          });

          // Fetch the update from the server
          fetchUpdate();
        }
      })
      .catch(error => console.error('[Kyberna MB] Error loading content:', error));
    });
  } else {
    console.log('[Kyberna MB] URL does not match https://sis.ssakhk.cz/News.');
  }
}

// Function set the title of the page
function setTitleIfURLMatches() {
  if (window.location.href === 'https://sis.ssakhk.cz/TimeTable/PersonalNew') {
    document.title = 'KybernaIS - Rozvrh';
  }
  if (window.location.href === 'https://sis.ssakhk.cz/TimeTable/School') {
    document.title = 'KybernaIS - Rozvrh';
  }
  if (window.location.href === 'https://sis.ssakhk.cz/Absent/My') {
    document.title = 'KybernaIS - Absence';
  }
  if (window.location.href === 'https://sis.ssakhk.cz/Document/List') {
    document.title = 'KybernaIS - Dokumenty';
  }
  if (window.location.href === 'https://sis.ssakhk.cz/Election/Project') {
    document.title = 'KybernaIS - Volba Projektů';
  }
  if (window.location.href === 'https://sis.ssakhk.cz/Election/Subject') {
    document.title = 'KybernaIS - Volba Předmětů';
  }
  if (window.location.href === 'https://sis.ssakhk.cz/Account/UserProfile') {
    document.title = 'KybernaIS - Profil';
  }
  if (window.location.href === 'https://sis.ssakhk.cz/Account/ChangePassword') {
    document.title = 'KybernaIS - Změna Hesla';
  }
  if (window.location.href.includes('https://sis.ssakhk.cz/Account/Login')) {
    document.title = 'KybernaIS - Přihlášení';
}
}

// Function change favicon for domain
function changeFaviconForDomain() {
  if (window.location.href.startsWith('https://sis.ssakhk.cz/')) {
    const link = document.createElement('link');
    const oldLinks = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]');

    link.rel = 'icon';
    link.type = 'image/png';
    link.href = 'https://gcdnb.pbrd.co/images/CDpSp5R80QKE.png?o=1';

    // Remove existing favicons
    oldLinks.forEach(oldLink => {
      oldLink.parentNode.removeChild(oldLink);
    });

    document.head.appendChild(link);
  }
}

// Function to insert content after the div (Better aktuální/stálý switch)
function insertContentAfterDiv() {
  const urlRegex = /^https:\/\/sis\.ssakhk\.cz\/TimeTable\/PersonalNew(\/\d+)?$/;

  if (urlRegex.test(window.location.href)) {
    const divElement = document.querySelector('div.static-switch');

    const labelHtmlContent = `
      <label class="sliderLabel">Aktuální</label>
    `;

    const styleHtmlContent = `
      <style>
        .sliderLabel {
          display: inline-block;
          margin-left: -5px;
          color: white;
          font-size: 16px;
          position: relative;
          top: -11px;
        }
      </style>
    `;

    // Check
    if (divElement) {
      document.head.insertAdjacentHTML('beforeend', styleHtmlContent);
      divElement.insertAdjacentHTML('afterend', labelHtmlContent);
      setUpCheckboxListener();
    }
  }
}

// Function to set up the checkbox listener
function setUpCheckboxListener() {
  const checkbox = document.querySelector('.static-switch input[type="checkbox"]');
  const label = document.querySelector('.sliderLabel');

  if (checkbox && label) {
    checkbox.addEventListener('change', () => {
      label.textContent = checkbox.checked ? 'Stálý' : 'Aktuální';
    });
  }
}

// Function to insert the navbar toggle button
function insertNavbarToggleButton() {
  if (window.location.href.startsWith('https://sis.ssakhk.cz/') && 
      !window.location.href.match(/\.(jpg|png)$/i)) {

      const bodyElement = document.querySelector('body');
      const navbar = document.querySelector('.navbar.navbar-inverse.navbar-fixed-top');

      const navbarToggleHtmlContent = `
          <button id="navbar-toggle" style="position: fixed; top: 10px; z-index: 10000001;">☰</button>
      `;

      if (bodyElement) {
          bodyElement.insertAdjacentHTML('afterbegin', navbarToggleHtmlContent);
          setUpNavbarToggleListener();

          // Check localStorage and update navbar visibility
          const navbarHidden = localStorage.getItem('navbarHidden') === 'true';
          if (navbarHidden && navbar) {
              navbar.style.transition = 'none';
              navbar.style.top = '-' + navbar.offsetHeight + 'px';
              setTimeout(() => {
                  navbar.style.transition = 'top 0.5s ease';
              }, 50);
          }
      }
  }
}

// Function to set up the navbar toggle listener
function setUpNavbarToggleListener() {
  const toggleBtn = document.getElementById('navbar-toggle');
  const navbar = document.querySelector('.navbar.navbar-inverse.navbar-fixed-top');

  if (toggleBtn && navbar) {
    toggleBtn.addEventListener('click', () => {
      const isHidden = navbar.style.top === '-' + navbar.offsetHeight + 'px';
      navbar.style.top = isHidden ? '0px' : '-' + navbar.offsetHeight + 'px';

      // Save the state to localStorage
      localStorage.setItem('navbarHidden', !isHidden);
    });
  }
}



// Function to insert modern tables with headers
if (window.location.href.includes('https://sis.ssakhk.cz/Classification')) {

  function insertModernTables(data, container) {
      container.innerHTML = '';

      data.forEach(([header, ...tableData]) => {
          let table = document.createElement('table');
          table.className = 'modern-table';

          let tableHeader = document.createElement('div');
          tableHeader.className = 'modern-table-header';
          tableHeader.innerText = header;
          container.appendChild(tableHeader);

          let headerRow = document.createElement('thead');
          let headers = tableData.shift();
          headers.forEach(headerText => {
              let th = document.createElement('th');
              th.innerText = headerText;
              headerRow.appendChild(th);
          });
          table.appendChild(headerRow);

          let isClosed = false;
          let typColumnIndex = headers.indexOf('Typ');

          tableData.forEach((rowData, rowIndex) => {
              let row = document.createElement('tr');

              rowData.forEach((cellData, cellIndex) => {
                  let cell = document.createElement('td');
                  cell.innerText = cellData;

                  if (cellIndex === typColumnIndex && cellData.trim() === '*') {
                      isClosed = true;
                  }

                  if (rowIndex === tableData.length - 1) {
                      row.className = 'final-grade-row';
                      if (cellIndex === 1) {
                          cell.classList.add('final-grade-cell');

                          if (cellData.toLowerCase() === 'n') {
                              cell.style.color = 'red';
                          } else {
                              let grade = parseFloat(cellData.replace(',', '.'));
                              if (!isNaN(grade)) {
                                  if (grade >= 1.0 && grade <= 1.49) {
                                      cell.style.color = 'lime';
                                  } else if (grade >= 1.5 && grade <= 2.49) {
                                      cell.style.color = 'yellow';
                                  } else if (grade >= 2.5 && grade <= 3.49) {
                                      cell.style.color = '#fcae05';
                                  } else if (grade >= 3.5 && grade <= 4.49) {
                                      cell.style.color = 'darkorange';
                                  } else if (grade >= 4.5 && grade <= 5.0) {
                                      cell.style.color = 'red';
                                  }
                              }
                          }
                      }
                  }

                  row.appendChild(cell);
              });

              table.appendChild(row);
          });

          // Append 'Uzavřeno' to the header if the table is closed
          if (isClosed) {
              tableHeader.innerText += ' - Uzavřeno';
          }

          container.appendChild(table);
      });
  }

  let container = document.querySelector('.classification-container');

  if (container) {
      let originalData = [];
      container.querySelectorAll('.panel').forEach(panel => {
          let header = panel.querySelector('.panel-heading').innerText;
          let tableData = [];
          panel.querySelectorAll('table tr').forEach(row => {
              let rowData = [];
              row.querySelectorAll('th, td').forEach(cell => {
                  rowData.push(cell.innerText);
              });
              tableData.push(rowData);
          });
          originalData.push([header, ...tableData]);
      });

      // Store original data in chrome's local storage
      chrome.storage.local.set({ "originalTableData": originalData }, function() {
          console.log("[Kyberna MB] Original table data saved.");
          console.log(originalData);
          saveLastFetchDate();
      });

      // Insert modern tables with headers
      insertModernTables(originalData, container);
  } else {
      console.log("[Kyberna MB] No container found for the classification tables.");
  }
}

// Function to save the last fetch date
function saveLastFetchDate() {
const now = new Date();
chrome.storage.local.set({ "lastFetchDate": now.toString() });
}

if (window.location.href.includes('https://sis.ssakhk.cz/News') ||
    window.location.href.includes('https://sis.ssakhk.cz/Classification') ||
    window.location.href.includes('https://sis.ssakhk.cz/Absent') ||
    window.location.href.includes('https://sis.ssakhk.cz/Attendance') ||
    window.location.href.includes('https://sis.ssakhk.cz/Work') ||
    window.location.href.includes('https://sis.ssakhk.cz/TimeTable') ||
    window.location.href.includes('https://sis.ssakhk.cz/Finance') ||
    window.location.href.includes('https://sis.ssakhk.cz/ResitExam') ||
    window.location.href.includes('https://sis.ssakhk.cz/Document') ||
    window.location.href.includes('https://sis.ssakhk.cz/Election') ||
    window.location.href.includes('https://sis.ssakhk.cz/Account')) {
    
    // Function to insert predvidac menu item
    function insertNewMenuItem() {
        var studentListItem = document.querySelector('.nav.navbar-nav .dropdown a[href="/Classification/Student"]');
        
        if (studentListItem && studentListItem.parentNode) {
            var newListItem = document.createElement('li');
            var newLink = document.createElement('a');
            newLink.href = '#';
            newLink.textContent = 'Předvídač známek';
            newListItem.appendChild(newLink);

            studentListItem.parentNode.insertAdjacentElement('afterend', newListItem);

            newLink.addEventListener('click', function(event) {
                event.preventDefault();

                var url = chrome.runtime.getURL('predvidac.html');
                window.location.href = url;
            });
        } else {
            console.log('[Kyberna MB] Student list item not found, new menu item not inserted.');
        }
    }

    insertNewMenuItem();
}


if (window.location.href.includes('https://sis.ssakhk.cz/Absent') && window.location.href !== 'https://sis.ssakhk.cz/Absent/Parent') {
    function showLoadingGif() {
      if (!document.getElementById('loadingContainer')) {
          // Create a container for the loading GIF
          const loadingContainer = document.createElement('div');
          loadingContainer.setAttribute('id', 'loadingContainer');
          loadingContainer.style.textAlign = 'center';
          loadingContainer.style.margin = '20px auto';
          loadingContainer.style.width = '100px';
          loadingContainer.style.height = '100px';
  
          const loadingGif = document.createElement('img');
          loadingGif.setAttribute('src', chrome.runtime.getURL('loading.gif'));
          loadingGif.style.width = '100%';
          loadingGif.style.height = '100%';

          loadingContainer.appendChild(loadingGif);
  
          const targetElement = document.querySelector('.absent-sumarized-table');
          if (targetElement) {
              targetElement.parentNode.insertBefore(loadingContainer, targetElement);
          } else {
              const mainContainer = document.querySelector('.container');
              if (mainContainer) {
                  mainContainer.insertBefore(loadingContainer, mainContainer.firstChild);
              } else {
                  document.body.insertBefore(loadingContainer, document.body.firstChild);
              }
          }
      }
  }
  
  

    // Function to hide loading GIF
    function hideLoadingGif() {
        const loadingGif = document.getElementById('loadingContainer');
        if (loadingGif) {
            loadingGif.remove();
        }
    }

    // Function to search for the original table
    function searchForTable() {
        showLoadingGif();
        let container = document.querySelector('.absent-sumarized-table');

        if (container) {
            let originalTable = container.querySelector('.table');

            if (originalTable) {
                let data = extractTableData(originalTable);

                // Remove the original table
                originalTable.remove();
                console.log("[Kyberna MB] Original Table data saved.");

                // Insert the modern version of the table
                insertModernTables(data, container);
                hideLoadingGif();
            } else {
                console.log("[Kyberna MB] Original table not found. Retrying...");
                setTimeout(() => {
                    searchForTable(); // Call itself to retry
                    hideLoadingGif();
                }, 3000);
            }
        } else {
            console.log("[Kyberna MB] Container not found. Retrying...");
            setTimeout(() => {
                searchForTable(); // Call itself to retry
                hideLoadingGif();
            }, 3000);
        }
    }
    searchForTable();
}


// Function to extract table data
function extractTableData(table) {
  let data = [];
  table.querySelectorAll('tr').forEach(row => {
      let rowData = [];
      row.querySelectorAll('th, td').forEach(cell => {
          rowData.push(cell.innerText.trim());
      });
      data.push(rowData);
  });
  return data;
}

// Function to insert modern tables
function insertModernTables(data, container) {
  container.innerHTML = '';
  let absentSumarizedTable = document.querySelector('.absent-sumarized-table');
    if (absentSumarizedTable) {
        absentSumarizedTable.style.display = 'block';
        absentSumarizedTable.style.height = 'auto';
        absentSumarizedTable.style.width = 'auto';
    }

  let table = document.createElement('table');
  table.className = 'modern-table';

  let headerRow = document.createElement('thead');
  let headerData = data.shift();
  let tr = document.createElement('tr');
  headerData.forEach(headerText => {
      let th = document.createElement('th');
      th.innerText = headerText;
      tr.appendChild(th);
  });
  headerRow.appendChild(tr);
  table.appendChild(headerRow);

  // Create data rows
  let tbody = document.createElement('tbody');
  data.forEach(rowData => {
      let row = document.createElement('tr');
      rowData.forEach(cellData => {
          let cell = document.createElement('td');
          cell.innerText = cellData;
          row.appendChild(cell);
      });
      tbody.appendChild(row);
  });
  table.appendChild(tbody);

  container.appendChild(table);
  applyGradientToProcentaRow(table);
}

// Function to apply gradient to the Procenta row
function applyGradientToProcentaRow(table) {
  const procentaRow = Array.from(table.rows).find(row => row.cells[0] && row.cells[0].innerText.trim() === 'Procenta');
  if (procentaRow) {
      Array.from(procentaRow.cells).forEach(cell => {
          const percentage = parseFloat(cell.innerText);
          if (!isNaN(percentage)) {
              cell.style.backgroundColor = getGradientColor(percentage);
          }
      });
  }
}

function getGradientColor(percentage) {
  // Color #1E1E1E
  const redIntensity = Math.min(255, (percentage / 100) * 255);
  const greenIntensity = 0;
  const blueIntensity = 0;
  const alpha = 0.5;

  return `rgba(${redIntensity}, ${greenIntensity}, ${blueIntensity}, ${alpha})`;
}


// Function to extract and store finance information
if (window.location.href.includes('https://sis.ssakhk.cz/Finance/Info')) {
  function saveFinanceInfo() {
      // Extract the HTML content of the finance information container
      let container = document.querySelector('.alert.alert-info');
      if (container) {
          let financeInfo = container.innerHTML;

          // Store finance data in Chrome's local storage
          chrome.storage.local.set({ "financeInfo": financeInfo }, function() {
              console.log("[Kyberna MB] Finance data saved.");
              saveLastFetchDate();
          });
      }
  }
  saveFinanceInfo();
}

// Function to replace finance information content on the page
function replaceFinanceInfoContent() {
  let originalContainer = document.querySelector('.alert.alert-info');
  if (originalContainer) {
      chrome.storage.local.get("financeInfo", function(result) {
          if (result.financeInfo) {
              modifyAndDisplayFinanceInfo(result.financeInfo, originalContainer);
          }
      });
  }
}

// Function to modify and display finance information
function modifyAndDisplayFinanceInfo(financeData, container) {
  const parser = new DOMParser();
  const financeDoc = parser.parseFromString(financeData, 'text/html');

  let newHtml = `<div class="new-finance-info-container"><h2>Finanční Informace</h2>`;

  // Extract and display variable symbols table
  const vsTable = financeDoc.querySelector('table');
  if (vsTable) {
      newHtml += `<div class="vs-info"><h3>Variabilní Symboly</h3>`;
      newHtml += `<div class="custom-list">`;

      vsTable.querySelectorAll('tr').forEach(row => {
          const description = row.cells[0]?.innerText;
          const value = row.cells[1]?.innerText;
          if (description && value) {
              newHtml += `<div class="list-item"><strong>${description}:</strong> ${value}</div>`;
          }
      });

      newHtml += `</div>`;
      newHtml += `</div>`;
  } else {
      console.error('[Kyberna MB] VS table not found in the finance data.');
  }

  // Extract and display bank account information based on the new class
  const bankAccountDiv = financeDoc.querySelector('div[style*="color:black;font-weight:bolder;font-size:19px;"]');
  if (bankAccountDiv) {
      const bankAccount = bankAccountDiv.innerText.trim();
      newHtml += `<div class="bank-account-info"><h3>Bankovní Účet</h3><p>${bankAccount}</p></div>`;
  } else {
      console.error('[Kyberna MB] Bank account information not found in the finance data.');
  }

  // Extract and display the prescription download link
  const prescriptionDiv = financeDoc.querySelector('div[style*="font-size: 2em"]');
  if (prescriptionDiv) {
      const prescriptionLink = prescriptionDiv.querySelector('a');
      if (prescriptionLink) {
          const prescriptionUrl = prescriptionLink.href;
          const prescriptionText = prescriptionLink.innerText;
          newHtml += `<div class="prescription-info"><h3>Předpis na příští rok</h3><a class="prescription-link" href="${prescriptionUrl}">${prescriptionText}</a></div>`;
      }
  } else {
      console.error('[Kyberna MB] Prescription information not found in the finance data.');
  }

  newHtml += `</div>`;
  container.innerHTML = newHtml;
}

// Function to style the new finance information based on the selected theme
function styleNewFinanceInfo() {
    chrome.storage.local.get(['selectedTheme'], function(result) {
        let cssFileName = 'financetableStyles';

        if (result.selectedTheme === 'theme2') {
            cssFileName += '2';
        } else if (result.selectedTheme === 'theme3') {
            cssFileName += '3';
        }

        cssFileName += '.css';

        // Load CSS file
        const link = document.createElement('link');
        link.href = chrome.runtime.getURL(cssFileName);
        link.type = 'text/css';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    });
}

// Function to insert the next subject container and button
function insertNextSubjectContainerAndButton() {
  if (window.location.href === 'https://sis.ssakhk.cz/TimeTable/PersonalNew') {
    // Create the next subject container
    const nextContainer = document.createElement('div');
    nextContainer.id = 'next-container';
    document.body.appendChild(nextContainer);

    const toggleButton = document.createElement('button');
    toggleButton.id = 'toggle-next-container';
    toggleButton.textContent = '▶';
    const buttonTopPosition = window.innerHeight / 2 - 70;
    toggleButton.style.cssText = `position: fixed; left: 10px; top: ${buttonTopPosition}px; z-index: 1001;`;
    document.body.appendChild(toggleButton);

    toggleButton.addEventListener('click', function() {
      nextContainer.classList.toggle('visible');
      if (nextContainer.classList.contains('visible')) {
        toggleButton.textContent = '◀';
      } else {
        toggleButton.textContent = '▶';
      }
    });
    updateNextSubjectInfo(nextContainer);
    setInterval(function() {
      updateNextSubjectInfo(nextContainer);
    }, 1000);
  }
}

// Function to update the next subject info
function updateNextSubjectInfo(container) {
  const activeColumn = document.querySelector('.col.active');
  const hourCards = activeColumn.querySelectorAll('.hour-card:not(.canceled-card)');
  const now = new Date();
  let foundCurrent = false;
  let nextSubjectInfo = null;

  container.innerHTML = '';

  for (let i = 0; i < hourCards.length; i++) {
    const card = hourCards[i];
    const timeText = card.querySelector('.time').innerText;
    const [startTime, endTime] = timeText.split(' - ').map(t => t.trim());
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    const startDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHour, startMinute);
    const endDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endHour, endMinute);

    if (now >= startDateTime && now < endDateTime) {
      // Current subject
      foundCurrent = true;
      const diffEndSeconds = Math.floor((endDateTime - now) / 1000);
      const subjectName = card.querySelector('.subject-name').innerText;
      const roomNumber = card.querySelector('.room-name').innerText;
      container.innerHTML = `<strong>Nyní:</strong> ${subjectName} - ${roomNumber}<br><strong>Končí za:</strong> ${formatTime(diffEndSeconds)}`;

      // Look ahead for the next subject
      if (i + 1 < hourCards.length) {
        const nextCard = hourCards[i + 1];
        const nextTimeText = nextCard.querySelector('.time').innerText;
        const [nextStartHour, nextStartMinute] = nextTimeText.split(' - ')[0].split(':').map(Number);
        const nextStartDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), nextStartHour, nextStartMinute);
        const diffStartNextSeconds = Math.floor((nextStartDateTime - now) / 1000);
        const nextSubjectName = nextCard.querySelector('.subject-name').innerText;
        const nextRoomNumber = nextCard.querySelector('.room-name').innerText;

        container.innerHTML += `<br><strong>Následující:</strong> ${nextSubjectName} - ${nextRoomNumber}<br><strong>Začíná za:</strong> ${formatTime(diffStartNextSeconds)}`;
      } else {
        // No more subjects for the day
        container.innerHTML += `<br><strong>Žádná další hodina</strong>`;
      }
      break;
    }

    if (!foundCurrent && now < startDateTime) {
      // Next subject
      nextSubjectInfo = {
        name: card.querySelector('.subject-name').innerText,
        roomNumber: card.querySelector('.room-name').innerText,
        startDateTime
      };
      break;
    }
  }

  if (!foundCurrent && nextSubjectInfo) {
    // Přestávka
    const diffStartSeconds = Math.floor((nextSubjectInfo.startDateTime - now) / 1000);
    container.innerHTML = `<strong>Přestávka</strong><br><strong>Následující:</strong> ${nextSubjectInfo.name} - ${nextSubjectInfo.roomNumber}<br><strong>Začíná za:</strong> ${formatTime(diffStartSeconds)}`;
  } else if (!foundCurrent) {
    // No more subjects for the day
    container.innerHTML = `<strong>Žádná další hodina</strong>`;
  }

  // Function to format time
  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} minut a ${remainingSeconds} sekund`;
  }
}

// Function to apply custom styles before the page loads
window.addEventListener("load", function() {
  document.body.style.display = "block";
});

// Initialization
insertNavbarToggleButton();
updateTextColorBasedOnBgColor();
setInterval(updateTextColorBasedOnBgColor, 100);
setInterval(updateCurrentTimeLine, 1000);
updateColspanWithCzechMonths();
insertContentAndApplyStyles();
insertContentAfterDiv();
setTitleIfURLMatches();
changeFaviconForDomain();
replaceFinanceInfoContent();
replaceFinanceInfoContent();
styleNewFinanceInfo();
insertNextSubjectContainerAndButton();







/* function getMonday(d) {
  d = new Date(d);
  var day = d.getDay(),
      diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
  return new Date(d.setDate(diff));
}

// Adjusted extractEntireTimetableData function to include dynamic date calculation
function extractEntireTimetableData() {
  const columns = document.querySelectorAll('.timetable .col');
  const dayNames = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek"];
  const startDate = getMonday(new Date()); // Get Monday of the current week

  const timetableData = [];

  columns.forEach((column, index) => {
    const isActive = column.classList.contains('active');
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + index); // Calculate the date for each day

    // Formatting the date as '29.3' for 29th of March
    const dayLabelFormatted = `${dayDate.getDate()}.${dayDate.getMonth() + 1}`;
    const dayLabel = dayNames[index];

    const hourCards = column.querySelectorAll('.hour-card, .hour-card.canceled-card, .hour-card.changed-card');
    const subjects = Array.from(hourCards).map(card => ({
      subjectName: card.querySelector('.subject-name')?.innerText.trim(),
      time: card.querySelector('.time')?.innerText.trim(),
      roomName: card.querySelector('.room-name')?.innerText.trim(),
      groupName: card.querySelector('.group-name')?.innerText.trim(),
      teacher: card.querySelector('.teacher')?.innerText.trim(),
      link: card.href || null,
      status: card.classList.contains('canceled-card') ? 'canceled' : (card.classList.contains('changed-card') ? 'changed' : 'normal')
    }));

    timetableData.push({ 
      dayLabel,
      dayDate: dayLabelFormatted,
      isActive,
      subjects 
    });
  });

  return timetableData;
}

function createAndDisplayNewTimetable() {
  const timetableData = extractEntireTimetableData();
  const newContainer = document.createElement('div');
  newContainer.className = 'calendar'; // Use 'calendar' instead of 'custom-timetable-container' for the class name
  document.body.appendChild(newContainer);

  let timelineHtml = '<div class="timeline"><div class="spacer"></div>';
  // Assuming a fixed timeline for simplicity
  const hours = ["9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM"];
  hours.forEach(hour => {
    timelineHtml += `<div class="time-marker">${hour}</div>`;
  });
  timelineHtml += '</div>'; // Close timeline div

  let daysHtml = '<div class="days">';
  timetableData.forEach(day => {
    daysHtml += `
      <div class="day ${day.isActive ? 'active' : ''}">
        <div class="date">
          <p class="date-num">${day.dayDate}</p>
          <p class="date-day">${day.dayLabel}</p>
        </div>
        <div class="events">`;

    day.subjects.forEach(subject => {
      let startHour = parseInt(subject.time.split(' - ')[0].split(':')[0]);
      let endHour = parseInt(subject.time.split(' - ')[1].split(':')[0]);
      daysHtml += `
          <div class="event" style="--event-start: ${startHour - 8}; --event-end: ${endHour - 8}; background-color: ${subject.status === 'canceled' ? 'var(--eventColor3)' : 'var(--eventColor1)'};">
            <p class="title">${subject.subjectName}</p>
            <p class="time">${subject.time}</p>
          </div>`;
    });

    daysHtml += '</div></div>'; // Close events and day div
  });
  daysHtml += '</div>'; // Close days div

  newContainer.innerHTML = timelineHtml + daysHtml;
}

// Make sure to call this function to initialize the timetable
createAndDisplayNewTimetable(); */