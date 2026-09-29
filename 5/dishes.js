const dishes = [
    {
        keyword: "fish-soup",
        name: "Креветочный суп",
        price: 310,
        category: "soup",
        count: "350 г",
        image: "images/fish-soup.jpg",
        kind: "fish"
    },
    {
        keyword: "salmon-soup",
        name: "Уха с лососем",
        price: 330,
        category: "soup",
        count: "350 г",
        image: "images/shrimp-soup.jpg",
        kind: "fish"
    },
    {
        keyword: "beef-soup",
        name: "Говяжий суп",
        price: 280,
        category: "soup",
        count: "350 г",
        image: "images/beef-soup.jpg",
        kind: "meat"
    },
    {
        keyword: "chicken-soup",
        name: "Куриный суп",
        price: 260,
        category: "soup",
        count: "350 г",
        image: "images/chicken-soup.jpg",
        kind: "meat"
    },
    {
        keyword: "vegetable-soup",
        name: "Овощной суп",
        price: 220,
        category: "soup",
        count: "300 г",
        image: "images/soup-vegetable.jpg",
        kind: "veg"
    },
    {
        keyword: "pumpkin-soup",
        name: "Тыквенный крем-суп",
        price: 240,
        category: "soup",
        count: "300 г",
        image: "images/soup-pumpkin.jpg",
        kind: "veg"
    },
    {
        keyword: "fish-rice",
        name: "Рыба с рисом",
        price: 420,
        category: "main-course",
        count: "350 г",
        image: "images/lunch.jpg",
        kind: "fish"
    },
    {
        keyword: "salmon-steak",
        name: "Стейк из лосося",
        price: 480,
        category: "main-course",
        count: "300 г",
        image: "images/salmon.jpg",
        kind: "fish"
    },
    {
        keyword: "beef-cutlet",
        name: "Говяжья котлета",
        price: 390,
        category: "main-course",
        count: "320 г",
        image: "images/beef.jpg",
        kind: "meat"
    },
    {
        keyword: "chicken-breast",
        name: "Куриная грудка",
        price: 360,
        category: "main-course",
        count: "320 г",
        image: "images/chicken.jpg",
        kind: "meat"
    },
    {
        keyword: "pesto-pasta",
        name: "Паста с песто",
        price: 350,
        category: "main-course",
        count: "300 г",
        image: "images/pasta.jpg",
        kind: "veg"
    },
    {
        keyword: "tomato-spaghetti",
        name: "Спагетти с томатным соусом",
        price: 330,
        category: "main-course",
        count: "300 г",
        image: "images/spaghetti.jpg",
        kind: "veg"
    },
    {
        keyword: "tuna-salad",
        name: "Салат с тунцом",
        price: 340,
        category: "starter",
        count: "220 г",
        image: "images/tuna-salad.jpg",
        kind: "fish"
    },
    {
        keyword: "chicken-caesar",
        name: "Цезарь с курицей",
        price: 320,
        category: "starter",
        count: "220 г",
        image: "images/caesar.jpg",
        kind: "meat"
    },
    {
        keyword: "greek-salad",
        name: "Греческий салат",
        price: 270,
        category: "starter",
        count: "220 г",
        image: "images/greek.jpg",
        kind: "veg"
    },
    {
        keyword: "vegetable-salad",
        name: "Овощной салат",
        price: 250,
        category: "starter",
        count: "200 г",
        image: "images/veggie-salad.jpg",
        kind: "veg"
    },
    {
        keyword: "french-fries",
        name: "Картофель фри",
        price: 190,
        category: "starter",
        count: "180 г",
        image: "images/fries.jpg",
        kind: "veg"
    },
    {
        keyword: "hummus",
        name: "Хумус с овощами",
        price: 260,
        category: "starter",
        count: "200 г",
        image: "images/hummus.jpg",
        kind: "veg"
    },
    {
        keyword: "orange-juice",
        name: "Апельсиновый сок",
        price: 120,
        category: "drink",
        count: "300 мл",
        image: "images/orange.jpg",
        kind: "cold"
    },
    {
        keyword: "lemonade",
        name: "Цитрусовый лимонад",
        price: 110,
        category: "drink",
        count: "300 мл",
        image: "images/lemonade.jpg",
        kind: "cold"
    },
    {
        keyword: "berry-drink",
        name: "Ягодный морс",
        price: 100,
        category: "drink",
        count: "300 мл",
        image: "images/berry-drink.jpg",
        kind: "cold"
    },
    {
        keyword: "green-tea",
        name: "Зелёный чай",
        price: 100,
        category: "drink",
        count: "300 мл",
        image: "images/green-tea.jpg",
        kind: "hot"
    },
    {
        keyword: "cappuccino",
        name: "Капучино",
        price: 150,
        category: "drink",
        count: "200 мл",
        image: "images/coffee.jpg",
        kind: "hot"
    },
    {
        keyword: "black-tea",
        name: "Чёрный чай",
        price: 90,
        category: "drink",
        count: "300 мл",
        image: "images/black-tea.jpg",
        kind: "hot"
    },
    {
        keyword: "cookies",
        name: "Печенье",
        price: 140,
        category: "dessert",
        count: "100 г",
        image: "images/cookies.jpg",
        kind: "small"
    },
    {
        keyword: "donut",
        name: "Пончик",
        price: 160,
        category: "dessert",
        count: "100 г",
        image: "images/donuts.jpg",
        kind: "small"
    },
    {
        keyword: "chocolate-brownie",
        name: "Шоколадное пирожное",
        price: 180,
        category: "dessert",
        count: "120 г",
        image: "images/brownie.jpg",
        kind: "small"
    },
    {
        keyword: "baklava",
        name: "Пахлава",
        price: 220,
        category: "dessert",
        count: "200 г",
        image: "images/baklava.jpg",
        kind: "medium"
    },
    {
        keyword: "cheesecake",
        name: "Чизкейк",
        price: 240,
        category: "dessert",
        count: "180 г",
        image: "images/cheesecake.jpg",
        kind: "medium"
    },
    {
        keyword: "chocolate-cake",
        name: "Шоколадный торт",
        price: 650,
        category: "dessert",
        count: "700 г",
        image: "images/chocolate-cake.jpg",
        kind: "large"
    }
];
