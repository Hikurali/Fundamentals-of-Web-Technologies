const form = document.querySelector(".order-form");

function getNotificationText() {
    const soup = document.getElementById("soup-keyword").value !== "";
    const mainCourse = document.getElementById("main-course-keyword").value !== "";
    const starter = document.getElementById("starter-keyword").value !== "";
    const drink = document.getElementById("drink-keyword").value !== "";
    const dessert = document.getElementById("dessert-keyword").value !== "";

    if (!soup && !mainCourse && !starter && !drink && !dessert) {
        return "Ничего не выбрано. Выберите блюда для заказа";
    }

    if (!soup && !mainCourse && !starter) {
        return "Выберите главное блюдо";
    }

    if (soup && !mainCourse && !starter) {
        return "Выберите главное блюдо/салат/стартер";
    }

    if (starter && !soup && !mainCourse) {
        return "Выберите суп или главное блюдо";
    }

    if (!drink) {
        return "Выберите напиток";
    }

    return "";
}

function showNotification(text) {
    const oldNotification = document.querySelector(".notification");

    if (oldNotification !== null) {
        oldNotification.remove();
    }

    const notification = document.createElement("div");
    notification.className = "notification";

    const message = document.createElement("p");
    message.className = "notification-text";
    message.textContent = text;

    const button = document.createElement("button");
    button.className = "notification-button";
    button.type = "button";
    button.textContent = "Окей 👌";

    notification.append(message, button);
    document.body.append(notification);

    button.addEventListener("click", function () {
        notification.remove();
    });
}

form.addEventListener("submit", function (event) {
    const notificationText = getNotificationText();

    if (notificationText !== "") {
        event.preventDefault();
        showNotification(notificationText);
        return;
    }

    if (!form.checkValidity()) {
        event.preventDefault();
        form.reportValidity();
    }
});
