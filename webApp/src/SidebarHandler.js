import $ from 'jquery';

export default class SidebarHandler {
    constructor(dataGEO, mapHandler) {
        this.dataGEO = dataGEO;
        this.mapHandler = mapHandler;

        this.sidebarResult = $('#sidebar__result');
        this.sidebarInput = $('#sidebar__input');

        this.sidebarResult.on('click', '.sidebar__result-item', (event) => {
            mapHandler.selectMarkerByCoordinates($(event.currentTarget).data('coord').split(','));
        });

        this.sidebarInput.on('input', () => {
            this.updateResultAll(this.searchObjects(this.sidebarInput.val()));
        });
    }

    // Функция для поиска объекта по id и/или name
    searchObjects(searchTerm) {
        // является ли введенное значение числом (если это число (id), то ищем сразу)
        if (!isNaN(searchTerm) && searchTerm !== '') {
            return this.dataGEO.filter(item => item.properties.id == searchTerm);
        }

        // Возвращаем всё, если меньше 3х символов
        if (searchTerm.length < 3) return this.dataGEO;

        // Поиск по name, если строка состоит из букв и длина >= 3
        return this.dataGEO.filter(item => item.properties.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // Рисуем item в sidebar
    printItem(item) {
        this.sidebarResult.append(`
            <div class="sidebar__result-item" data-coord="${item.geometry.coordinates}">
                <p>${item.properties.id}</p>
                <span>|</span>
                <p>${item.properties.name}</p>
            </div>
        `);
    }

    // Чистим всё, после выводим маркеры и item в sidebar
    updateResultAll(dataGEOResult) {
        this.sidebarResult.empty();
        this.mapHandler.clearAll()

        dataGEOResult.forEach((item) => {
            this.printItem(item)
            this.mapHandler.printMarker(item)
        })
    }
}
