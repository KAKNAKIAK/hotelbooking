// === 전체 JavaScript 코드 (API 키 직접 포함 + 모든 기능 + 계산 테이블 연동 및 TOTAL 수정 가능 + 클릭 시 전체 선택) ===

// --- 데이터 ---
let hotelData = [];
const currencies = ["VND", "USD", "TWD", "THB", "SGD", "NZD", "MYR", "JPY", "HKD", "GBP", "EUR", "CZK", "CNY", "CHF", "CAD", "AUD", "PHP", "MOP", "HUF", "IDR", "HRK"];

// --- 함수 정의 ---

// (loadHotelsFromCMS, populateHotelSelectAndCategories, populateCategorySelect, calculateCheckoutDate, formatDateForOutput, updateGuestNameInputs, createCurrencyCheckboxes 함수는 기존과 동일)
async function loadHotelsFromCMS() {
    const CMS_SPACE_ID = 'imbg4efg59wo';
    const CMS_ACCESS_TOKEN = 'iNAsd2_-D9rc7oGpsD-NiviCaNr15S8lhbgPXmwnT_A'; // 실제 키 사용 시 주의
    const CMS_API_ENDPOINT = `https://cdn.contentful.com/spaces/${CMS_SPACE_ID}/environments/master/entries?content_type=hotel`;
    try {
        const response = await fetch(CMS_API_ENDPOINT, { method: 'GET', headers: { 'Authorization': `Bearer ${CMS_ACCESS_TOKEN}`, 'Content-Type': 'application/json' } });
        if (!response.ok) { throw new Error(`Contentful API error! status: ${response.status}, ${response.statusText}`); }
        const rawData = await response.json();
        if (rawData.items && Array.isArray(rawData.items)) {
             hotelData = rawData.items.map(item => ({ id: item.fields.hotelId || item.sys.id, name: item.fields.hotelName || 'Untitled Hotel', categories: item.fields.roomCategories || [] }));
        } else { throw new Error("Could not parse hotel data from Contentful response."); }
        console.log('Hotel data processed:', hotelData);
    } catch (error) { console.error('Failed to load hotel data from Contentful:', error); alert('호텔 데이터를 Contentful에서 불러오는 데 실패했습니다.'); hotelData = []; }
}
function populateHotelSelectAndCategories(hotelSelect, categorySelect) {
    console.log("--- Inside populateHotelSelectAndCategories ---");
    while (hotelSelect.options.length > 1) { hotelSelect.remove(1); }
    if (!hotelData || hotelData.length === 0) { hotelSelect.options[0].textContent = "-- 호텔 데이터 없음 --"; if (categorySelect) categorySelect.options[0].textContent = "-- 호텔 데이터 없음 --"; return; }
    hotelData.forEach((hotel, index) => {
        if (!hotel || typeof hotel.id === 'undefined' || typeof hotel.name === 'undefined') { console.error(`Invalid hotel data at index ${index}`, hotel); return; }
        try { const option = document.createElement('option'); option.value = hotel.id; option.textContent = hotel.name; hotelSelect.appendChild(option); } catch(e) { console.error(`Error appending hotel option ${index+1}:`, e, hotel); }
    });
    hotelSelect.value = ""; if (categorySelect) populateCategorySelect(null, categorySelect);
    console.log("--- Exiting populateHotelSelectAndCategories ---");
}
function populateCategorySelect(hotelId, categorySelect) {
    console.log(">>> Populating category select for hotelId:", hotelId);
    while (categorySelect.options.length > 1) { categorySelect.remove(1); } categorySelect.value = "";
    if (!hotelId) { categorySelect.options[0].textContent = "-- 호텔 먼저 선택 --"; return; }
    const selectedHotel = hotelData.find(hotel => hotel.id === hotelId);
    if (selectedHotel && selectedHotel.categories && Array.isArray(selectedHotel.categories) && selectedHotel.categories.length > 0) {
        categorySelect.options[0].textContent = "-- 카테고리 선택 --";
        selectedHotel.categories.forEach(category => { const option = document.createElement('option'); option.value = category; option.textContent = category; categorySelect.appendChild(option); });
    } else { categorySelect.options[0].textContent = "-- 카테고리 없음 --"; }
    console.log(">>> Exiting populateCategorySelect");
}
function calculateCheckoutDate(checkinInput, nightsInput, checkoutDisplay) {
    const checkinValue = checkinInput.value; const nightsValue = parseInt(nightsInput.value, 10);
    if (!checkinValue || isNaN(nightsValue) || nightsValue <= 0) { checkoutDisplay.value = ''; return; }
    try { const checkinDate = new Date(checkinValue); if (isNaN(checkinDate.getTime())) { checkoutDisplay.value = '유효하지 않은 체크인 날짜'; return; } const checkoutDate = new Date(checkinDate.getTime()); checkoutDate.setDate(checkoutDate.getDate() + nightsValue); const year = checkoutDate.getFullYear(); const month = String(checkoutDate.getMonth() + 1).padStart(2, '0'); const day = String(checkoutDate.getDate()).padStart(2, '0'); checkoutDisplay.value = `${year}-${month}-${day}`; } catch (error) { console.error("체크아웃 날짜 계산 오류:", error); checkoutDisplay.value = '날짜 계산 오류'; }
 }
function formatDateForOutput(dateString) {
    if (!dateString || dateString === '날짜 계산 오류' || dateString === '유효하지 않은 체크인 날짜') return ''; try { const parts = dateString.split('-'); if (parts.length !== 3) throw new Error('Invalid date format parts'); const year = parseInt(parts[0], 10); const monthIndex = parseInt(parts[1], 10) - 1; const day = parseInt(parts[2], 10); const dateObj = new Date(Date.UTC(year, monthIndex, day)); if (isNaN(dateObj.getTime()) || dateObj.getUTCFullYear() !== year || dateObj.getUTCMonth() !== monthIndex || dateObj.getUTCDate() !== day) { throw new Error('Invalid date components'); } const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]; return `${String(day).padStart(2, '0')}-${monthNames[monthIndex]}-${year}`; } catch (e) { console.error("날짜 형식 변환 오류:", e, dateString); return dateString; }
}
function updateGuestNameInputs(numberOfRooms, container) {
    container.innerHTML = ''; const num = parseInt(numberOfRooms, 10); if (isNaN(num) || num < 1) return;
    for (let i = 1; i <= num; i++) { const roomDiv = document.createElement('div'); roomDiv.classList.add('guest-input-group'); const label = document.createElement('label'); label.textContent = `ROOM ${i}:`; label.htmlFor = `guestNameRoom${i}`; const input = document.createElement('input'); input.type = 'text'; input.id = `guestNameRoom${i}`; input.classList.add('guest-name-input'); input.placeholder = 'Last/First Title (예: JUNG/KEUNCHAE MR)'; input.required = true; roomDiv.appendChild(label); roomDiv.appendChild(input); container.appendChild(roomDiv); }
}
function createCurrencyCheckboxes(containerId, currencyList) {
    const container = document.getElementById(containerId); if (!container) return; container.innerHTML = ''; const labelSpan = document.createElement('span'); labelSpan.classList.add('currency-label'); labelSpan.textContent = '통화:'; container.appendChild(labelSpan); currencyList.forEach((currencyCode, index) => { const itemDiv = document.createElement('div'); itemDiv.classList.add('currency-item'); const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.id = `curr_${currencyCode.toLowerCase()}`; checkbox.name = 'currency'; checkbox.value = currencyCode; if (index === 0) checkbox.checked = true; checkbox.addEventListener('change', (event) => { const currentCheckbox = event.target; if (currentCheckbox.checked) { container.querySelectorAll('input[name="currency"]').forEach(cb => { if (cb !== currentCheckbox) cb.checked = false; }); } else { if (container.querySelectorAll('input[name="currency"]:checked').length === 0) currentCheckbox.checked = true; } }); const label = document.createElement('label'); label.htmlFor = checkbox.id; label.textContent = currencyCode; itemDiv.appendChild(checkbox); itemDiv.appendChild(label); container.appendChild(itemDiv); });
}


// --- 계산 테이블 관련 함수 ---

/**
 * 계산 테이블에 사용자 정의 항목 행을 추가하는 함수
 */
function addCustomRateRow() {
    const tableBody = document.querySelector('#rateCalculationTable tbody');
    const etcRow = tableBody.querySelector('tr[data-row-id="etc"]');
    if (!tableBody || !etcRow) {
        console.error("Cannot add row: table body or 'etc' row not found.");
        return;
    }

    const nightsValue = document.getElementById('nightsInput').value || 0;
    const roomsValue = document.getElementById('numRooms').value || 0;

    const newRow = document.createElement('tr');
    newRow.setAttribute('data-row-id', 'custom');
    newRow.innerHTML = `
        <td><input type="text" class="etc-label-input" placeholder="추가 항목"></td>
        <td><input type="number" class="input1" value="0"></td>
        <td class="multiply-symbol">X</td>
        <td><input type="number" class="input2" value="${nightsValue}"></td>
        <td class="multiply-symbol">X</td>
        <td><input type="number" class="input3" value="${roomsValue}"></td>
        <td class="output-cell">0</td>
        <td class="delete-cell"><button type="button" class="delete-row-btn">삭제</button></td>
    `;

    tableBody.insertBefore(newRow, etcRow);

    const newInputs = newRow.querySelectorAll('.input1, .input2, .input3, .etc-label-input');
    newInputs.forEach(input => {
        input.addEventListener('focus', function() { this.select(); });
    });
}

/**
 * 상단 '박수', '객실 수' 값을 계산 테이블의 해당 열에 동기화하는 함수
 * @param {number} nightsValue - 상단 '박수' 값
 * @param {number} roomsValue - 상단 '객실 수' 값
 * @param {HTMLInputElement} totalSumInput - TOTAL 합계 입력 필드
 */
function syncFormInputsToTable(nightsValue, roomsValue, totalSumInput) {
    const tableBody = document.querySelector('#rateCalculationTable tbody');
    if (!tableBody) return;

    const rows = tableBody.querySelectorAll('tr:not(#total-row)');
    rows.forEach(row => {
        const input2 = row.querySelector('.input2');
        const input3 = row.querySelector('.input3');

        if (input2) input2.value = nightsValue;
        if (input3) input3.value = roomsValue;

        calculateRowAndUpdateTotal(row, totalSumInput);
    });
}

/**
 * 특정 행의 계산을 수행하고 결과를 업데이트하며, 총 합계(입력 필드)도 갱신하는 함수
 * @param {HTMLTableRowElement} row - 계산할 테이블 행 요소
 * @param {HTMLInputElement} totalSumInput - 총 합계를 표시/수정할 입력 필드 요소
 */
function calculateRowAndUpdateTotal(row, totalSumInput) {
    const input1 = row.querySelector('.input1');
    const input2 = row.querySelector('.input2');
    const input3 = row.querySelector('.input3');
    const outputCell = row.querySelector('.output-cell');

    if (!input1 || !input2 || !input3 || !outputCell) return;

    const value1 = parseFloat(input1.value) || 0;
    const value2 = parseFloat(input2.value) || 0;
    const value3 = parseFloat(input3.value) || 0;

    const result = value1 * value2 * value3;
    outputCell.textContent = result.toLocaleString();

    updateTotalSum(totalSumInput);
}

/**
 * 모든 행의 산출값을 합산하여 총 합계 '입력 필드'의 값을 업데이트하는 함수
 * @param {HTMLInputElement} totalSumInput - 총 합계를 표시/수정할 입력 필드 요소
 */
function updateTotalSum(totalSumInput) {
    if (!totalSumInput) return;

    let total = 0;
    const tableBody = document.querySelector('#rateCalculationTable tbody');
    if (!tableBody) return;

    const outputCells = tableBody.querySelectorAll('tr:not(#total-row) .output-cell');

    outputCells.forEach(cell => {
        const cellValue = parseFloat(cell.textContent.replace(/,/g, '')) || 0;
        total += cellValue;
    });

    totalSumInput.value = total;
}
// --- 계산 테이블 관련 함수 끝 ---


// (generateOutput, copyOutput, isValidDateYYYYMMDD 함수는 기존과 동일)
function generateOutput(elements) {
    const hotelNameValue = elements.hotelSelect.options[elements.hotelSelect.selectedIndex].text;
    const checkinValue = elements.checkinDateInput.value;
    const nightsValue = elements.nightsInput.value;
    const checkoutValue = elements.checkoutDateDisplay.value;
    const numRoomsValue = elements.numRoomsInput.value;
    const roomCategoryValue = elements.categorySelect.value;
    const specialRequestsValue = elements.specialRequestsTextarea.value;

    const totalSumInput = document.getElementById('total-sum-input');
    const roomRateValue = parseFloat(totalSumInput.value) || 0;

    const guestInputs = elements.guestNameInputsContainer.querySelectorAll('.guest-name-input');
    let guestListString = '';
    let allGuestsEntered = true;
    if (guestInputs.length === 0 && parseInt(numRoomsValue, 10) > 0) { allGuestsEntered = false; }
    guestInputs.forEach((input, index) => { const guestName = input.value.trim(); if (guestName) { guestListString += `Room ${index + 1}. ${guestName}\n`; } else { allGuestsEntered = false; } });
    guestListString = guestListString.trim();

    const checkedBoxes = elements.requestCheckboxesContainer.querySelectorAll('input[name="common_request"]:checked');
    const selectedRequests = Array.from(checkedBoxes).map(cb => cb.value);
    const checkboxRequestString = selectedRequests.join(', ');
    const freeTextRequest = specialRequestsValue.trim();
    let finalRequestString = checkboxRequestString;
    if (freeTextRequest) { finalRequestString += (finalRequestString ? `\n${freeTextRequest}` : freeTextRequest); }
    if (!finalRequestString) { finalRequestString = 'None'; }

    const selectedCurrencyElement = document.querySelector('#currencySelection input[name="currency"]:checked');
    const selectedCurrencyValue = selectedCurrencyElement ? selectedCurrencyElement.value : '';

    let alertMessages = [];
    if (!hotelNameValue || elements.hotelSelect.selectedIndex === 0) alertMessages.push("호텔명을 선택해주세요.");
    if (!checkinValue) alertMessages.push("체크인 날짜를 입력해주세요.");
    if (!nightsValue || nightsValue <= 0) alertMessages.push("박수를 1 이상 입력해주세요.");
    if (!checkoutValue || checkoutValue === '날짜 계산 오류' || checkoutValue === '유효하지 않은 체크인 날짜') alertMessages.push("체크아웃 날짜를 확인해주세요.");
    if (!numRoomsValue || numRoomsValue <= 0) alertMessages.push("객실 수를 1 이상 입력해주세요.");
    if (!roomCategoryValue || elements.categorySelect.selectedIndex === 0) alertMessages.push("객실 카테고리를 선택해주세요.");
    if (!allGuestsEntered) alertMessages.push("모든 객실의 투숙객 이름을 입력해주세요.");
    if (roomRateValue < 0) alertMessages.push("최종 요금(TOTAL)이 음수입니다. 확인해주세요.");
    if (!selectedCurrencyValue) alertMessages.push("통화 단위를 선택해주세요.");
    if (!totalSumInput || totalSumInput.value === '') alertMessages.push("최종 요금(TOTAL)을 확인해주세요.");

    if (alertMessages.length > 0) {
        alert("다음 항목을 확인해주세요:\n- " + alertMessages.join("\n- "));
        elements.outputArea.value = '';
        elements.copyButton.style.display = 'none';
        return;
    }

    const checkinFormatted = formatDateForOutput(checkinValue);
    const checkoutFormatted = formatDateForOutput(checkoutValue);

    const outputText = `Greetings from Naeil Tour, Korea!
Please find the new booking request as below and confirm the booking.

[Booking Details]
Hotel: ${hotelNameValue}
Check in: ${checkinFormatted}
Check out: ${checkoutFormatted}
Room Type: ${roomCategoryValue}
Nights: ${nightsValue} Nights
Rooms: ${numRoomsValue} Rooms

Guest Name(Last/First):
${guestListString}

Room Rate: ${Number(roomRateValue).toLocaleString()} ${selectedCurrencyValue}
Request: ${finalRequestString}

Looking forward to hearing from you soon.

Best regards,
Naeil Tour`;

    elements.outputArea.value = outputText.trim();
    elements.copyButton.style.display = 'inline-block';
}
function copyOutput(outputArea, copyButton) {
    if (!outputArea.value) return; navigator.clipboard.writeText(outputArea.value) .then(() => { const originalText = copyButton.textContent; copyButton.textContent = '복사 완료!'; setTimeout(() => { copyButton.textContent = originalText; }, 1500); }) .catch(err => { console.error('복사 실패: ', err); alert('내용 복사에 실패했습니다.'); });
}
function isValidDateYYYYMMDD(dateString) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false; const parts = dateString.split("-"); const year = parseInt(parts[0], 10); const month = parseInt(parts[1], 10); const day = parseInt(parts[2], 10); if (month < 1 || month > 12 || day < 1 || day > 31) return false; const testDate = new Date(year, month - 1, day); if (isNaN(testDate.getTime()) || testDate.getFullYear() !== year || testDate.getMonth() !== month - 1 || testDate.getDate() !== day) return false; return true;
}


// --- === 코드 실행 시작 (DOM 로드 후) === ---
document.addEventListener('DOMContentLoaded', async () => {
    // --- 기본 폼 요소 선택 ---
    const hotelSelect = document.getElementById('hotelName');
    const categorySelect = document.getElementById('roomCategory');
    const checkinDateInput = document.getElementById('checkinDate');
    const nightsInput = document.getElementById('nightsInput');
    const checkoutDateDisplay = document.getElementById('checkoutDateDisplay');
    const numRoomsInput = document.getElementById('numRooms');
    const guestNameInputsContainer = document.getElementById('guestNameInputsContainer');
    const currencyContainerId = 'currencySelection';
    const requestCheckboxesContainer = document.getElementById('requestCheckboxes');
    const specialRequestsTextarea = document.getElementById('specialRequests');
    const generateButton = document.getElementById('generateButton');
    const outputArea = document.getElementById('outputArea');
    const copyButton = document.getElementById('copyButton');

    // --- 계산 테이블 및 추가/삭제 버튼 요소 선택 ---
    const rateTableBody = document.querySelector('#rateCalculationTable tbody');
    const totalSumInput = document.getElementById('total-sum-input');
    const addRowButton = document.getElementById('addRowButton'); // 항목 추가 버튼

    // --- 초기화 및 데이터 로드 ---
    await loadHotelsFromCMS();
    populateHotelSelectAndCategories(hotelSelect, categorySelect);
    updateGuestNameInputs(numRoomsInput.value, guestNameInputsContainer);
    calculateCheckoutDate(checkinDateInput, nightsInput, checkoutDateDisplay);
    createCurrencyCheckboxes(currencyContainerId, currencies);
    if (nightsInput && numRoomsInput && totalSumInput) {
        syncFormInputsToTable(nightsInput.value, numRoomsInput.value, totalSumInput);
    }

    // --- 입력 필드 클릭 시 전체 선택 기능 추가 ---
    const selectableInputs = document.querySelectorAll(
        '#checkinDate, #nightsInput, #numRooms, #total-sum-input, #rateCalculationTable .input1, #rateCalculationTable .input2, #rateCalculationTable .input3'
    );
    selectableInputs.forEach(input => {
        input.addEventListener('focus', function() { this.select(); });
    });

    // --- 기본 폼 이벤트 리스너 ---
    if (hotelSelect) hotelSelect.addEventListener('change', () => populateCategorySelect(hotelSelect.value, categorySelect));
    if (checkinDateInput) checkinDateInput.addEventListener('change', () => calculateCheckoutDate(checkinDateInput, nightsInput, checkoutDateDisplay));

    if (nightsInput) {
        nightsInput.addEventListener('input', () => {
            calculateCheckoutDate(checkinDateInput, nightsInput, checkoutDateDisplay);
            if (numRoomsInput && totalSumInput) {
                syncFormInputsToTable(nightsInput.value, numRoomsInput.value, totalSumInput);
            }
        });
    }

    if (numRoomsInput) {
        numRoomsInput.addEventListener('input', () => {
            updateGuestNameInputs(numRoomsInput.value, guestNameInputsContainer);
            if (nightsInput && totalSumInput) {
                syncFormInputsToTable(nightsInput.value, numRoomsInput.value, totalSumInput);
            }
        });
    }

    // --- 계산 테이블 내부 이벤트 리스너 (입력 및 삭제 처리) ---
    if (rateTableBody && totalSumInput) {
        rateTableBody.addEventListener('input', (event) => {
            if (event.target.matches('.input1, .input2, .input3')) {
                const row = event.target.closest('tr');
                if (row && row.id !== 'total-row') {
                     calculateRowAndUpdateTotal(row, totalSumInput);
                }
            }
        });

        rateTableBody.addEventListener('click', (event) => {
            if (event.target.classList.contains('delete-row-btn')) {
                const rowToDelete = event.target.closest('tr');
                if (rowToDelete) {
                    rowToDelete.remove();
                    updateTotalSum(totalSumInput); // 행 삭제 후 총합계 업데이트
                }
            }
        });
    }

    // --- 항목 추가 버튼 이벤트 리스너 ---
    if (addRowButton) {
        addRowButton.addEventListener('click', addCustomRateRow);
    }

    // --- 생성 및 복사 버튼 이벤트 리스너 ---
    if (generateButton) {
        generateButton.addEventListener('click', () => {
            generateOutput({
                hotelSelect, categorySelect, checkinDateInput, nightsInput, checkoutDateDisplay,
                numRoomsInput, guestNameInputsContainer,
                requestCheckboxesContainer, specialRequestsTextarea, outputArea, copyButton
            });
        });
    }
    if (copyButton) copyButton.addEventListener('click', () => copyOutput(outputArea, copyButton));

    console.log(">>> Initialization complete.");
}); // End of DOMContentLoaded
