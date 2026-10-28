import copy
import tempfile
import unittest
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from pathlib import Path
from unittest.mock import patch
from zoneinfo import ZoneInfo

from app import create_app


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory(prefix="obed-api-test-")
        self.database = str(Path(self.directory.name) / "orders.sqlite3")
        self.config = {"TESTING": True, "DATABASE": self.database}
        self.app = create_app(self.config)
        self.client = self.app.test_client()
        self.key = str(uuid.uuid4())
        self.other_key = str(uuid.uuid4())
        self.payload = {
            "full_name": "Тестовый получатель", "email": "test@example.com",
            "subscribe": True, "phone": "+70000000000",
            "delivery_address": "Учебный адрес", "delivery_type": "now",
            "comment": "Комментарий", "main_course_id": 7, "drink_id": 19,
        }

    def tearDown(self):
        self.directory.cleanup()

    def url(self, path="/orders", key=None):
        return "/labs/api" + path + "?api_key=" + (key or self.key)

    def create_order(self, payload=None):
        response = self.client.post(self.url(), json=payload or self.payload)
        self.assertEqual(response.status_code, 201, response.json)
        return response.json

    def test_menu_shape_and_types(self):
        response = self.client.get("/labs/api/dishes")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json), 30)
        self.assertEqual(len({dish["id"] for dish in response.json}), 30)
        for category in ["soup", "main-course", "salad", "drink", "dessert"]:
            self.assertEqual(sum(dish["category"] == category for dish in response.json), 6)
        self.assertEqual(self.client.get("/labs/api/dishes/1").json["id"], 1)
        self.assertEqual(self.client.get("/labs/api/dishes/9999").status_code, 404)

    def test_key_required_and_private_orders(self):
        self.assertEqual(self.client.get("/labs/api/orders").status_code, 401)
        self.assertEqual(self.client.get("/labs/api/orders?api_key=guess").status_code, 401)
        order = self.create_order()
        self.assertEqual(self.client.get(self.url()).json[0]["id"], order["id"])
        self.assertEqual(self.client.get(self.url(key=self.other_key)).json, [])
        foreign = self.url("/orders/" + str(order["id"]), key=self.other_key)
        self.assertEqual(self.client.get(foreign).status_code, 404)
        self.assertEqual(self.client.put(foreign, json={"comment": "Чужой"}).status_code, 404)
        self.assertEqual(self.client.delete(foreign).status_code, 404)
        self.assertEqual(len(self.client.get(self.url()).json), 1)

    def test_create_edit_delete_and_serialization(self):
        order = self.create_order()
        self.assertIs(order["subscribe"], True)
        self.assertIsNone(order["soup_id"])
        self.assertIsNone(order["delivery_time"])
        route = self.url("/orders/" + str(order["id"]))
        response = self.client.put(route, json={"full_name": "Изменённый получатель", "comment": "Изменено"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["full_name"], "Изменённый получатель")
        self.assertEqual(response.json["created_at"], order["created_at"])
        self.assertEqual(response.json["main_course_id"], order["main_course_id"])
        self.assertEqual(self.client.delete(route).status_code, 200)
        self.assertEqual(self.client.get(self.url()).json, [])
        self.assertEqual(self.client.delete(route).status_code, 404)

    def test_database_survives_application_restart(self):
        order = self.create_order()
        restarted = create_app(self.config).test_client()
        self.assertEqual(restarted.get(self.url()).json[0]["id"], order["id"])

    def test_combo_validation_for_all_category_sets(self):
        fields = ["soup_id", "main_course_id", "salad_id", "drink_id", "dessert_id"]
        identifiers = [1, 7, 13, 19, 25]
        for mask in range(32):
            payload = {key: value for key, value in self.payload.items() if key not in fields}
            for bit, field in enumerate(fields):
                if mask & (1 << bit):
                    payload[field] = identifiers[bit]
            expected = bool(mask & 8 and (mask & 2 or (mask & 1 and mask & 4)))
            response = self.client.post(self.url(key=str(uuid.uuid4())), json=payload)
            self.assertEqual(response.status_code, 201 if expected else 400, (mask, response.json))

    def test_required_fields_and_dish_category(self):
        for field in ["full_name", "email", "phone", "delivery_address"]:
            payload = dict(self.payload, **{field: ""})
            self.assertEqual(self.client.post(self.url(), json=payload).status_code, 400)
        for update in [
            {"email": "bad"}, {"drink_id": 7}, {"drink_id": "19"},
            {"main_course_id": 999}, {"subscribe": 3}, {"id": 42},
        ]:
            self.assertEqual(self.client.post(self.url(), json=dict(self.payload, **update)).status_code, 400)
        response = self.client.post(self.url(), data="text", content_type="text/plain")
        self.assertEqual(response.status_code, 400)

    def test_delivery_time_and_switch_to_now(self):
        fixed = datetime(2026, 10, 28, 12, 3, tzinfo=ZoneInfo("Europe/Moscow"))
        with patch("app.moscow_now", return_value=fixed):
            for time in [None, "12:00", "12:06", "06:55", "23:05", "29:00"]:
                payload = dict(self.payload, delivery_type="by_time", delivery_time=time)
                self.assertEqual(self.client.post(self.url(), json=payload).status_code, 400, time)
            payload = dict(self.payload, delivery_type="by_time", delivery_time="12:05")
            order = self.create_order(payload)
            response = self.client.put(self.url("/orders/" + str(order["id"])), json={"delivery_type": "now"})
            self.assertEqual(response.status_code, 200)
            self.assertIsNone(response.json["delivery_time"])

    def test_edit_cannot_change_composition_or_server_fields(self):
        order = self.create_order()
        route = self.url("/orders/" + str(order["id"]))
        for update in [{"drink_id": 20}, {"student_id": 42}, {"created_at": "2000-01-01"}]:
            self.assertEqual(self.client.put(route, json=update).status_code, 400)

    def test_order_limit_is_atomic(self):
        def create_one(_index):
            with self.app.test_client() as client:
                return client.post(self.url(), json=copy.deepcopy(self.payload)).status_code
        with ThreadPoolExecutor(max_workers=5) as executor:
            statuses = list(executor.map(create_one, range(14)))
        self.assertEqual(statuses.count(201), 10)
        self.assertEqual(statuses.count(409), 4)
        self.assertEqual(len(self.client.get(self.url()).json), 10)

    def test_cors(self):
        response = self.client.options(self.url(), headers={
            "Origin": "https://hikurali.github.io",
            "Access-Control-Request-Method": "PUT",
            "Access-Control-Request-Headers": "Content-Type",
        })
        self.assertEqual(response.status_code, 204)
        self.assertEqual(response.headers["Access-Control-Allow-Origin"], "https://hikurali.github.io")
        response = self.client.get("/labs/api/dishes", headers={"Origin": "https://unrelated.example"})
        self.assertEqual(response.status_code, 403)
        self.assertNotIn("Access-Control-Allow-Origin", response.headers)


if __name__ == "__main__":
    unittest.main(verbosity=2)
