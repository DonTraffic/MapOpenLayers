import $ from 'jquery'
import './styles.scss'

import 'ol/ol.css'
import {Map, View} from 'ol'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import {fromLonLat} from 'ol/proj'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import { Style, Fill, Stroke, Circle as CircleStyle } from 'ol/style'
import Overlay from 'ol/Overlay'
import {click} from 'ol/events/condition'
import Select from 'ol/interaction/Select'

// Применение стиля для маркеров
const defaultStyle = new Style({
    image: new CircleStyle({
        radius: 7, // Размер маркера
        fill: new Fill({
            color: '#e2e2e2' // Цвет заливки (например, красный)
        }),
        stroke: new Stroke({
            color: '#f02222', // Цвет обводки (например, черный)
            width: 1.5 // Толщина обводки
        })
    })
})

const selectedStyle = new Style({
    image: new CircleStyle({
        radius: 7, // Размер маркера
        fill: new Fill({
            color: '#f02222' // Цвет заливки для выбранного маркера (например, зеленый)
        }),
        stroke: new Stroke({
            color: '#e2e2e2', // Цвет обводки (например, черный)
            width: 1.5 // Толщина обводки
        })
    })
})

$(document).ready(function() {
    // Глобальные переменные
    let dataGEO
    let dataGEOResult
    let map
    let view
    let vectorSource
    let selectClick
    let popupOverlay
    let popup = $('#map__popup')
    let sidebar = $('#sidebar__result')

    // получаем сген. данные
    $.getJSON('data.json', (result) => {
        dataGEOResult = dataGEO = result.features
        createMap()
    }).fail((jqxhr, textStatus, error) => {
        console.error('Ошибка при загрузке данных:', textStatus, error)
    })

    // Создание карты и её слоёв
    function createMap() {
        map = new Map({
            view: new View({
                center: fromLonLat([
                    dataGEO[0].geometry.coordinates[0], 
                    dataGEO[0].geometry.coordinates[1]
                ]),
                zoom: 4,
            }),
            layers: [
                new TileLayer({
                    source: new OSM(),
                })
            ],
            target: 'map',
        })

        view = map.getView()
        vectorSource = new VectorSource()
        const vectorLayer = new VectorLayer({
            source: vectorSource
        })
        map.addLayer(vectorLayer)
        updateMapResult()
    
        // Создаём попап
        popupOverlay = new Overlay({
            element: popup[0],
            autoPan: true,
            autoPanAnimation: {
                duration: 250,
            },
        })
        map.addOverlay(popupOverlay)
    
        // Обработчик клика по маркеру
        selectClick = new Select({
            condition: click,
        })
        map.addInteraction(selectClick)
    
        selectClick.on('select', function(e) {
            const features = vectorSource.getFeatures()

            // Сброс стиля всех маркеров
            features.forEach(feature => {
                feature.setStyle(defaultStyle)
            })
    
            // Применяем новый стиль для выбранных маркеров
            e.selected.forEach(selectedFeature => {
                selectedFeature.setStyle(selectedStyle)
                openPopup(selectedFeature.get('data'))
            })
    
            // Если нет выбранных маркеров, скрываем попап
            if (e.selected.length === 0) popup.hide()
        })
    }


    // Обнавляем карту (маркеры, item для sidebar)
    function updateMapResult() {
        // Чистим
        $(sidebar).empty()
        vectorSource.clear()
        popup.hide()

        // Проходим по каждому объекту добавляя на карту и бок. панель
        $.each(dataGEOResult, (index, item) => {
            // маркер для карты
            const feature = new Feature({
                geometry: new Point(fromLonLat(item.geometry.coordinates)),
                data: item
            })

            // Устанавливаем начальный стиль маркера
            feature.setStyle(defaultStyle)

            // Добавляем маркер в источник
            vectorSource.addFeature(feature)

            // item для sidebar
            $(sidebar).append(`
                <div class="sidebar__result-item" data-coord="${item.geometry.coordinates}">
                    <p>${item.properties.id}</p>
                    <span>|</span>
                    <p>${item.properties.name}</p>
                </div>
            `)
        })
    }

    // Открываем sidebar
    function openPopup(data) {
        popupOverlay.setPosition(fromLonLat(data.geometry.coordinates))
        popup.html(`
            <p>${data.properties.id} | ${data.properties.name}</p></br>

            <p>Дата создания: ${data.properties.date_create}</p>
            <p>Область: ${data.properties.area}</p>
            <p>Тип: ${data.properties.type}</p>
            <p>Статус: ${data.properties.status}</p></br>

            <p>Долгота: ${data.geometry.coordinates[0]}</p>
            <p>Широта: ${data.geometry.coordinates[1]}</p>
        `)
        popup.show()
    }


    // Делаем маркер активным по координатам
    function selectMarkerByCoordinates(coordinates) {
        selectClick.getFeatures().clear()

        const transformedCoordinates = fromLonLat(coordinates)
    
        // Найти маркер по координатам
        const features = vectorSource.getFeatures()
        let selectedFeature = false
        features.forEach(function(feature) {
            feature.setStyle(defaultStyle)

            const featureCoordinates = feature.getGeometry().getCoordinates()
            if (
                featureCoordinates[0] === transformedCoordinates[0] && 
                featureCoordinates[1] === transformedCoordinates[1]
            ) selectedFeature = feature
        })

        if (!selectedFeature) return
    
        // Применяем стиль и открываем попап
        view.animate({
            center: transformedCoordinates,
            zoom: 5,
            duration: 1000
        })
        selectedFeature.setStyle(selectedStyle)
        openPopup(selectedFeature.get('data'))
    }

    // Обработка клик по item в sidebar
    $(sidebar).on('click', '.sidebar__result-item', (e) => {
        selectMarkerByCoordinates($(e.currentTarget).data('coord').split(','))
    })


    // Функция для поиска объекта по id и/или name
    function searchObject(searchTerm) {
        // является ли введенное значение числом (если это число (id), то ищем сразу)
        if (!isNaN(searchTerm) && searchTerm != '') {
            return dataGEO.filter(item => { 
                return item.properties.id == searchTerm 
            })
        }

        // Возвращаем всё, если меньше 3х символов
        if (searchTerm.length < 3) return dataGEO

        // Поиск по name, если строка состоит из букв и длина >= 3
        return dataGEO.filter(item => {
            return item.properties.name.toLowerCase().includes(searchTerm.toLowerCase())
        })
    }

    // Обработка ввода в поле
    $('#sidebar__input').on('input', () => {
        dataGEOResult = searchObject($('#sidebar__input').val())
        updateMapResult()
    })
})
