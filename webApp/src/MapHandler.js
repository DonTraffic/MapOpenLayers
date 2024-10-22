import 'ol/ol.css'
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';
import { Style, Fill, Stroke, Circle as CircleStyle } from 'ol/style';
import Overlay from 'ol/Overlay';
import { click } from 'ol/events/condition';
import Select from 'ol/interaction/Select';
import $ from 'jquery';

export default class MapHandler {
    constructor(dataGEO) {
        // Глобальные переменные
        this.dataGEO = dataGEO;
        this.vectorSource = new VectorSource();
        this.vectorLayer = new VectorLayer({ source: this.vectorSource })
        this.map = this.createMap();
        this.popupHTML = $('#map__popup');
        this.popup = this.createPopup();
        this.selectClick = this.createSelectInteraction();
        
        // Инициализация стиля для маркеров
        this.defaultStyle = new Style({
            image: new CircleStyle({
                radius: 7,
                fill: new Fill({ color: '#e2e2e2' }),
                stroke: new Stroke({ color: '#f02222', width: 1.5 })
            })
        });
        this.selectedStyle = new Style({
            image: new CircleStyle({
                radius: 7,
                fill: new Fill({ color: '#f02222' }),
                stroke: new Stroke({ color: '#e2e2e2', width: 1.5 })
            })
        });
    }

    // Создание карты и слоёв
    createMap() {
        const map = new Map({
            view: new View({
                center: fromLonLat([this.dataGEO[0].geometry.coordinates[0], this.dataGEO[0].geometry.coordinates[1]]),
                zoom: 4,
            }),
            layers: [new TileLayer({ source: new OSM() })],
            target: 'map'
        });
        map.addLayer(this.vectorLayer)

        return map
    }

    // Создание попапа
    createPopup() {
        const overlay = new Overlay({
            element: this.popupHTML[0],
            autoPan: true,
            autoPanAnimation: { duration: 250 },
        });
        this.map.addOverlay(overlay);
        return overlay;
    }

    // Создание Селекта для прослушки кликов по маркеру
    createSelectInteraction() {
        const selectClick = new Select({ condition: click });
        this.map.addInteraction(selectClick);
        selectClick.on('select', (e) => this.handleSelect(e));
        return selectClick;
    }

    // Чистим стили маркеров и активируем нужный 
    handleSelect(event) {
        const features = this.vectorSource.getFeatures();
        features.forEach((feature) => feature.setStyle(this.defaultStyle));
        
        if (event.selected.length) {
            event.selected[0].setStyle(this.selectedStyle);
            this.openPopup(event.selected[0].get('data'));
        } else {
            this.popupHTML.hide();
        }
    }

    // Заполняем попап информацией и открываем
    openPopup(data) {
        this.popup.setPosition(fromLonLat(data.geometry.coordinates));
        this.popupHTML.html(`
            <p>${data.properties.id} | ${data.properties.name}</p></br>
            <p>Дата создания: ${data.properties.date_create}</p>
            <p>Область: ${data.properties.area}</p>
            <p>Тип: ${data.properties.type}</p>
            <p>Статус: ${data.properties.status}</p></br>
            <p>Долгота: ${data.geometry.coordinates[0]}</p>
            <p>Широта: ${data.geometry.coordinates[1]}</p>
        `);
        this.popupHTML.show();
    }

    // Чистим карту от маркеров и попапа
    clearAll() {
        this.vectorSource.clear();
        this.popupHTML.hide();
    }

    // Рисуем маркер
    printMarker(marker) {
        const feature = new Feature({
            geometry: new Point(fromLonLat(marker.geometry.coordinates)),
            data: marker,
        });
        feature.setStyle(this.defaultStyle);
        this.vectorSource.addFeature(feature);
    }

    // Ищем и выбираем маркер по координатам
    selectMarkerByCoordinates(coordinates) {
        // Чистим Селекторы
        this.selectClick.getFeatures().clear()

        // Переводим координаты
        const transformedCoordinates = fromLonLat(coordinates);

        // Ищем маркер по координатам
        const features = this.vectorSource.getFeatures();
        let selectedFeature = false;

        features.forEach((feature) => {
            feature.setStyle(this.defaultStyle);

            const featureCoordinates = feature.getGeometry().getCoordinates();
            if (
                featureCoordinates[0] === transformedCoordinates[0] && 
                featureCoordinates[1] === transformedCoordinates[1]
            ) selectedFeature = feature;
        })

        // Если нашли, то применяем стиль и открываем попап
        if (selectedFeature) {
            this.map.getView().animate({ 
                center: transformedCoordinates, 
                zoom: 5, 
                duration: 1000 
            });
            selectedFeature.setStyle(this.selectedStyle);
            this.openPopup(selectedFeature.get('data'));
        }
    }
}
