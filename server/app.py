"""Учебный API меню и заказов для сайта «Обед рядом»."""

import hashlib
import json
import os
import re
import sqlite3
import uuid
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from flask import Flask, g, jsonify, request
from werkzeug.exceptions import HTTPException


DISH_FIELDS = {
    "soup_id": "soup",
    "main_course_id": "main-course",
    "salad_id": "salad",
    "drink_id": "drink",
    "dessert_id": "dessert",
}
EDIT_FIELDS = {
    "full_name", "email", "phone", "delivery_address",
    "delivery_type", "delivery_time", "comment",
}
TEXT_LIMITS = {
    "full_name": 150, "email": 254, "phone": 40,
    "delivery_address": 500, "comment": 2000,
}


class ApiError(Exception):
    def __init__(self, message, status=400):
        self.message = message
        self.status = status


def moscow_now():
    return datetime.now(ZoneInfo("Europe/Moscow"))


def create_app(config=None):
    app = Flask(__name__)
    app.config.update(
        DATABASE=os.environ.get("OBED_DATABASE", "/var/lib/obed-api/orders.sqlite3"),
        MENU_FILE=os.environ.get("OBED_MENU", str(Path(__file__).with_name("menu.json"))),
        MAX_CONTENT_LENGTH=16384,
    )
    if config:
        app.config.update(config)

    with open(app.config["MENU_FILE"], encoding="utf-8") as source:
        menu = json.load(source)
    dish_by_id = {dish["id"]: dish for dish in menu}

    def get_db():
        if "db" not in g:
            g.db = sqlite3.connect(app.config["DATABASE"], timeout=10)
            g.db.row_factory = sqlite3.Row
            g.db.execute("PRAGMA foreign_keys = ON")
        return g.db

    @app.teardown_appcontext
    def close_db(_error):
        db = g.pop("db", None)
        if db is not None:
            db.close()

    def init_database():
        Path(app.config["DATABASE"]).parent.mkdir(parents=True, exist_ok=True)
        with app.app_context():
            db = get_db()
            db.execute("PRAGMA journal_mode = WAL")
            db.executescript("""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    key_hash TEXT NOT NULL UNIQUE
                );
                CREATE TABLE IF NOT EXISTS orders (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    student_id INTEGER NOT NULL REFERENCES users(id),
                    full_name TEXT NOT NULL,
                    email TEXT NOT NULL,
                    subscribe INTEGER NOT NULL DEFAULT 0 CHECK(subscribe IN (0, 1)),
                    phone TEXT NOT NULL,
                    delivery_address TEXT NOT NULL,
                    delivery_type TEXT NOT NULL CHECK(delivery_type IN ('now', 'by_time')),
                    delivery_time TEXT,
                    comment TEXT NOT NULL DEFAULT '',
                    soup_id INTEGER,
                    main_course_id INTEGER,
                    salad_id INTEGER,
                    drink_id INTEGER NOT NULL,
                    dessert_id INTEGER,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS orders_user_date
                ON orders(student_id, created_at DESC, id DESC);
            """)
            db.commit()

    def get_key_hash():
        key = request.args.get("api_key", "")
        try:
            parsed = uuid.UUID(key)
        except (ValueError, TypeError, AttributeError):
            raise ApiError("Для работы с заказами нужен корректный api_key (UUIDv4)", 401)
        if parsed.version != 4:
            raise ApiError("api_key должен быть UUIDv4", 401)
        return hashlib.sha256(str(parsed).encode()).hexdigest()

    def get_user_id(key_hash):
        row = get_db().execute(
            "SELECT id FROM users WHERE key_hash = ?", (key_hash,)
        ).fetchone()
        return row["id"] if row else None

    def serialize(row):
        result = dict(row)
        result["subscribe"] = bool(result["subscribe"])
        return result

    def find_owned_order(order_id, key_hash):
        user_id = get_user_id(key_hash)
        row = get_db().execute(
            "SELECT * FROM orders WHERE id = ? AND student_id = ?",
            (order_id, user_id),
        ).fetchone()
        if row is None:
            raise ApiError("Заказ не найден", 404)
        return serialize(row)

    def read_json():
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            raise ApiError("Передайте JSON-объект в теле запроса")
        return data

    def validate(data, old_order=None):
        allowed = EDIT_FIELDS if old_order else EDIT_FIELDS | set(DISH_FIELDS) | {"subscribe"}
        if set(data) - allowed:
            raise ApiError("В запросе есть недоступные для изменения поля")
        result = dict(old_order or {})
        result.update(data)

        for field, maximum in TEXT_LIMITS.items():
            value = result.get(field, "")
            if not isinstance(value, str):
                raise ApiError("Поле " + field + " должно быть строкой")
            value = value.strip()
            if field != "comment" and not value:
                raise ApiError("Заполните обязательное поле " + field)
            if len(value) > maximum:
                raise ApiError("Слишком длинное значение поля " + field)
            result[field] = value

        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", result["email"]):
            raise ApiError("Укажите корректный email")
        if len(re.sub(r"\D", "", result["phone"])) < 7:
            raise ApiError("Укажите корректный номер телефона")

        subscribe = result.get("subscribe", False)
        if type(subscribe) not in (bool, int) or subscribe not in (False, True, 0, 1):
            raise ApiError("subscribe должен быть равен 0 или 1")
        result["subscribe"] = bool(subscribe)

        for field, category in DISH_FIELDS.items():
            dish_id = result.get(field)
            if dish_id is not None:
                if type(dish_id) is not int or dish_id not in dish_by_id:
                    raise ApiError("Неизвестный идентификатор блюда: " + field)
                if dish_by_id[dish_id]["category"] != category:
                    raise ApiError("Блюдо не соответствует категории " + field)
            result[field] = dish_id

        if not result["drink_id"]:
            raise ApiError("Выберите напиток")
        if not (result["main_course_id"] or (result["soup_id"] and result["salad_id"])):
            raise ApiError("Выберите главное блюдо или суп вместе с салатом")

        if result.get("delivery_type") not in ("now", "by_time"):
            raise ApiError("delivery_type должен быть now или by_time")
        if result["delivery_type"] == "now":
            result["delivery_time"] = None
        else:
            value = result.get("delivery_time")
            if not isinstance(value, str) or not re.fullmatch(r"\d{2}:\d{2}", value):
                raise ApiError("Укажите время доставки в формате ЧЧ:ММ")
            hours, minutes = map(int, value.split(":"))
            total = hours * 60 + minutes
            if hours > 23 or minutes > 59 or minutes % 5 or not 420 <= total <= 1380:
                raise ApiError("Доставка доступна с 07:00 до 23:00 с шагом 5 минут")
            now = moscow_now()
            if total < now.hour * 60 + now.minute:
                raise ApiError("Время доставки не должно быть раньше текущего времени в Москве")

        return result

    @app.before_request
    def check_origin():
        origin = request.headers.get("Origin")
        allowed = {
            "http://82.23.173.175", "https://82.23.173.175", "https://hikurali.github.io"
        }
        local_origin = origin and re.fullmatch(r"http://(localhost|127\.0\.0\.1)(:\d+)?", origin)
        if origin and origin not in allowed and not local_origin:
            raise ApiError("Этот источник запросов не разрешён", 403)
        if request.method == "OPTIONS":
            return "", 204

    @app.after_request
    def set_headers(response):
        origin = request.headers.get("Origin")
        if origin and response.status_code != 403:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type"
            response.headers["Vary"] = "Origin"
        response.headers["Cache-Control"] = "no-store"
        response.headers["X-Content-Type-Options"] = "nosniff"
        return response

    @app.errorhandler(ApiError)
    def api_error(error):
        return jsonify(error=error.message), error.status

    @app.errorhandler(HTTPException)
    def http_error(error):
        return jsonify(error=error.description), error.code

    @app.get("/labs/api/health")
    def health():
        get_db().execute("SELECT 1").fetchone()
        return jsonify(status="ok")

    @app.get("/labs/api/dishes")
    def all_dishes():
        return jsonify(menu)

    @app.get("/labs/api/dishes/<int:dish_id>")
    def one_dish(dish_id):
        if dish_id not in dish_by_id:
            raise ApiError("Блюдо не найдено", 404)
        return jsonify(dish_by_id[dish_id])

    @app.get("/labs/api/orders")
    def all_orders():
        user_id = get_user_id(get_key_hash())
        rows = get_db().execute(
            "SELECT * FROM orders WHERE student_id = ? ORDER BY created_at DESC, id DESC",
            (user_id,),
        ).fetchall()
        return jsonify([serialize(row) for row in rows])

    @app.get("/labs/api/orders/<int:order_id>")
    def one_order(order_id):
        return jsonify(find_owned_order(order_id, get_key_hash()))

    @app.post("/labs/api/orders")
    def create_order():
        key_hash = get_key_hash()
        data = validate(read_json())
        db = get_db()
        with db:
            db.execute("BEGIN IMMEDIATE")
            db.execute("INSERT OR IGNORE INTO users (key_hash) VALUES (?)", (key_hash,))
            user_id = get_user_id(key_hash)
            count = db.execute(
                "SELECT count(*) FROM orders WHERE student_id = ?", (user_id,)
            ).fetchone()[0]
            if count >= 10:
                raise ApiError("Можно сохранить не более 10 заказов. Удалите один из старых.", 409)
            date = moscow_now().isoformat(timespec="seconds")
            fields = [
                "full_name", "email", "subscribe", "phone", "delivery_address",
                "delivery_type", "delivery_time", "comment", *DISH_FIELDS,
            ]
            values = [data[field] for field in fields] + [user_id, date, date]
            names = ", ".join(fields + ["student_id", "created_at", "updated_at"])
            placeholders = ", ".join("?" for _value in values)
            row = db.execute(
                "INSERT INTO orders (" + names + ") VALUES (" + placeholders + ")", values
            )
            order_id = row.lastrowid
        return jsonify(find_owned_order(order_id, key_hash)), 201

    @app.put("/labs/api/orders/<int:order_id>")
    def edit_order(order_id):
        key_hash = get_key_hash()
        db = get_db()
        with db:
            db.execute("BEGIN IMMEDIATE")
            old_order = find_owned_order(order_id, key_hash)
            data = validate(read_json(), old_order)
            fields = sorted(EDIT_FIELDS)
            assignments = ", ".join(field + " = ?" for field in fields)
            values = [data[field] for field in fields]
            values += [moscow_now().isoformat(timespec="seconds"), order_id, old_order["student_id"]]
            db.execute(
                "UPDATE orders SET " + assignments
                + ", updated_at = ? WHERE id = ? AND student_id = ?", values
            )
        return jsonify(find_owned_order(order_id, key_hash))

    @app.delete("/labs/api/orders/<int:order_id>")
    def delete_order(order_id):
        key_hash = get_key_hash()
        db = get_db()
        with db:
            db.execute("BEGIN IMMEDIATE")
            order = find_owned_order(order_id, key_hash)
            db.execute("DELETE FROM orders WHERE id = ? AND student_id = ?", (order_id, order["student_id"]))
        return jsonify(order)

    init_database()
    return app


if __name__ == "__main__":
    application = create_app()
    application.run(host="127.0.0.1", port=8772)
