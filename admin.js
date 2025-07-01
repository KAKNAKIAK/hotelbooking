document.addEventListener('DOMContentLoaded', () => {
    // 1. Firebase 설정
    const firebaseConfig = {
      apiKey: "AIzaSyCdBO6lIqqD6WQIFECI1M1mh1GABmCCSGM",
      authDomain: "hotelbooking-e6e2a.firebaseapp.com",
      projectId: "hotelbooking-e6e2a",
      storageBucket: "hotelbooking-e6e2a.appspot.com",
      messagingSenderId: "519756477724",
      appId: "1:519756477724:web:8e5cea894848f3d8e6f6d9",
      measurementId: "G-RVQHZJFDCS"
    };

    // Firebase 앱 초기화
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const auth = firebase.auth();
    const hotelsCollection = db.collection("hotels");

    // 2. DOM 요소 가져오기
    const hotelForm = document.getElementById('hotelForm');
    const hotelIdField = document.getElementById('hotelId');
    const countryField = document.getElementById('country');
    const regionField = document.getElementById('region');
    const hotelNameKoField = document.getElementById('hotelNameKo');
    const hotelNameEnField = document.getElementById('hotelNameEn');
    const roomCategoriesField = document.getElementById('roomCategoriesAdmin');
    const hotelList = document.getElementById('hotelList');
    const clearButton = document.getElementById('clearButton');
    const searchInput = document.getElementById('searchInput');
    const saveButton = document.getElementById('saveButton');

    let allHotels = []; // 모든 호텔 데이터를 저장할 배열
    let unsubscribe; // 실시간 리스너를 중지하기 위한 변수

    // 3. 함수 정의

    /**
     * 호텔 목록을 화면에 렌더링하는 함수 (검색어 필터링 포함)
     */
    const renderHotels = () => {
        const searchTerm = searchInput.value.toLowerCase();

        const filteredHotels = searchTerm
            ? allHotels.filter(hotelDoc => {
                const hotel = hotelDoc.data();
                const country = hotel.country?.toLowerCase() || '';
                const region = hotel.region?.toLowerCase() || '';
                const nameKo = hotel.hotelNameKo?.toLowerCase() || '';
                const nameEn = hotel.hotelNameEn?.toLowerCase() || '';
                
                return country.includes(searchTerm) ||
                       region.includes(searchTerm) ||
                       nameKo.includes(searchTerm) ||
                       nameEn.includes(searchTerm);
              })
            : allHotels;
        
        hotelList.innerHTML = '';

        if (filteredHotels.length === 0) {
            hotelList.innerHTML = `<tr><td colspan="6" style="text-align:center;">표시할 호텔이 없습니다.</td></tr>`;
            return;
        }

        filteredHotels.forEach(doc => {
            const hotel = doc.data();
            const categories = Array.isArray(hotel.roomCategories) ? hotel.roomCategories.join(', ') : '';
            const row = `
                <tr data-id="${doc.id}">
                    <td>${hotel.country || ''}</td>
                    <td>${hotel.region || ''}</td>
                    <td>${hotel.hotelNameKo || ''}</td>
                    <td>${hotel.hotelNameEn || ''}</td>
                    <td>${categories}</td>
                    <td class="actions">
                        <button class="btn-edit">수정</button>
                        <button class="btn-delete">삭제</button>
                    </td>
                </tr>
            `;
            hotelList.innerHTML += row;
        });
    };

    /**
     * Firestore에서 실시간으로 호텔 목록을 가져오는 리스너 설정
     */
    const setupHotelListener = () => {
        if (unsubscribe) unsubscribe();

        unsubscribe = hotelsCollection.orderBy("country").orderBy("region").orderBy("hotelNameKo").onSnapshot(snapshot => {
            allHotels = snapshot.docs;
            renderHotels();
        }, error => {
            console.error("호텔 목록 실시간 로딩 실패: ", error);
            alert("호텔 목록을 불러오는 데 실패했습니다.");
            hotelList.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">오류 발생: ${error.message}</td></tr>`;
        });
    };

    /**
     * 폼을 초기화하는 함수
     */
    const clearForm = () => {
        hotelForm.reset();
        hotelIdField.value = '';
        saveButton.textContent = '저장';
        saveButton.disabled = false;
    };

    /**
     * 모든 이벤트 리스너를 설정하는 함수
     * 로그인 성공 후에만 호출되어야 합니다.
     */
    const setupEventListeners = () => {
        // 검색창
        searchInput.addEventListener('input', renderHotels);

        // 폼 제출 (저장/수정)
        hotelForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            saveButton.disabled = true;
            saveButton.textContent = '저장 중...';

            const hotelData = {
                country: countryField.value.trim(),
                region: regionField.value.trim(),
                hotelNameKo: hotelNameKoField.value.trim(),
                hotelNameEn: hotelNameEnField.value.trim(),
                roomCategories: roomCategoriesField.value.split(',').map(s => s.trim()).filter(s => s)
            };
            const currentId = hotelIdField.value;

            try {
                if (currentId) {
                    await hotelsCollection.doc(currentId).set(hotelData, { merge: true });
                    alert('호텔 정보가 성공적으로 수정되었습니다.');
                } else {
                    await hotelsCollection.add(hotelData);
                    alert('새 호텔이 성공적으로 추가되었습니다.');
                }
                clearForm();
            } catch (error) {
                console.error("데이터 저장 실패: ", error);
                alert(`데이터 저장 중 오류가 발생했습니다: ${error.message}`);
                saveButton.disabled = false; // 오류 발생 시 버튼 활성화
                saveButton.textContent = '저장';
            }
        });

        // 목록의 버튼 클릭 (수정/삭제)
        hotelList.addEventListener('click', async (e) => {
            const target = e.target;
            const row = target.closest('tr');
            if (!row || !row.dataset.id) return;
            const docId = row.dataset.id;

            if (target.classList.contains('btn-edit')) {
                try {
                    const doc = await hotelsCollection.doc(docId).get();
                    if (!doc.exists) {
                        alert('해당 문서를 찾을 수 없습니다.'); return;
                    }
                    const hotel = doc.data();
                    hotelIdField.value = docId;
                    countryField.value = hotel.country;
                    regionField.value = hotel.region;
                    hotelNameKoField.value = hotel.hotelNameKo;
                    hotelNameEnField.value = hotel.hotelNameEn;
                    roomCategoriesField.value = Array.isArray(hotel.roomCategories) ? hotel.roomCategories.join(', ') : '';
                    saveButton.textContent = '수정 완료';
                    window.scrollTo(0, 0);
                    countryField.focus();
                } catch (error) {
                    alert(`데이터를 불러오는 데 실패했습니다: ${error.message}`);
                }
            }

            if (target.classList.contains('btn-delete')) {
                if (confirm("정말로 이 호텔을 삭제하시겠습니까?")) {
                    try {
                        await hotelsCollection.doc(docId).delete();
                        alert("호텔이 삭제되었습니다.");
                    } catch (error) {
                        console.error("삭제 실패: ", error);
                        alert(`삭제 중 오류가 발생했습니다: ${error.message}`);
                    }
                }
            }
        });
        
        // '새로 입력' 버튼
        clearButton.addEventListener('click', clearForm);
    };

    // 4. 초기 실행
    auth.signInAnonymously()
        .then(() => {
            console.log("익명으로 로그인 성공.");
            // 로그인이 성공한 후에 데이터 리스너와 이벤트 리스너를 모두 설정합니다.
            setupHotelListener();
            setupEventListeners();
        })
        .catch((error) => {
            console.error("익명 로그인 실패: ", error);
            alert(`Firebase 인증에 실패했습니다: ${error.message}`);
            hotelList.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">Firebase 인증 실패. 페이지를 새로고침 해주세요.</td></tr>`;
        });
});
