// Function to dynamically inject a CSS file into the page
function injectCssFile(tabId, filename) {
  chrome.scripting.insertCSS({
      target: { tabId: tabId },
      files: [filename]
  }, () => {
      console.log(`CSS file ${filename} injected into tab ${tabId}`);
  });
}

// Function to determine the CSS file based on the stored theme
function determineCssFile(result) {
  if (result.selectedTheme === 'theme2') {
      return 'styles2.css';
  } else if (result.selectedTheme === 'theme3') {
      return 'styles3.css';
  }
  return 'styles.css';
}

// Function to apply the theme based on the current URL and stored theme
function applyThemeOnTab(tabId, url) {
  if (url.includes("https://sis.ssakhk.cz/")) {
      chrome.storage.local.get(['selectedTheme'], function(result) {
          let cssFile = determineCssFile(result);
          console.log(`Applying ${cssFile} for theme ${result.selectedTheme || 'default'} on tab ${tabId}`);
          injectCssFile(tabId, cssFile);
      });
  } else {
      console.log(`[KybernaMB] URL does not match or tab is undefined. No CSS injected.`);
  }
}

// Listening to when a tab is updated to apply the theme
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'loading') {
      applyThemeOnTab(tabId, tab.url);
  }
});

// Listening to when a tab is activated to apply the theme
chrome.tabs.onActivated.addListener(function(activeInfo) {
  chrome.tabs.get(activeInfo.tabId, function(tab) {
      applyThemeOnTab(tab.id, tab.url);
  });
});
  
let lastReloadTimes = {};

// Function to reload a specific tab
function reloadTab(tabId) {
  chrome.tabs.reload(tabId, () => {
    console.log(`Tab with ID: ${tabId} reloaded.`);
    lastReloadTimes[tabId] = Date.now();
  });
}

// Listening for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "refreshTab") {
    reloadTab(sender.tab.id);
  }
});

const GRADE_CHECK_ALARM_NAME = 'grade-check';
const GRADE_NOTIFICATION_ID = 'grade-notification';
const TIMETABLE_NOTIFICATION_ID = 'timetable-notification';
const CLASSIFICATION_URL = 'https://sis.ssakhk.cz/Classification/';
const TIMETABLE_URL = 'https://sis.ssakhk.cz/TimeTable/PersonalNew';
const GRADE_PATTERN = /^(?:[1-5](?:-)?|n)$/i;
const STORED_GRADES_KEY = 'storedGradesSnapshot';
const STORED_TIMETABLE_KEY = 'storedTimetableSnapshot';
const WEIGHT_PATTERN = /^(10|[1-9])$/;

function stripTags(value) {
  return value.replace(/<[^>]*>/g, '');
}

function decodeHtmlEntities(value) {
  const namedEntities = {
    nbsp: ' ',
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    '#39': "'",
    Scaron: '\u0160',
    scaron: '\u0161',
    Ccaron: '\u010c',
    ccaron: '\u010d',
    Rcaron: '\u0158',
    rcaron: '\u0159',
    Ecaron: '\u011a',
    ecaron: '\u011b',
    Dcaron: '\u010e',
    dcaron: '\u010f',
    Ncaron: '\u0147',
    ncaron: '\u0148',
    Tcaron: '\u0164',
    tcaron: '\u0165',
    Uring: '\u016e',
    uring: '\u016f',
    Zcaron: '\u017d',
    zcaron: '\u017e',
    Aacute: '\u00c1',
    aacute: '\u00e1',
    Eacute: '\u00c9',
    eacute: '\u00e9',
    Iacute: '\u00cd',
    iacute: '\u00ed',
    Oacute: '\u00d3',
    oacute: '\u00f3',
    Uacute: '\u00da',
    uacute: '\u00fa',
    Yacute: '\u00dd',
    yacute: '\u00fd'
  };

  return value.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (match, entity) => {
    if (entity.startsWith('#x') || entity.startsWith('#X')) {
      const codePoint = parseInt(entity.slice(2), 16);
      if (Number.isFinite(codePoint)) {
        return String.fromCharCode(codePoint);
      }
      return match;
    }

    if (entity.startsWith('#')) {
      const codePoint = parseInt(entity.slice(1), 10);
      if (Number.isFinite(codePoint)) {
        return String.fromCharCode(codePoint);
      }
      return match;
    }

    if (Object.prototype.hasOwnProperty.call(namedEntities, entity)) {
      return namedEntities[entity];
    }

    return match;
  });
}

function normalizeHeaderText(value) {
  return decodeHtmlEntities(stripTags(value))
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function isGrade(value) {
  return GRADE_PATTERN.test(value.trim());
}

function normalizeGrade(value) {
  return value.trim().toLowerCase();
}

function normalizeGradeEntry(entry) {
  const weight = entry.weight ? entry.weight.trim() : '';
  return `${normalizeGrade(entry.grade)}|${weight}`;
}

function diffGradeEntries(currentEntries, previousEntries) {
  const previousCounts = new Map();
  previousEntries.forEach(entry => {
    const key = normalizeGradeEntry(entry);
    previousCounts.set(key, (previousCounts.get(key) || 0) + 1);
  });

  const addedEntries = [];
  currentEntries.forEach(entry => {
    const key = normalizeGradeEntry(entry);
    const remaining = previousCounts.get(key) || 0;
    if (remaining > 0) {
      previousCounts.set(key, remaining - 1);
      return;
    }
    addedEntries.push(entry);
  });

  return addedEntries;
}

function extractGradeEntriesFromTable(tableHtml) {
  const headerRowMatch = tableHtml.match(/<tr[^>]*>[\s\S]*?<\/tr>/i);
  let gradeColumnIndex = -1;
  let weightColumnIndex = -1;

  if (headerRowMatch) {
    const headerMatches = [...headerRowMatch[0].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)];
    if (headerMatches.length > 0) {
      const headers = headerMatches.map(match => normalizeHeaderText(match[1]));
      gradeColumnIndex = headers.findIndex(header => header.includes('znamka'));
      weightColumnIndex = headers.findIndex(header => header.includes('vaha'));
    }
  }

  const gradeEntries = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;

  while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
    const cellMatches = [...rowMatch[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)];
    if (cellMatches.length === 0) {
      continue;
    }

    const cellValues = cellMatches.map(match => decodeHtmlEntities(stripTags(match[1])).trim());

    if (gradeColumnIndex >= 0 && gradeColumnIndex < cellValues.length) {
      const candidate = cellValues[gradeColumnIndex];
      if (isGrade(candidate)) {
        const weightValue = weightColumnIndex >= 0 && weightColumnIndex < cellValues.length
          ? cellValues[weightColumnIndex].trim()
          : null;
        gradeEntries.push({
          grade: candidate.trim(),
          weight: weightValue || null
        });
      }
      continue;
    }

    cellValues.forEach((value, index) => {
      if (!isGrade(value)) {
        return;
      }

      let weightValue = null;
      if (weightColumnIndex >= 0 && weightColumnIndex < cellValues.length) {
        weightValue = cellValues[weightColumnIndex].trim();
      } else {
        const fallbackWeight = cellValues.find((cell, cellIndex) => {
          if (cellIndex === index) {
            return false;
          }
          return WEIGHT_PATTERN.test(cell.trim());
        });
        weightValue = fallbackWeight ? fallbackWeight.trim() : null;
      }

      gradeEntries.push({
        grade: value.trim(),
        weight: weightValue || null
      });
    });
  }

  return gradeEntries;
}

function parseGradesFromHtml(html) {
  const subjects = [];
  const panelRegex = /<div[^>]*class=["']panel-heading["'][^>]*>([\s\S]*?)<\/div>[\s\S]*?(<table[\s\S]*?<\/table>)/gi;
  let match;

  while ((match = panelRegex.exec(html)) !== null) {
    const subjectName = decodeHtmlEntities(stripTags(match[1])).trim();
    const tableHtml = match[2];
    const grades = extractGradeEntriesFromTable(tableHtml);

    subjects.push({
      subject: subjectName || 'Neznamy predmet',
      grades,
      latestGrade: grades.length > 0 ? grades[grades.length - 1] : null
    });
  }

  const totalGrades = subjects.reduce((sum, subject) => sum + subject.grades.length, 0);
  return { subjects, totalGrades };
}

function buildGradesSnapshot(subjects) {
  return subjects.reduce((snapshot, subject) => {
    snapshot[subject.subject] = subject.grades;
    return snapshot;
  }, {});
}

function computeNewGrades(subjects, previousSnapshot) {
  const newEntries = [];
  let totalNewGrades = 0;

  subjects.forEach(subject => {
    const previousGrades = Array.isArray(previousSnapshot?.[subject.subject])
      ? previousSnapshot[subject.subject]
      : [];
    const addedEntries = diffGradeEntries(subject.grades, previousGrades);

    if (addedEntries.length > 0) {
      totalNewGrades += addedEntries.length;
      addedEntries.forEach(entry => {
        newEntries.push({
          subject: subject.subject,
          entry
        });
      });
    }
  });

  return { newEntries, totalNewGrades };
}

function getStoredSnapshot() {
  return new Promise(resolve => {
    chrome.storage.local.get([STORED_GRADES_KEY], result => {
      resolve(result[STORED_GRADES_KEY] || null);
    });
  });
}

function setStoredSnapshot(snapshot) {
  return new Promise(resolve => {
    chrome.storage.local.set({ [STORED_GRADES_KEY]: snapshot }, resolve);
  });
}

function extractValueByClass(html, className) {
  const regex = new RegExp(`<[^>]*class=["'][^"']*${className}[^"']*["'][^>]*>([\\s\\S]*?)<\\/[^>]+>`, 'i');
  const match = html.match(regex);
  if (!match) {
    return '';
  }
  return decodeHtmlEntities(stripTags(match[1])).trim();
}

function parseTimetableFromHtml(html) {
  const entries = [];
  const cardRegex = /<(?:div|a)[^>]*class=["'][^"']*hour-card[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|a)>/gi;
  let match;

  while ((match = cardRegex.exec(html)) !== null) {
    const cardHtml = match[0];
    const innerHtml = match[1];
    const classMatch = cardHtml.match(/class=["']([^"']*)["']/i);
    const classList = classMatch ? classMatch[1] : '';
    const status = classList.includes('canceled-card')
      ? 'canceled'
      : classList.includes('changed-card')
        ? 'changed'
        : 'normal';

    const subject = extractValueByClass(innerHtml, 'subject-name');
    const time = extractValueByClass(innerHtml, 'time');
    const room = extractValueByClass(innerHtml, 'room-name');
    const group = extractValueByClass(innerHtml, 'group-name');
    const teacher = extractValueByClass(innerHtml, 'teacher');

    if (!subject && !time && !room && !group && !teacher) {
      continue;
    }

    entries.push({
      subject,
      time,
      room,
      group,
      teacher,
      status
    });
  }

  return entries;
}

function buildTimetableSnapshot(entries) {
  return entries.map(entry => ({
    subject: entry.subject,
    time: entry.time,
    room: entry.room,
    group: entry.group,
    teacher: entry.teacher,
    status: entry.status
  }));
}

function hasTimetableChanged(currentSnapshot, previousSnapshot) {
  if (!Array.isArray(previousSnapshot) || previousSnapshot.length === 0) {
    return false;
  }
  return JSON.stringify(currentSnapshot) !== JSON.stringify(previousSnapshot);
}

function getStoredTimetableSnapshot() {
  return new Promise(resolve => {
    chrome.storage.local.get([STORED_TIMETABLE_KEY], result => {
      resolve(result[STORED_TIMETABLE_KEY] || null);
    });
  });
}

function setStoredTimetableSnapshot(snapshot) {
  return new Promise(resolve => {
    chrome.storage.local.set({ [STORED_TIMETABLE_KEY]: snapshot }, resolve);
  });
}

async function checkGradesInBackground() {
  try {
    const response = await fetch(CLASSIFICATION_URL, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
      redirect: 'follow'
    });

    if (!response.ok) {
      console.warn(`[Kyberna MB] Grade check failed: ${response.status}`);
      return;
    }

    const html = await response.text();
    const parsed = parseGradesFromHtml(html);

    console.log('[Kyberna MB] Parsed grades:', parsed.subjects);

    if (parsed.subjects.length === 0) {
      console.warn('[Kyberna MB] No subjects found. Skipping snapshot update.');
      return;
    }

    const previousSnapshot = await getStoredSnapshot();
    const { newEntries, totalNewGrades } = computeNewGrades(parsed.subjects, previousSnapshot);
    const snapshot = buildGradesSnapshot(parsed.subjects);

    await setStoredSnapshot(snapshot);

    if (totalNewGrades === 0) {
      return;
    }

    const firstEntry = newEntries[0];
    const weightLabel = firstEntry.entry.weight ? `, v\u00e1ha ${firstEntry.entry.weight}` : '';
    const items = [
      {
        title: firstEntry.subject,
        message: `Zn\u00e1mka ${firstEntry.entry.grade}${weightLabel}`
      }
    ];
    const remainingCount = totalNewGrades - 1;
    const notificationMessage = remainingCount > 0
      ? `A dal\u0161\u00ed ${remainingCount}.`
      : 'Otev\u0159ete klasifikaci pro detaily.';

    chrome.notifications.create(GRADE_NOTIFICATION_ID, {
      type: 'list',
      iconUrl: 'icon128.png',
      title: `Nalezeno ${totalNewGrades} zn\u00e1mek`,
      message: notificationMessage,
      items,
      buttons: [
        { title: 'Otev\u0159\u00edt klasifikaci' }
      ]
    });
  } catch (error) {
    console.error('[Kyberna MB] Grade check failed:', error);
  }
}

async function checkTimetableInBackground() {
  try {
    const response = await fetch(TIMETABLE_URL, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
      redirect: 'follow'
    });

    if (!response.ok) {
      console.warn(`[Kyberna MB] Timetable check failed: ${response.status}`);
      return;
    }

    const html = await response.text();
    const entries = parseTimetableFromHtml(html);

    if (entries.length === 0) {
      console.warn('[Kyberna MB] No timetable entries found. Skipping snapshot update.');
      return;
    }

    const snapshot = buildTimetableSnapshot(entries);
    const previousSnapshot = await getStoredTimetableSnapshot();

    if (!previousSnapshot) {
      await setStoredTimetableSnapshot(snapshot);
      return;
    }

    if (!hasTimetableChanged(snapshot, previousSnapshot)) {
      return;
    }

    await setStoredTimetableSnapshot(snapshot);

    chrome.notifications.create(TIMETABLE_NOTIFICATION_ID, {
      type: 'basic',
      iconUrl: 'icon128.png',
      title: 'Rozvrh se zm\u011bnil',
      message: 'Otev\u0159ete rozvrh pro detaily.',
      buttons: [
        { title: 'Otev\u0159\u00edt rozvrh' }
      ]
    });
  } catch (error) {
    console.error('[Kyberna MB] Timetable check failed:', error);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(GRADE_CHECK_ALARM_NAME, { periodInMinutes: 30 });
  checkGradesInBackground();
  checkTimetableInBackground();
});

chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create(GRADE_CHECK_ALARM_NAME, { periodInMinutes: 30 });
});

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === GRADE_CHECK_ALARM_NAME) {
    checkGradesInBackground();
    checkTimetableInBackground();
  }
});

chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (notificationId === GRADE_NOTIFICATION_ID && buttonIndex === 0) {
    chrome.tabs.create({ url: CLASSIFICATION_URL });
    return;
  }

  if (notificationId === TIMETABLE_NOTIFICATION_ID && buttonIndex === 0) {
    chrome.tabs.create({ url: TIMETABLE_URL });
  }
});

chrome.notifications.onClicked.addListener(notificationId => {
  if (notificationId === TIMETABLE_NOTIFICATION_ID) {
    chrome.tabs.create({ url: TIMETABLE_URL });
  }
});
