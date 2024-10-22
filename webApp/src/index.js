import $ from 'jquery'
import './styles.scss'

import MapHandler from "./MapHandler";
import SidebarHandler from "./SidebarHandler";

$(document).ready(function() {
    // Глобальные переменные
    let dataGEO

    // получаем сген. данные и создаём карту и sidebar
    $.getJSON('data.json', (result) => {
        dataGEO = result.features

        const mapHandler = new MapHandler(dataGEO)
        const sidebarHandler = new SidebarHandler(dataGEO, mapHandler)

        sidebarHandler.updateResultAll(dataGEO)
    }).fail((jqxhr, textStatus, error) => {
        console.error('Ошибка при загрузке данных:', textStatus, error)
    })
})
