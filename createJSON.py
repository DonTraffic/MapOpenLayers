import json
import random
from datetime import datetime, timedelta

def create_geojson_feature(id):
    # Генерация атрибутов
    name = f"Feature {id}"
    area = round(random.uniform(10.0, 100.0), 2)  # Площадь от 10.0 до 100.0
    status = random.choice([True, False])  # Случайный статус
    date_create = (datetime.now() - timedelta(days=random.randint(0, 365))).date().isoformat()  # Случайная дата за последний год
    type_ = random.randint(1, 5)  # Случайный тип от 1 до 5
    latitude = random.uniform(-90, 90)  # Широта от -90 до 90
    longitude = random.uniform(-180, 180)  # Долгота от -180 до 180

    return {
        "type": "Feature",
        "properties": {
            "id": id,
            "name": name,
            "area": area,
            "status": status,
            "date_create": date_create,
            "type": type_
        },
        "geometry": {
            "type": "Point",
            "coordinates": [longitude, latitude]
        }
    }

def main():
    count = int(input("Введите количество объектов GeoJSON: "))
    features = [create_geojson_feature(i) for i in range(count)]
    
    geojson = {
        "type": "FeatureCollection",
        "features": features
    }
    
    with open('data.json', 'w') as f:
        json.dump(geojson, f, indent=2)

    print(f"Создано {count} объектов GeoJSON и сохранено в 'data.json'.")

if __name__ == "__main__":
    main()
