// js.js (Firebase 연동 및 다국어 번역 기능 추가 버전)

// --- 데이터 ---
let hotelData = []; // Firestore에서 가져온 원본 데이터
const currencies = ["VND", "USD", "TWD", "THB", "SGD", "NZD", "MYR", "JPY", "HKD", "GBP", "EUR", "CZK", "CNY", "CHF", "CAD", "AUD", "PHP", "MOP", "HUF", "IDR", "HRK"];

// --- 다국어 번역 데이터 ---
const translations = {
    ko: {
        greeting: "안녕하세요, 내일투어입니다!",
        request_intro: "아래와 같이 신규 예약을 요청하오니 확인 후 회신 부탁드립니다.",
        booking_details: "[예약 상세 정보]",
        hotel: "호텔명",
        check_in: "체크인",
        check_out: "체크아웃",
        room_type: "객실 타입",
        nights: "박",
        nights_suffix: "",
        rooms: "객실",
        rooms_suffix: "",
        guest_name: "투숙객명 (성/이름)",
        room_rate: "객실 요금",
        request: "요청사항",
        none: "없음",
        looking_forward: "빠른 회신 기다리겠습니다.",
        best_regards: "감사합니다,\n내일투어 드림"
    },
    en: {
        greeting: "Greetings from Naeil Tour, Korea!",
        request_intro: "Please find the new booking request as below and confirm the booking.",
        booking_details: "[Booking Details]",
        hotel: "Hotel",
        check_in: "Check in",
        check_out: "Check out",
        room_type: "Room Type",
        nights: "Nights",
        nights_suffix: "",
        rooms: "Rooms",
        rooms_suffix: "",
        guest_name: "Guest Name(Last/First)",
        room_rate: "Room Rate",
        request: "Request",
        none: "None",
        looking_forward: "Looking forward to hearing from you soon.",
        best_regards: "Best regards,\nNAEILTOUR"
    },
    ja: {
        greeting: "お世話になっております。韓国のNAEILTOUR（ネイルツアー）ーでございます。",
        request_intro: "下記の通り新規予約をお願いいたします。ご確認の上、ご返信いただきますようお願いいたします。",
        booking_details: "【予約詳細】",
        hotel: "ホテル名",
        check_in: "チェックイン",
        check_out: "チェックアウト",
        room_type: "ルームタイプ",
        nights: "泊",
        nights_suffix: "",
        rooms: "室",
        rooms_suffix: "",
        guest_name: "宿泊者名（姓／名）",
        room_rate: "宿泊料金",
        request: "リクエスト",
        none: "なし",
        looking_forward: "ご返信をお待ちしております。",
        best_regards: "何卒よろしくお願い申し上げます。\nNAEILTOUR"
    },
    zh: {
        greeting: "您好，NAEILTOUR。",
        request_intro: "请确认以下新预订请求。",
        booking_details: "【预订详情】",
        hotel: "酒店名称",
        check_in: "入住日期",
        check_out: "退房日期",
        room_type: "房型",
        nights: "晚",
        nights_suffix: "",
        rooms: "间",
        rooms_suffix: "",
        guest_name: "住客姓名（姓/名）",
        room_rate: "房价",
        request: "特殊要求",
        none: "无",
        looking_forward: "期待您的尽快回复。",
        best_regards: "此致，\nNAEILTOUR"
    },
    es: {
        greeting: "Estimados señores:",
        request_intro: "Adjuntamos una nueva solicitud de reserva para su confirmación.",
        booking_details: "Detalles de la Reserva",
        hotel: "Hotel",
        check_in: "Entrada",
        check_out: "Salida",
        room_type: "Tipo de Habitación",
        nights: "Noches",
        nights_suffix: "",
        rooms: "Habitaciones",
        rooms_suffix: "",
        guest_name: "Nombre del Huésped (Apellido/Nombre)",
        room_rate: "Tarifa de Habitación",
        request: "Solicitud",
        none: "Ninguna",
        looking_forward: "Quedamos a la espera de su respuesta.",
        best_regards: "Atentamente,\nNaeil Tour"
    }
};


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

function generateOutput() {
    const elements = {
        hotelSelect: document.getElementById('hotelName'),
        checkinDateInput: document.getElementById('checkinDate'),
        nightsInput: document.getElementById('nightsInput'),
        checkoutDateDisplay: document.getElementById('checkoutDateDisplay'),
        numRoomsInput: document.getElementById('numRooms'),
        categorySelect: document.getElementById('roomCategory'),
        specialRequestsTextarea: document.getElementById('specialRequests'),
        guestNameInputsContainer: document.getElementById('guestNameInputsContainer'),
        requestCheckboxesContainer: document.getElementById('requestCheckboxes'),
        outputArea: document.getElementById('outputArea'),
        copyButton: document.getElementById('copyButton')
    };

    let alertMessages = [];
    if (elements.hotelSelect.selectedIndex === 0) alertMessages.push("호텔명을 선택해주세요.");
    if (!elements.checkinDateInput.value) alertMessages.push("체크인 날짜를 입력해주세요.");
    if (!elements.nightsInput.value || elements.nightsInput.value <= 0) alertMessages.push("박수를 1 이상 입력해주세요.");
    if (!elements.checkoutDateDisplay.value || elements.checkoutDateDisplay.value.includes('오류')) alertMessages.push("체크아웃 날짜를 확인해주세요.");
    if (!elements.numRoomsInput.value || elements.numRoomsInput.value <= 0) alertMessages.push("객실 수를 1 이상 입력해주세요.");
    if (!elements.categorySelect.value) alertMessages.push("객실 카테고리를 선택해주세요.");

    const guestInputs = elements.guestNameInputsContainer.querySelectorAll('.guest-name-input');
    let guestListString = '';
    let allGuestsEntered = true;
    if (guestInputs.length === 0 && parseInt(elements.numRoomsInput.value, 10) > 0) {
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
        elements.outputArea.value = '';
        elements.copyButton.style.display = 'none';
        return;
    }

    const selectedLanguage = document.querySelector('input[name="language"]:checked').value;
    const T = translations[selectedLanguage];

    const hotelNameValue = elements.hotelSelect.options[elements.hotelSelect.selectedIndex].text;
    const checkinFormatted = formatDateForOutput(elements.checkinDateInput.value);
    const checkoutFormatted = formatDateForOutput(elements.checkoutDateDisplay.value);
    const selectedRequests = Array.from(elements.requestCheckboxesContainer.querySelectorAll('input:checked')).map(cb => cb.value).join(', ');
    const freeTextRequest = elements.specialRequestsTextarea.value.trim();
    let finalRequestString = [selectedRequests, freeTextRequest].filter(Boolean).join('\n');
    if (!finalRequestString) finalRequestString = T.none;

    const nightsStr = `${elements.nightsInput.value} ${T.nights}${T.nights_suffix}`;
    const roomsStr = `${elements.numRoomsInput.value} ${T.rooms}${T.rooms_suffix}`;

    const outputText = `${T.greeting}
${T.request_intro}

${T.booking_details}
${T.hotel}: ${hotelNameValue}
${T.check_in}: ${checkinFormatted}
${T.check_out}: ${checkoutFormatted}
${T.room_type}: ${elements.categorySelect.value}
${T.nights.charAt(0).toUpperCase() + T.nights.slice(1)}: ${nightsStr}
${T.rooms.charAt(0).toUpperCase() + T.rooms.slice(1)}: ${roomsStr}

${T.guest_name}:
${guestListString.trim()}

${T.room_rate}: ${roomRateValue.toLocaleString()} ${selectedCurrencyElement.value}
${T.request}: ${finalRequestString}

${T.looking_forward}

${T.best_regards}`;

    elements.outputArea.value = outputText.trim();
    elements.copyButton.style.display = 'inline-block';
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
        hotelSearchInput: document.getElementById('hotelSearch'),
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
        addRowButton: document.getElementById('addRowButton'),
        languageRadios: document.querySelectorAll('input[name="language"]')
    };

    // --- 초기화 및 데이터 로드 ---
    createCurrencyCheckboxes('currencySelection', currencies);
    await loadHotelsFromFirestore();
    populateHotelSelectAndCategories(elements.hotelSelect, elements.categorySelect);

    updateGuestNameInputs(elements.numRoomsInput.value, elements.guestNameInputsContainer);
    calculateCheckoutDate(elements.checkinDateInput, elements.nightsInput, elements.checkoutDateDisplay);
    syncFormInputsToTable(elements.nightsInput.value, elements.numRoomsInput.value, elements.totalSumInput);

    // --- 이벤트 리스너 설정 ---

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
    elements.generateButton.addEventListener('click', generateOutput);
    elements.copyButton.addEventListener('click', () => copyOutput(elements.outputArea, elements.copyButton));

    elements.languageRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (elements.outputArea.value) {
                generateOutput();
            }
        });
    });

    document.querySelectorAll('input[type="text"], input[type="number"]').forEach(input => {
        input.addEventListener('focus', () => input.select());
    });
    
    // --- 객실 문의하기 버튼 (한글/영문 분리) ---
    
    // 문의 내용 생성 및 복사 로직을 하나의 함수로 묶어 중복을 제거합니다.
    const handleInquiryCopy = (language, buttonElement) => {
        const hotelSelect = document.getElementById('hotelName');
        const hotelNameText = hotelSelect.selectedIndex > 0 ? hotelSelect.options[hotelSelect.selectedIndex].text : '';
        const checkinDate = document.getElementById('checkinDate').value;
        const checkoutDate = document.getElementById('checkoutDateDisplay').value;
        const nights = document.getElementById('nightsInput').value;
        const roomType = document.getElementById('roomCategory').value;
        const numRooms = document.getElementById('numRooms').value;

        // 필수 값 검사
        if (!hotelNameText || hotelSelect.selectedIndex === 0 || !checkinDate || !roomType) {
            alert('호텔, 체크인 날짜, 객실 카테고리를 모두 선택해주세요.');
            return;
        }

        // 호텔명 파싱
        let hotelNameKo = '', hotelNameEn = '';
        if (hotelNameText.includes(']')) {
            const nameParts = hotelNameText.split(']')[1].trim().split(' / ');
            hotelNameKo = nameParts[0]?.trim() || '';
            hotelNameEn = nameParts[1]?.trim() || '';
        } else {
            hotelNameKo = hotelNameText.trim();
        }

        let textToCopy = '';

        if (language === 'ko') {
            textToCopy = `리조트(호텔)명 : ${hotelNameKo}\n` +
                         `체크인날짜 / 체크아웃날짜: ${checkinDate} / ${checkoutDate}\n` +
                         `박수 : ${nights}박\n` +
                         `룸타입 : ${roomType}\n` +
                         `객실 수 : ${numRooms}개`;
        } else { // 'en'
            textToCopy = `Hotel/Resort Name (Korean): ${hotelNameKo}\n` +
                         `Hotel/Resort Name (English): ${hotelNameEn}\n` +
                         `Check-in Date / Check-out Date: ${checkinDate} / ${checkoutDate}\n` +
                         `Number of Nights: ${nights}\n` +
                         `Room Type: ${roomType}\n` +
                         `Number of Rooms: ${numRooms}`;
        }

        // 클립보드에 복사 및 버튼 피드백
        navigator.clipboard.writeText(textToCopy).then(() => {
            const originalText = buttonElement.textContent;
            const originalColor = buttonElement.style.backgroundColor;
            buttonElement.textContent = '복사 완료!';
            buttonElement.style.backgroundColor = '#28a745'; // 성공 시 초록색
            setTimeout(() => {
                buttonElement.textContent = originalText;
                buttonElement.style.backgroundColor = originalColor;
            }, 2000);
        }).catch(err => {
            console.error('문의 내용 복사 실패: ', err);
            alert('문의 내용 복사에 실패했습니다.');
        });
    };

    const inquiryButtonKo = document.getElementById('inquiryButtonKo');
    const inquiryButtonEn = document.getElementById('inquiryButtonEn');

    if (inquiryButtonKo) {
        inquiryButtonKo.addEventListener('click', () => handleInquiryCopy('ko', inquiryButtonKo));
    }
    if (inquiryButtonEn) {
        inquiryButtonEn.addEventListener('click', () => handleInquiryCopy('en', inquiryButtonEn));
    }

    console.log("수배서 작성기 초기화 완료.");
});
