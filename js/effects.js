// Эффект снежинок для фона
document.addEventListener('DOMContentLoaded', function() {
    // Создаем канвасы для снежинок и следа мыши
    const snowCanvas = document.getElementById('snow-canvas');
    const mouseTrailCanvas = document.getElementById('mouse-trail');
    
    // Проверяем существование канвасов
    if (!snowCanvas || !mouseTrailCanvas) {
        console.error('Canvas elements not found');
        return;
    }
    
    const snowCtx = snowCanvas.getContext('2d');
    const trailCtx = mouseTrailCanvas.getContext('2d');
    
    // Устанавливаем размер canvas равный размеру окна
    function resizeCanvases() {
        snowCanvas.width = window.innerWidth;
        snowCanvas.height = window.innerHeight;
        mouseTrailCanvas.width = window.innerWidth;
        mouseTrailCanvas.height = window.innerHeight;
    }
    
    window.addEventListener('resize', resizeCanvases);
    resizeCanvases();
    
    // === СНЕЖИНКИ ===
    const snowflakes = [];
    const snowflakeCount = 200; // Количество снежинок
    
    // Класс снежинки
    class Snowflake {
        constructor() {
            this.reset();
            this.y = Math.random() * snowCanvas.height;
        }
        
        reset() {
            this.x = Math.random() * snowCanvas.width;
            this.y = Math.random() * -100; // Начинаем выше экрана
            this.size = Math.random() * 4 + 1; // Размер от 1 до 5
            this.speed = Math.random() * 1.5 + 0.5; // Скорость падения
            this.wind = Math.random() * 0.8 - 0.4; // Движение в стороны
            this.opacity = Math.random() * 0.6 + 0.3; // Прозрачность
            this.wobble = Math.random() * 0.05; // Колебания
            this.wobbleSpeed = Math.random() * 0.02 + 0.01;
            this.wobbleOffset = Math.random() * Math.PI * 2;
        }
        
        update() {
            // Движение вниз
            this.y += this.speed;
            
            // Движение в стороны (ветер)
            this.x += this.wind;
            
            // Колебания
            this.x += Math.sin(Date.now() * this.wobbleSpeed + this.wobbleOffset) * this.wobble;
            
            // Если снежинка упала за нижнюю границу
            if (this.y > snowCanvas.height) {
                this.reset();
                this.y = -10;
            }
            
            // Если снежинка ушла за боковые границы
            if (this.x > snowCanvas.width + 10) {
                this.x = -10;
            } else if (this.x < -10) {
                this.x = snowCanvas.width + 10;
            }
        }
        
        draw() {
            snowCtx.beginPath();
            
            // Рисуем снежинку как круг с градиентом
            const gradient = snowCtx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, this.size
            );
            
            gradient.addColorStop(0, `rgba(255, 255, 255, ${this.opacity})`);
            gradient.addColorStop(0.5, `rgba(255, 255, 255, ${this.opacity * 0.5})`);
            gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
            
            snowCtx.fillStyle = gradient;
            snowCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            snowCtx.fill();
            
            // Добавляем небольшое свечение
            snowCtx.beginPath();
            snowCtx.arc(this.x, this.y, this.size * 1.5, 0, Math.PI * 2);
            snowCtx.fillStyle = `rgba(255, 255, 255, ${this.opacity * 0.2})`;
            snowCtx.fill();
        }
    }
    
    // Создаем снежинки
    for (let i = 0; i < snowflakeCount; i++) {
        snowflakes.push(new Snowflake());
    }
    
    // === СЛЕД ОТ МЫШИ (СНЕЖНЫЙ СЛЕД) ===
    const trailPoints = [];
    const maxTrailPoints = 25;
    let mouseX = snowCanvas.width / 2;
    let mouseY = snowCanvas.height / 2;
    let lastMouseX = mouseX;
    let lastMouseY = mouseY;
    
    // Класс точки следа
    class TrailPoint {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.size = Math.random() * 5 + 3; // Размер от 3 до 8
            this.life = 1.0; // Начальная "жизнь"
            this.decay = 0.03; // Скорость исчезновения
            this.color = {
                r: 180 + Math.random() * 75,
                g: 200 + Math.random() * 55,
                b: 255
            };
            this.wobbleX = Math.random() * 2 - 1;
            this.wobbleY = Math.random() * 2 - 1;
        }
        
        update() {
            this.life -= this.decay;
            this.size *= 0.97; // Постепенно уменьшаем размер
            this.x += this.wobbleX * (1 - this.life);
            this.y += this.wobbleY * (1 - this.life);
            return this.life > 0;
        }
        
        draw() {
            const alpha = this.life;
            const gradient = trailCtx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, this.size
            );
            
            gradient.addColorStop(0, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${alpha})`);
            gradient.addColorStop(0.5, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${alpha * 0.5})`);
            gradient.addColorStop(1, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0)`);
            
            trailCtx.fillStyle = gradient;
            trailCtx.beginPath();
            trailCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            trailCtx.fill();
            
            // Добавляем дополнительные частицы вокруг
            if (this.life > 0.7) {
                for (let i = 0; i < 3; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const distance = Math.random() * this.size * 0.5;
                    const smallX = this.x + Math.cos(angle) * distance;
                    const smallY = this.y + Math.sin(angle) * distance;
                    const smallSize = this.size * 0.3;
                    
                    trailCtx.beginPath();
                    trailCtx.arc(smallX, smallY, smallSize, 0, Math.PI * 2);
                    trailCtx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${alpha * 0.3})`;
                    trailCtx.fill();
                }
            }
        }
    }
    
    // Обработчик движения мыши
    document.addEventListener('mousemove', function(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    
    // Добавляем снежинки при движении мыши
    document.addEventListener('mousemove', function(e) {
        // С небольшой вероятностью создаем дополнительную снежинку
        if (Math.random() > 0.8) {
            const extraSnowflake = new Snowflake();
            extraSnowflake.x = e.clientX + (Math.random() * 60 - 30);
            extraSnowflake.y = e.clientY + (Math.random() * 60 - 30);
            extraSnowflake.size = Math.random() * 3 + 1;
            extraSnowflake.speed = Math.random() * 0.8 + 0.2;
            extraSnowflake.opacity = Math.random() * 0.4 + 0.2;
            
            snowflakes.push(extraSnowflake);
            
            // Ограничиваем общее количество снежинок
            if (snowflakes.length > snowflakeCount * 2) {
                snowflakes.shift();
            }
        }
    });
    
    // Анимация
    let lastTime = 0;
    const fps = 60;
    const interval = 1000 / fps;
    
    function animate(currentTime) {
        requestAnimationFrame(animate);
        
        const deltaTime = currentTime - lastTime;
        if (deltaTime < interval) return;
        
        lastTime = currentTime - (deltaTime % interval);
        
        // Очищаем снежный канвас с легким затуханием
        snowCtx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        snowCtx.fillRect(0, 0, snowCanvas.width, snowCanvas.height);
        
        // Очищаем канвас следа с затуханием
        trailCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        trailCtx.fillRect(0, 0, mouseTrailCanvas.width, mouseTrailCanvas.height);
        
        // Обновляем и рисуем снежинки
        snowflakes.forEach(snowflake => {
            snowflake.update();
            snowflake.draw();
        });
        
        // Добавляем новую точку следа если мышь достаточно переместилась
        const distance = Math.sqrt(
            Math.pow(mouseX - lastMouseX, 2) + 
            Math.pow(mouseY - lastMouseY, 2)
        );
        
        if (distance > 3) {
            trailPoints.push(new TrailPoint(mouseX, mouseY));
            lastMouseX = mouseX;
            lastMouseY = mouseY;
            
            // Ограничиваем количество точек
            if (trailPoints.length > maxTrailPoints) {
                trailPoints.shift();
            }
        }
        
        // Обновляем и рисуем точки следа
        for (let i = 0; i < trailPoints.length; i++) {
            if (!trailPoints[i].update()) {
                // Если точка "умерла", удаляем ее
                trailPoints.splice(i, 1);
                i--;
            } else {
                trailPoints[i].draw();
            }
        }
        
        // Добавляем дополнительные эффекты при движении мыши
        if (distance > 5 && trailPoints.length > 0) {
            // Создаем маленькие снежинки вдоль следа
            const lastPoint = trailPoints[trailPoints.length - 1];
            if (Math.random() > 0.7) {
                const miniSnowflake = {
                    x: lastPoint.x + (Math.random() * 20 - 10),
                    y: lastPoint.y + (Math.random() * 20 - 10),
                    size: Math.random() * 2 + 1,
                    opacity: Math.random() * 0.3 + 0.1,
                    life: 1.0
                };
                
                // Рисуем мини-снежинку
                trailCtx.beginPath();
                trailCtx.arc(miniSnowflake.x, miniSnowflake.y, miniSnowflake.size, 0, Math.PI * 2);
                trailCtx.fillStyle = `rgba(255, 255, 255, ${miniSnowflake.opacity})`;
                trailCtx.fill();
            }
        }
    }
    
    // Запускаем анимацию
    animate(0);
    
    // Добавляем эффекты для мобильных устройств
    if ('ontouchstart' in window) {
        // Для тач-устройств добавляем случайные снежинки при тапе
        document.addEventListener('touchstart', function(e) {
            const touch = e.touches[0];
            for (let i = 0; i < 10; i++) {
                const snowflake = new Snowflake();
                snowflake.x = touch.clientX + (Math.random() * 100 - 50);
                snowflake.y = touch.clientY + (Math.random() * 100 - 50);
                snowflakes.push(snowflake);
            }
            
            // Ограничиваем общее количество
            if (snowflakes.length > snowflakeCount * 3) {
                snowflakes.splice(0, 50);
            }
        });
    }
    
    // Функция для добавления снежинок в случайных местах
    function addRandomSnowflakes(count) {
        for (let i = 0; i < count; i++) {
            const snowflake = new Snowflake();
            snowflake.x = Math.random() * snowCanvas.width;
            snowflake.y = Math.random() * snowCanvas.height;
            snowflakes.push(snowflake);
        }
    }
    
    // Добавляем начальные снежинки
    addRandomSnowflakes(50);
    
    // Консольный лог для отладки
    console.log('❄️ Эффект снега запущен!');
    console.log(`Снежинок: ${snowflakes.length}`);
});

