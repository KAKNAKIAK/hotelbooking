// js.js (Firebase 연동 및 검색 기능 추가 버전)

// --- 데이터 ---
let hotelData = []; // Firestore에서 가져온 원본 데이터
const currencies = ["VND", "USD", "TWD", "THB", "SGD", "NZD", "MYR", "JPY", "HKD", "GBP", "EUR", "CZK", "CNY", "CHF", "CAD", "AUD", "PHP", "MOP", "HUF", "IDR", "HRK"];

// --- 함수 정의 ---

/**
 * Firebase Firestore에서 호텔 데이터를 비동기적으로 로드하는 함수
 */
async function loadHotelsFromFirestore() {
    const firebaseConfig = {
      apiKey: "AIzaSyCdBO6lIqqD6WQIFECI1M1mh1GABmCCSGM",
      authDomain: "hotelbooking-e6e2a.firebaseapp.com",
      projectId: "hotelbooking-e6e2a",
      storageBucket: "hotelbooking-e6e2a.appspot.com",
      messagingSenderId: "519756477724",
      appId: "1:519756477724:web:8e5cea894848f3d8e6f6d9",
      measurementId: "G-RVQHZJFDCS"
    };
    
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const db = firebase.firestore();
    const auth = firebase.auth();

    try {
        await auth.signInAnonymously();
        console.log("익명 로그인 성공 (수배서 작성기).");

        const snapshot = await db.collection("hotels").orderBy("country").orderBy("hotelNameKo").get();
        if (snapshot.empty) {
            console.warn("Firestore에 호텔 데이터가 없습니다.");
            hotelData = [];
            return;
        }
        
        hotelData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                // 검색 및 표시에 사용될 통합 이름
                name: `[${data.country}/${data.region}] ${data.hotelNameKo} / ${data.hotelNameEn}`, 
                categories: data.roomCategories || []
            };
        });
        console.log('Firestore에서 호텔 데이터 로드 완료:', hotelData);
    } catch (error) {
        console.error('Firestore에서 호텔 데이터 로드 실패:', error);
        alert(`호텔 데이터를 불러오는 데 실패했습니다: ${error.message}`);
        hotelData = [];
    }
}

/**
 * 검색어에 따라 호텔 목록 드롭다운을 채우는 함수
 * @param {HTMLSelectElement} hotelSelect - 호텔 선택 드롭다운 요소
 * @param {HTMLSelectElement} categorySelect - 객실 카테고리 선택 드롭다운 요소
 * @param {string} searchTerm - 필터링할 검색어
 */
function populateHotelSelectAndCategories(hotelSelect, categorySelect, searchTerm = '') {
    const lowerCaseSearchTerm = searchTerm.toLowerCase().trim();

    // 검색어에 따라 호텔 데이터 필터링
    const filteredHotels = hotelData.filter(hotel => {
        if (!lowerCaseSearchTerm) return true; // 검색어가 없으면 모든 호텔 표시
        return hotel.name.toLowerCase().includes(lowerCaseSearchTerm);
    });

    // 드롭다운 목록 초기화
    while (hotelSelect.options.length > 1) { hotelSelect.remove(1); }
    
    if (filteredHotels.length === 0) {
        hotelSelect.options[0].textContent = "-- 검색 결과 없음 --";
    } else {
        hotelSelect.options[0].textContent = "-- 호텔 선택 --";
        filteredHotels.forEach((hotel) => {
            const option = document.createElement('option');
            option.value = hotel.id;
            option.textContent = hotel.name;
            hotelSelect.appendChild(option);
        });
    }
    
    hotelSelect.value = "";
    if (categorySelect) populateCategorySelect(null, categorySelect);
}

function populateCategorySelect(hotelId, categorySelect) {
    while (categorySelect.options.length > 1) { categorySelect.remove(1); }
    categorySelect.value = "";
    if (!hotelId) {
        categorySelect.options[0].textContent = "-- 호텔 먼저 선택 --";
        return;
    }
    const selectedHotel = hotelData.find(hotel => hotel.id === hotelId);
    if (selectedHotel && Array.isArray(selectedHotel.categories) && selectedHotel.categories.length > 0) {
        categorySelect.options[0].textContent = "-- 카테고리 선택 --";
        selectedHotel.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    } else {
        categorySelect.options[0].textContent = "-- 카테고리 없음 --";
    }
}

// (calculateCheckoutDate, formatDateForOutput 등 나머지 함수는 이전과 동일합니다)
function calculateCheckoutDate(checkinInput, nightsInput, checkoutDisplay) {
    const checkinValue = checkinInput.value;
    const nightsValue = parseInt(nightsInput.value, 10);
    if (!checkinValue || isNaN(nightsValue) || nightsValue <= 0) {
        checkoutDisplay.value = '';
        return;
    }
    try {
        const checkinDate = new Date(checkinValue);
        if (isNaN(checkinDate.getTime())) {
            checkoutDisplay.value = '유효하지 않은 체크인 날짜';
            return;
        }
        const checkoutDate = new Date(checkinDate);
        checkoutDate.setDate(checkoutDate.getDate() + nightsValue);
        const year = checkoutDate.getFullYear();
        const month = String(checkoutDate.getMonth() + 1).padStart(2, '0');
        const day = String(checkoutDate.getDate()).padStart(2, '0');
        checkoutDisplay.value = `${year}-${month}-${day}`;
    } catch (error) {
        console.error("체크아웃 날짜 계산 오류:", error);
        checkoutDisplay.value = '날짜 계산 오류';
    }
}

function formatDateForOutput(dateString) {
    if (!dateString || dateString.includes('오류') || dateString.includes('유효하지')) return '';
    try {
        const dateObj = new Date(dateString);
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = monthNames[dateObj.getMonth()];
        const year = dateObj.getFullYear();
        return `${day}-${month}-${year}`;
    } catch (e) {
        console.error("날짜 형식 변환 오류:", e, dateString);
        return dateString;
    }
}

function updateGuestNameInputs(numberOfRooms, container) {
    container.innerHTML = '';
    const num = parseInt(numberOfRooms, 10);
    if (isNaN(num) || num < 1) return;
    for (let i = 1; i <= num; i++) {
        const roomDiv = document.createElement('div');
        roomDiv.classList.add('guest-input-group');
        roomDiv.innerHTML = `
            <label for="guestNameRoom${i}">ROOM ${i}:</label>
            <input type="text" id="guestNameRoom${i}" class="guest-name-input" placeholder="Last/First Title (예: JUNG/KEUNCHAE MR)" required>
        `;
        container.appendChild(roomDiv);
    }
}

function createCurrencyCheckboxes(containerId, currencyList) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '<span class="currency-label">통화:</span>';
    currencyList.forEach((currencyCode, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('currency-item');
        const checkboxId = `curr_${currencyCode.toLowerCase()}`;
        itemDiv.innerHTML = `
            <input type="checkbox" id="${checkboxId}" name="currency" value="${currencyCode}" ${index === 0 ? 'checked' : ''}>
            <label for="${checkboxId}">${currencyCode}</label>
        `;
        container.appendChild(itemDiv);
    });
    container.addEventListener('change', (event) => {
        if (event.target.name === 'currency') {
            const currentCheckbox = event.target;
            if (currentCheckbox.checked) {
                container.querySelectorAll('input[name="currency"]').forEach(cb => {
                    if (cb !== currentCheckbox) cb.checked = false;
                });
            } else if (container.querySelectorAll('input[name="currency"]:checked').length === 0) {
                currentCheckbox.checked = true;
            }
        }
    });
}

function addCustomRateRow() {
    const tableBody = document.querySelector('#rateCalculationTable tbody');
    const etcRow = tableBody.querySelector('tr[data-row-id="etc"]');
    if (!tableBody || !etcRow) return;

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
    newRow.querySelectorAll('input').forEach(input => {
        input.addEventListener('focus', function() { this.select(); });
    });
}

function syncFormInputsToTable(nightsValue, roomsValue, totalSumInput) {
    const tableBody = document.querySelector('#rateCalculationTable tbody');
    if (!tableBody) return;
    tableBody.querySelectorAll('tr:not(#total-row)').forEach(row => {
        const input2 = row.querySelector('.input2');
        const input3 = row.querySelector('.input3');
        if (input2) input2.value = nightsValue;
        if (input3) input3.value = roomsValue;
        calculateRowAndUpdateTotal(row, totalSumInput);
    });
}

function calculateRowAndUpdateTotal(row, totalSumInput) {
    const value1 = parseFloat(row.querySelector('.input1')?.value) || 0;
    const value2 = parseFloat(row.querySelector('.input2')?.value) || 0;
    const value3 = parseFloat(row.querySelector('.input3')?.value) || 0;
    const outputCell = row.querySelector('.output-cell');
    if (outputCell) {
        outputCell.textContent = (value1 * value2 * value3).toLocaleString();
    }
    updateTotalSum(totalSumInput);
}

function updateTotalSum(totalSumInput) {
    if (!totalSumInput) return;
    let total = 0;
    document.querySelectorAll('#rateCalculationTable tbody tr:not(#total-row) .output-cell').forEach(cell => {
        total += parseFloat(cell.textContent.replace(/,/g, '')) || 0;
    });
    totalSumInput.value = total;
}

function generateOutput(elements) {
    const { hotelSelect, checkinDateInput, nightsInput, checkoutDateDisplay, numRoomsInput, categorySelect, specialRequestsTextarea, guestNameInputsContainer, requestCheckboxesContainer, outputArea, copyButton } = elements;
    
    let alertMessages = [];
    if (hotelSelect.selectedIndex === 0) alertMessages.push("호텔명을 선택해주세요.");
    if (!checkinDateInput.value) alertMessages.push("체크인 날짜를 입력해주세요.");
    if (!nightsInput.value || nightsInput.value <= 0) alertMessages.push("박수를 1 이상 입력해주세요.");
    if (!checkoutDateDisplay.value || checkoutDateDisplay.value.includes('오류')) alertMessages.push("체크아웃 날짜를 확인해주세요.");
    if (!numRoomsInput.value || numRoomsInput.value <= 0) alertMessages.push("객실 수를 1 이상 입력해주세요.");
    if (!categorySelect.value) alertMessages.push("객실 카테고리를 선택해주세요.");

    const guestInputs = guestNameInputsContainer.querySelectorAll('.guest-name-input');
    let guestListString = '';
    let allGuestsEntered = true;
    if (guestInputs.length === 0 && parseInt(numRoomsInput.value, 10) > 0) {
        allGuestsEntered = false;
    } else {
        guestInputs.forEach((input, index) => {
            const guestName = input.value.trim();
            if (guestName) {
                guestListString += `Room ${index + 1}. ${guestName}\n`;
            } else {
                allGuestsEntered = false;
            }
        });
    }
    if (!allGuestsEntered) alertMessages.push("모든 객실의 투숙객 이름을 입력해주세요.");

    const totalSumInput = document.getElementById('total-sum-input');
    const roomRateValue = parseFloat(totalSumInput.value) || 0;
    const selectedCurrencyElement = document.querySelector('#currencySelection input[name="currency"]:checked');
    if (!selectedCurrencyElement) alertMessages.push("통화 단위를 선택해주세요.");

    if (alertMessages.length > 0) {
        alert("다음 항목을 확인해주세요:\n- " + alertMessages.join("\n- "));
        outputArea.value = '';
        copyButton.style.display = 'none';
        return;
    }

    const hotelNameValue = hotelSelect.options[hotelSelect.selectedIndex].text;
    const checkinFormatted = formatDateForOutput(checkinDateInput.value);
    const checkoutFormatted = formatDateForOutput(checkoutDateDisplay.value);
    const selectedRequests = Array.from(requestCheckboxesContainer.querySelectorAll('input:checked')).map(cb => cb.value).join(', ');
    const freeTextRequest = specialRequestsTextarea.value.trim();
    let finalRequestString = [selectedRequests, freeTextRequest].filter(Boolean).join('\n');
    if (!finalRequestString) finalRequestString = 'None';

    const outputText = `Greetings from Naeil Tour, Korea!
Please find the new booking request as below and confirm the booking.

[Booking Details]
Hotel: ${hotelNameValue}
Check in: ${checkinFormatted}
Check out: ${checkoutFormatted}
Room Type: ${categorySelect.value}
Nights: ${nightsInput.value} Nights
Rooms: ${numRoomsInput.value} Rooms

Guest Name(Last/First):
${guestListString.trim()}

Room Rate: ${roomRateValue.toLocaleString()} ${selectedCurrencyElement.value}
Request: ${finalRequestString}

Looking forward to hearing from you soon.

Best regards,
Naeil Tour`;

    outputArea.value = outputText.trim();
    copyButton.style.display = 'inline-block';
}

function copyOutput(outputArea, copyButton) {
    if (!outputArea.value) return;
    navigator.clipboard.writeText(outputArea.value).then(() => {
        const originalText = copyButton.textContent;
        copyButton.textContent = '복사 완료!';
        setTimeout(() => { copyButton.textContent = originalText; }, 1500);
    }).catch(err => {
        console.error('복사 실패: ', err);
        alert('내용 복사에 실패했습니다.');
    });
}

// --- === 코드 실행 시작 (DOM 로드 후) === ---
document.addEventListener('DOMContentLoaded', async () => {
    // --- 요소 선택 ---
    const elements = {
        hotelSearchInput: document.getElementById('hotelSearch'), // 검색창 추가
        hotelSelect: document.getElementById('hotelName'),
        categorySelect: document.getElementById('roomCategory'),
        checkinDateInput: document.getElementById('checkinDate'),
        nightsInput: document.getElementById('nightsInput'),
        checkoutDateDisplay: document.getElementById('checkoutDateDisplay'),
        numRoomsInput: document.getElementById('numRooms'),
        guestNameInputsContainer: document.getElementById('guestNameInputsContainer'),
        requestCheckboxesContainer: document.getElementById('requestCheckboxes'),
        specialRequestsTextarea: document.getElementById('specialRequests'),
        generateButton: document.getElementById('generateButton'),
        outputArea: document.getElementById('outputArea'),
        copyButton: document.getElementById('copyButton'),
        rateTableBody: document.querySelector('#rateCalculationTable tbody'),
        totalSumInput: document.getElementById('total-sum-input'),
        addRowButton: document.getElementById('addRowButton')
    };

    // --- 초기화 및 데이터 로드 ---
    createCurrencyCheckboxes('currencySelection', currencies);
    await loadHotelsFromFirestore(); // Firestore에서 전체 호텔 데이터 로드
    // 처음에는 모든 호텔 목록을 보여줌
    populateHotelSelectAndCategories(elements.hotelSelect, elements.categorySelect);
    
    updateGuestNameInputs(elements.numRoomsInput.value, elements.guestNameInputsContainer);
    calculateCheckoutDate(elements.checkinDateInput, elements.nightsInput, elements.checkoutDateDisplay);
    syncFormInputsToTable(elements.nightsInput.value, elements.numRoomsInput.value, elements.totalSumInput);

    // --- 이벤트 리스너 설정 ---

    // 검색창에 입력할 때마다 호텔 목록 필터링
    elements.hotelSearchInput.addEventListener('input', () => {
        populateHotelSelectAndCategories(elements.hotelSelect, elements.categorySelect, elements.hotelSearchInput.value);
    });

    elements.hotelSelect.addEventListener('change', () => populateCategorySelect(elements.hotelSelect.value, elements.categorySelect));
    elements.checkinDateInput.addEventListener('change', () => calculateCheckoutDate(elements.checkinDateInput, elements.nightsInput, elements.checkoutDateDisplay));
    
    const updateBoth = () => {
        calculateCheckoutDate(elements.checkinDateInput, elements.nightsInput, elements.checkoutDateDisplay);
        syncFormInputsToTable(elements.nightsInput.value, elements.numRoomsInput.value, elements.totalSumInput);
    };
    elements.nightsInput.addEventListener('input', updateBoth);
    elements.numRoomsInput.addEventListener('input', () => {
        updateGuestNameInputs(elements.numRoomsInput.value, elements.guestNameInputsContainer);
        updateBoth();
    });

    elements.rateTableBody.addEventListener('input', (e) => {
        if (e.target.matches('.input1, .input2, .input3')) {
            calculateRowAndUpdateTotal(e.target.closest('tr'), elements.totalSumInput);
        }
    });

    elements.rateTableBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-row-btn')) {
            e.target.closest('tr').remove();
            updateTotalSum(elements.totalSumInput);
        }
    });

    elements.addRowButton.addEventListener('click', addCustomRateRow);
    elements.generateButton.addEventListener('click', () => generateOutput(elements));
    elements.copyButton.addEventListener('click', () => copyOutput(elements.outputArea, elements.copyButton));

    document.querySelectorAll('input[type="text"], input[type="number"]').forEach(input => {
        input.addEventListener('focus', () => input.select());
    });
    
    console.log("수배서 작성기 초기화 완료.");
});
