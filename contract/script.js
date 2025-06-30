// DOM이 완전히 로드되면 스크립트를 실행합니다.
document.addEventListener('DOMContentLoaded', function() {

    // --- 모달 관련 요소 및 함수 ---
    const modal = document.getElementById('detailModal');
    const modalContent = modal.querySelector('.modal-content');
    const openModalBtns = document.querySelectorAll('.open-modal-btn');
    const closeModalBtn = document.querySelector('.modal-close');

    /**
     * 상세 정보 모달을 엽니다.
     * 부드러운 애니메이션 효과를 위해 opacity와 transform 속성을 사용합니다.
     */
    function openModal() {
        modal.style.display = 'block';
        // 애니메이션 효과를 위해 약간의 지연 후 스타일 변경
        setTimeout(() => {
            modal.style.opacity = '1';
            modalContent.style.transform = 'translateY(0)';
        }, 10);
    }

    /**
     * 상세 정보 모달을 닫습니다.
     * 부드러운 애니메이션 효과를 위해 opacity와 transform 속성을 사용합니다.
     */
    function closeModal() {
        modal.style.opacity = '0';
        modalContent.style.transform = 'translateY(-50px)';
        // 애니메이션이 끝난 후 display 속성을 변경하여 모달을 완전히 숨깁니다.
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }

    // '상세 보기' 버튼들에 클릭 이벤트 리스너를 추가합니다.
    openModalBtns.forEach(btn => {
        btn.addEventListener('click', (event) => {
            event.stopPropagation(); // 이벤트 버블링 방지
            openModal();
        });
    });

    // 모달 닫기(X) 버튼에 클릭 이벤트 리스너를 추가합니다.
    closeModalBtn.addEventListener('click', closeModal);

    // 모달 외부를 클릭했을 때 모달이 닫히도록 설정합니다.
    window.addEventListener('click', function(event) {
        if (event.target == modal) {
            closeModal();
        }
    });


    // --- 테이블 확장/축소 관련 요소 및 함수 ---
    const expandableRows = document.querySelectorAll('.expandable-row');

    /**
     * 하위 프로모션 목록을 보여주거나 숨깁니다.
     * @param {HTMLElement} parentRow - 클릭된 호텔 목록 행(tr)
     */
    function toggleSubRow(parentRow) {
        // data-target 속성에서 하위 행의 ID를 가져옵니다.
        const subRowId = parentRow.dataset.target;
        const subRow = document.getElementById(subRowId);
        
        if (subRow) {
            if (subRow.style.display === 'table-row') {
                subRow.style.display = 'none';
                parentRow.classList.remove('expanded'); // 아이콘 회전을 위한 클래스 제거
            } else {
                subRow.style.display = 'table-row';
                parentRow.classList.add('expanded'); // 아이콘 회전을 위한 클래스 추가
            }
        }
    }

    // 확장 가능한 각 행에 클릭 이벤트 리스너를 추가합니다.
    expandableRows.forEach(row => {
        row.addEventListener('click', function() {
            toggleSubRow(this);
        });
    });

});
