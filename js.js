// === CodePen 테스트용 전체 JavaScript 코드 (API 키 직접 포함) ===

// --- 데이터 ---
let hotelData = [];
const currencies = ["VND", "USD", "TWD", "THB", "SGD", "NZD", "MYR", "JPY", "HKD", "GBP", "EUR", "CZK", "CNY", "CHF", "CAD", "AUD", "PHP", "MOP", "HUF", "IDR", "HRK"];

// --- 함수 정의 ---

async function loadHotelsFromCMS() {
    // !!! Space ID와 Access Token이 여기에 직접 입력되었습니다 !!!
    const CMS_SPACE_ID = 'imbg4efg59wo';
    const CMS_ACCESS_TOKEN = 'iNAsd2_-D9rc7oGpsD-NiviCaNr15S8lhbgPXmwnT_A'; // 실제 토큰 값

    const CMS_API_ENDPOINT = `https://cdn.contentful.com/spaces/${CMS_SPACE_ID}/environments/master/entries?content_type=hotel`;

    console.log("Attempting to load data from Contentful:", CMS_API_ENDPOINT);
    try {
        const response = await fetch(CMS_API_ENDPOINT, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${CMS_ACCESS_TOKEN}`, 'Content-Type': 'application/json' }
        });
        if (!response.ok) { throw new Error(`Contentful API error! status: ${response.status}, ${response.statusText}`); }
        const rawData = await response.json();
        console.log("Raw data from Contentful:", rawData);
        if (rawData.items && Array.isArray(rawData.items)) {
             hotelData = rawData.items.map(item => ({
                 id: item.fields.hotelId || item.sys.id, name: item.fields.hotelName || 'Untitled Hotel', categories: item.fields.roomCategories || []
             }));
        } else { console.error("Unexpected data structure from Contentful:", rawData); throw new Error("Could not parse hotel data from Contentful response."); }
        console.log('Hotel data processed:', hotelData);
    } catch (error) { console.error('Failed to load hotel data from Contentful:', error); alert('호텔 데이터를 Contentful에서 불러오는 데 실패했습니다. Space ID, Access Token, 콘텐츠 타입 ID 및 네트워크를 확인해주세요.'); hotelData = []; }
}

function populateHotelSelectAndCategories(hotelSelect, categorySelect) {
    while (hotelSelect.options.length > 1) { hotelSelect.remove(1); }
    if (!hotelData || hotelData.length === 0) { hotelSelect.options[0].textContent = "-- 호텔 데이터 로드 실패 --"; categorySelect.options[0].textContent = "-- 호텔 데이터 로드 실패 --"; console.warn("Hotel data is not available for population."); return; }
    hotelData.forEach(hotel => { const option = document.createElement('option'); option.value = hotel.id; option.textContent = hotel.name; hotelSelect.appendChild(option); });
    hotelSelect.value = ""; populateCategorySelect(null, categorySelect);
}
function populateCategorySelect(hotelId, categorySelect) {
    while (categorySelect.options.length > 1) { categorySelect.remove(1); }
    categorySelect.value = "";
    if (!hotelId) { categorySelect.options[0].textContent = "-- 호텔 먼저 선택 --"; return; }
    const selectedHotel = hotelData.find(hotel => hotel.id === hotelId);
    if (selectedHotel && selectedHotel.categories) {
        categorySelect.options[0].textContent = "-- 카테고리 선택 --";
        selectedHotel.categories.forEach(category => { const option = document.createElement('option'); option.value = category; option.textContent = category; categorySelect.appendChild(option); });
    } else { categorySelect.options[0].textContent = "-- 카테고리 없음 --"; }
}
function calculateCheckoutDate(checkinInput, nightsInput, checkoutDisplay) {
    const checkinValue = checkinInput.value; const nightsValue = parseInt(nightsInput.value, 10);
    if (!checkinValue || isNaN(nightsValue) || nightsValue <= 0) { checkoutDisplay.value = ''; return; }
    try { const checkinDate = new Date(checkinValue); const checkoutDate = new Date(checkinDate.getTime()); checkoutDate.setDate(checkoutDate.getDate() + nightsValue); const year = checkoutDate.getFullYear(); const month = String(checkoutDate.getMonth() + 1).padStart(2, '0'); const day = String(checkoutDate.getDate()).padStart(2, '0'); checkoutDisplay.value = `${year}-${month}-${day}`; }
    catch (error) { console.error("체크아웃 날짜 계산 오류:", error); checkoutDisplay.value = '날짜 계산 오류'; }
}
function formatDateForOutput(dateString) {
    if (!dateString || dateString === '날짜 계산 오류') return '';
    try { const parts = dateString.split('-'); if (parts.length !== 3) throw new Error('Invalid date format'); const year = parseInt(parts[0], 10); const monthIndex = parseInt(parts[1], 10) - 1; const day = parseInt(parts[2], 10); const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]; const dateObj = new Date(Date.UTC(year, monthIndex, day)); if (isNaN(dateObj.getTime()) || dateObj.getUTCFullYear() !== year || dateObj.getUTCMonth() !== monthIndex || dateObj.getUTCDate() !== day) { throw new Error('Invalid date components'); } return `${day}-${monthNames[monthIndex]}-${year}`; }
    catch (e) { console.error("날짜 형식 변환 오류:", e, "입력값:", dateString); return dateString; }
}
function updateGuestNameInputs(numberOfRooms, container) {
    container.innerHTML = ''; const num = parseInt(numberOfRooms, 10); if (isNaN(num) || num < 1) return;
    for (let i = 1; i <= num; i++) { const roomDiv = document.createElement('div'); roomDiv.classList.add('guest-input-group'); const label = document.createElement('label'); label.textContent = `ROOM ${i}:`; label.htmlFor = `guestNameRoom${i}`; const input = document.createElement('input'); input.type = 'text'; input.id = `guestNameRoom${i}`; input.classList.add('guest-name-input'); input.placeholder = 'Last/First Title (예: JUNG/KEUNCHAE MR)'; input.required = true; roomDiv.appendChild(label); roomDiv.appendChild(input); container.appendChild(roomDiv); }
}
function createCurrencyCheckboxes(containerId, currencyList) {
    const container = document.getElementById(containerId); if (!container) { console.error(`Element with ID '${containerId}' not found.`); return; } container.innerHTML = '';
    const labelSpan = document.createElement('span'); labelSpan.classList.add('currency-label'); labelSpan.textContent = '통화:'; container.appendChild(labelSpan);
    currencyList.forEach((currencyCode, index) => { const itemDiv = document.createElement('div'); itemDiv.classList.add('currency-item'); const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.id = `curr_${currencyCode.toLowerCase()}`; checkbox.name = 'currency'; checkbox.value = currencyCode; if (index === 0) { checkbox.checked = true; }
    checkbox.addEventListener('change', (event) => { const currentCheckbox = event.target; if (currentCheckbox.checked) { const allCheckboxes = container.querySelectorAll('input[name="currency"]'); allCheckboxes.forEach(cb => { if (cb !== currentCheckbox) { cb.checked = false; } }); } else { const checkedCount = container.querySelectorAll('input[name="currency"]:checked').length; if (checkedCount === 0) { currentCheckbox.checked = true; } } });
    const label = document.createElement('label'); label.htmlFor = checkbox.id; label.textContent = currencyCode; itemDiv.appendChild(checkbox); itemDiv.appendChild(label); container.appendChild(itemDiv); });
}
function generateOutput(elements) {
    const hotelNameValue = elements.hotelSelect.options[elements.hotelSelect.selectedIndex].text; const checkinValue = elements.checkinDateInput.value; const nightsValue = elements.nightsInput.value; const checkoutValue = elements.checkoutDateDisplay.value; const numRoomsValue = elements.numRoomsInput.value; const roomCategoryValue = elements.categorySelect.value; const roomRateValue = elements.roomRateInput.value; const specialRequestsValue = elements.specialRequestsTextarea.value;
    const guestInputs = elements.guestNameInputsContainer.querySelectorAll('.guest-name-input'); let guestListString = ''; let allGuestsEntered = true; guestInputs.forEach((input, index) => { const guestName = input.value.trim(); if (guestName) { guestListString += `${index + 1}. ${guestName}\n`; } else { allGuestsEntered = false; } }); guestListString = guestListString.trim();
    const checkedBoxes = elements.requestCheckboxesContainer.querySelectorAll('input[name="common_request"]:checked'); const selectedRequests = []; checkedBoxes.forEach(checkbox => { selectedRequests.push(checkbox.value); }); const checkboxRequestString = selectedRequests.join(', '); const freeTextRequest = specialRequestsValue.trim(); let finalRequestString = ''; if (checkboxRequestString) { finalRequestString += checkboxRequestString; } if (freeTextRequest) { if (finalRequestString) { finalRequestString += `\n${freeTextRequest}`; } else { finalRequestString += freeTextRequest; } } if (!finalRequestString) { finalRequestString = 'None'; }
    const selectedCurrencyElement = document.querySelector('#currencySelection input[name="currency"]:checked'); const selectedCurrencyValue = selectedCurrencyElement ? selectedCurrencyElement.value : '';
    if (!hotelNameValue || elements.hotelSelect.selectedIndex === 0 || !checkinValue || !nightsValue || nightsValue <= 0 || !checkoutValue || !numRoomsValue || numRoomsValue <= 0 || !roomCategoryValue || elements.categorySelect.selectedIndex === 0 || !allGuestsEntered || !roomRateValue || roomRateValue < 0 || checkoutValue === '날짜 계산 오류' || !selectedCurrencyValue) { alert('모든 필수 항목을 올바르게 입력/선택하고 날짜와 박수, 투숙객 이름, 통화 단위를 확인해주세요.\n(박수, 객실 수는 1 이상, 요금은 0 이상이어야 합니다)'); elements.outputArea.value = ''; elements.copyButton.style.display = 'none'; return; }
     if (!checkoutValue || checkoutValue === '날짜 계산 오류'){ alert('체크아웃 날짜 계산에 문제가 있습니다. 체크인 날짜와 박수를 확인해주세요.'); return; }
    const checkinFormatted = formatDateForOutput(checkinValue); const checkoutFormatted = formatDateForOutput(checkoutValue); if (checkinFormatted === checkinValue || checkoutFormatted === checkoutValue) { console.warn("날짜 형식이<y_bin_46>-MM-DD로 표시될 수 있습니다. formatDateForOutput 함수 확인 필요."); }
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
Naeil Tour
`;
    elements.outputArea.value = outputText.trim(); elements.copyButton.style.display = 'inline-block';
}
function copyOutput(outputArea, copyButton) { if (!outputArea.value) return; navigator.clipboard.writeText(outputArea.value) .then(() => { const originalText = copyButton.textContent; copyButton.textContent = '복사 완료!'; setTimeout(() => { copyButton.textContent = originalText; }, 1500); }) .catch(err => { console.error('복사 실패: ', err); alert('내용 복사에 실패했습니다.'); }); }
function isValidDateYYYYMMDD(dateString) { if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) { return false; } const parts = dateString.split("-"); const year = parseInt(parts[0], 10); const month = parseInt(parts[1], 10); const day = parseInt(parts[2], 10); if (month < 1 || month > 12 || day < 1 || day > 31) { return false; } const testDate = new Date(year, month - 1, day); if (isNaN(testDate.getTime()) || testDate.getFullYear() !== year || testDate.getMonth() !== month - 1 || testDate.getDate() !== day) { return false; } return true; }

// --- === 코드 실행 시작 (DOM 로드 후) === ---
document.addEventListener('DOMContentLoaded', async () => {
    await loadHotelsFromCMS(); // 데이터 로드

    // DOM 요소 가져오기
    const hotelSelect = document.getElementById('hotelName');
    const categorySelect = document.getElementById('roomCategory');
    const checkinDateInput = document.getElementById('checkinDate');
    const nightsInput = document.getElementById('nightsInput');
    const checkoutDateDisplay = document.getElementById('checkoutDateDisplay');
    const numRoomsInput = document.getElementById('numRooms');
    const guestNameInputsContainer = document.getElementById('guestNameInputsContainer');
    const roomRateInput = document.getElementById('roomRate');
    const currencyContainerId = 'currencySelection';
    const requestCheckboxesContainer = document.getElementById('requestCheckboxes');
    const specialRequestsTextarea = document.getElementById('specialRequests');
    const generateButton = document.getElementById('generateButton');
    const outputArea = document.getElementById('outputArea');
    const copyButton = document.getElementById('copyButton');

    // UI 초기화
    populateHotelSelectAndCategories(hotelSelect, categorySelect);
    updateGuestNameInputs(numRoomsInput.value, guestNameInputsContainer);
    calculateCheckoutDate(checkinDateInput, nightsInput, checkoutDateDisplay);
    createCurrencyCheckboxes(currencyContainerId, currencies); // 통화 단위 체크박스 생성

    // 이벤트 리스너 등록
    hotelSelect.addEventListener('change', () => { populateCategorySelect(hotelSelect.value, categorySelect); });
    checkinDateInput.addEventListener('change', () => { calculateCheckoutDate(checkinDateInput, nightsInput, checkoutDateDisplay); });
    nightsInput.addEventListener('input', () => { calculateCheckoutDate(checkinDateInput, nightsInput, checkoutDateDisplay); });
    checkinDateInput.addEventListener('paste', (event) => { event.preventDefault(); const pastedText = event.clipboardData.getData('text/plain').trim(); if (isValidDateYYYYMMDD(pastedText)) { checkinDateInput.value = pastedText; checkinDateInput.dispatchEvent(new Event('change')); } else { alert('붙여넣기 실패: 날짜 형식이 올바르지 않습니다.\nYYYY-MM-DD 형식으로 입력해주세요. (예: 2025-08-10)'); } });
    numRoomsInput.addEventListener('input', () => { updateGuestNameInputs(numRoomsInput.value, guestNameInputsContainer); });
    generateButton.addEventListener('click', () => { generateOutput({ hotelSelect, categorySelect, checkinDateInput, nightsInput, checkoutDateDisplay, numRoomsInput, guestNameInputsContainer, roomRateInput, requestCheckboxesContainer, specialRequestsTextarea, outputArea, copyButton }); });
    copyButton.addEventListener('click', () => { copyOutput(outputArea, copyButton); });

}); // End of DOMContentLoaded
